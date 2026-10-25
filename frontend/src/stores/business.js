import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import { sessionStore } from './session'
import {
  mockBusinessSettings,
  mockInventory,
  mockInvoices,
  mockTransactions,
  mockPaymentReminders,
  mockPromotions,
  mockUsers,
  initialChangeRequests,
} from '@/data/mockBusinessData'

export const useBusinessStore = defineStore('business-store', () => {
  // Helper to load or initialize from localStorage
  function loadStorage(key, fallback) {
    try {
      const stored = localStorage.getItem(`crestara_${key}`)
      return stored ? JSON.parse(stored) : fallback
    } catch {
      return fallback
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(`crestara_${key}`, JSON.stringify(value))
    } catch (e) {
      console.warn(`Could not save crestara_${key} to localStorage:`, e)
    }
  }

  // Reactive state
  const settings = ref(loadStorage('settings', mockBusinessSettings))
  const inventory = ref(loadStorage('inventory', mockInventory))
  const invoices = ref(loadStorage('invoices', mockInvoices))
  const transactions = ref(loadStorage('transactions', mockTransactions))
  const reminders = ref(loadStorage('reminders', mockPaymentReminders))
  const promotions = ref(loadStorage('promotions', mockPromotions))
  const users = ref(loadStorage('users', mockUsers))
  const changeRequests = ref(loadStorage('change_requests', initialChangeRequests))

  // Role: 'Administrator' | 'Staff' | 'Customer'
  const currentRole = ref(localStorage.getItem('crestara_current_role') || 'Administrator')

  function setRole(role) {
    if (['Administrator', 'Staff', 'Customer'].includes(role)) {
      currentRole.value = role
      localStorage.setItem('crestara_current_role', role)
    }
  }

  const currentUser = computed(() => {
    try {
      const session = sessionStore()
      if (session.isLoggedIn && (session.userProfile || session.currentUser)) {
        const email = session.currentUser?.email || session.user
        const meta = session.currentUser?.user_metadata || {}
        const profile = session.userProfile || {}
        const fallbackName = typeof email === 'string' ? email.split('@')[0] : 'User'
        return {
          id: session.currentUser?.id || profile.id || 'current-user',
          email: email,
          full_name: profile.full_name || meta.full_name || fallbackName,
          first_name: profile.first_name || meta.first_name || fallbackName,
          last_name: profile.last_name || meta.last_name || '',
          role: profile.role || meta.role || currentRole.value,
          avatar: profile.avatar_url || meta.avatar_url || null,
          phone: profile.phone || meta.phone || '',
          organization: profile.organization || meta.organization || 'Client Account',
          company: profile.organization || meta.organization || 'Client Account',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          zip: profile.zip || '',
          tax_id: profile.tax_id || '',
        }
      }
    } catch (e) {
      // ignore
    }

    return users.value.find((u) => u.role === currentRole.value) || users.value[0]
  })

  const isAdmin = computed(() => currentRole.value === 'Administrator')

  async function fetchUsersFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error && data && data.length > 0) {
        users.value = data.map((p) => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name || p.email.split('@')[0],
          role: p.role || 'Customer',
          avatar: p.avatar_url,
        }))
        saveStorage('users', users.value)
      }
    } catch (err) {
      console.warn('[Business] Could not fetch profiles from Supabase:', err)
    }
  }

  async function updateUserRole(userId, newRole) {
    const u = users.value.find((item) => item.id === userId)
    if (u) {
      u.role = newRole
      saveStorage('users', users.value)
    }
    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    } catch (err) {
      console.warn('[Business] Could not update profile role in Supabase:', err)
    }
  }

  function resolveUserRole(email) {
    if (!email) return currentRole.value || 'Administrator'

    // Check if sessionStore has a confirmed Supabase profile role
    try {
      const session = sessionStore()
      if (session.userProfile?.role) {
        setRole(session.userProfile.role)
        return session.userProfile.role
      }
      if (session.currentUser?.user_metadata?.role) {
        setRole(session.currentUser.user_metadata.role)
        return session.currentUser.user_metadata.role
      }
    } catch (e) {
      // ignore
    }

    const found = users.value.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found?.role) {
      setRole(found.role)
      return found.role
    }
    const isCustomer = invoices.value.some((inv) => inv.client_email?.toLowerCase() === email.toLowerCase())
    if (isCustomer) {
      setRole('Customer')
      return 'Customer'
    }
    if (email.toLowerCase().includes('staff') || email.toLowerCase().includes('agent')) {
      setRole('Staff')
      return 'Staff'
    }
    setRole('Administrator')
    return 'Administrator'
  }

  function formatCurrency(amount, cur) {
    const currencyCode = cur || settings.value.currency || 'USD'
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(Number(amount) || 0)
    } catch {
      return `$${Number(amount || 0).toFixed(2)}`
    }
  }

  // ==========================================
  // INVOICE ACTIONS
  // ==========================================
  function createInvoice(invoiceData) {
    const nextNum = settings.value.next_invoice_number || 1045
    const prefix = settings.value.invoice_prefix || 'INV-2026-'
    const invoiceNumber = `${prefix}${nextNum}`

    // Calculate line item totals
    const items = (invoiceData.items || []).map((item, idx) => ({
      id: item.id || `item-${Date.now()}-${idx}`,
      product_id: item.product_id || null,
      code: item.code || '',
      name: item.name || '',
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
    }))

    const subtotal = items.reduce((acc, item) => acc + item.amount, 0)
    const discountPercentage = Number(invoiceData.discount_percentage) || 0
    const discountAmount = (subtotal * discountPercentage) / 100
    const taxableAmount = Math.max(0, subtotal - discountAmount)
    const taxRate = Number(invoiceData.tax_rate ?? settings.value.tax_rate) || 0
    const taxAmount = (taxableAmount * taxRate) / 100
    const totalAmount = Number((taxableAmount + taxAmount).toFixed(2))

    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoice_number: invoiceNumber,
      client_name: invoiceData.client_name || 'Client',
      client_email: invoiceData.client_email || '',
      contact_name: invoiceData.contact_name || invoiceData.client_name || '',
      organization_name: invoiceData.organization_name || '',
      status: invoiceData.status || 'Issued',
      issue_date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
      due_date: invoiceData.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      payment_terms: invoiceData.payment_terms || 'Net 30',
      currency: settings.value.currency || 'USD',
      tax_rate: taxRate,
      discount_percentage: discountPercentage,
      subtotal: Number(subtotal.toFixed(2)),
      discount_amount: Number(discountAmount.toFixed(2)),
      tax_amount: Number(taxAmount.toFixed(2)),
      total_amount: totalAmount,
      amount_paid: 0.0,
      balance_due: totalAmount,
      items,
      notes: invoiceData.notes || settings.value.notes_template || '',
    }

    invoices.value.unshift(newInvoice)
    saveStorage('invoices', invoices.value)

    // Increment invoice counter
    settings.value.next_invoice_number = nextNum + 1
    saveStorage('settings', settings.value)

    return newInvoice
  }

  function updateInvoice(id, updatedFields) {
    const idx = invoices.value.findIndex((inv) => inv.id === id)
    if (idx !== -1) {
      invoices.value[idx] = { ...invoices.value[idx], ...updatedFields }
      saveStorage('invoices', invoices.value)
      return invoices.value[idx]
    }
    return null
  }

  function cancelInvoice(id) {
    const inv = invoices.value.find((i) => i.id === id)
    if (inv) {
      inv.status = 'Cancelled'
      inv.balance_due = 0.0
      saveStorage('invoices', invoices.value)
    }
  }

  function deleteInvoice(id) {
    invoices.value = invoices.value.filter((i) => i.id !== id)
    saveStorage('invoices', invoices.value)
  }

  function recordPayment(invoiceId, { amount, payment_method, notes, payment_date }) {
    const inv = invoices.value.find((i) => i.id === invoiceId)
    if (!inv) throw new Error('Invoice not found')

    const payAmount = Math.min(Number(amount) || 0, inv.balance_due)
    if (payAmount <= 0) throw new Error('Payment amount must be greater than zero')

    inv.amount_paid = Number((inv.amount_paid + payAmount).toFixed(2))
    inv.balance_due = Number(Math.max(0, inv.total_amount - inv.amount_paid).toFixed(2))

    if (inv.balance_due === 0) {
      inv.status = 'Paid'
    } else {
      inv.status = 'Partially paid'
    }

    // Record corresponding transaction
    const newTx = {
      id: `tx-${Date.now()}`,
      transaction_ref: `TXN-2026-${Math.floor(100 + Math.random() * 900)}`,
      invoice_number: inv.invoice_number,
      invoice_id: inv.id,
      client_name: inv.client_name,
      amount: payAmount,
      currency: inv.currency,
      payment_method: payment_method || 'Credit Card',
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      status: 'Settled',
      notes: notes || `Payment recorded against ${inv.invoice_number}`,
    }

    transactions.value.unshift(newTx)
    saveStorage('transactions', transactions.value)
    saveStorage('invoices', invoices.value)

    return { invoice: inv, transaction: newTx }
  }

  // ==========================================
  // INVENTORY ACTIONS
  // ==========================================
  function addProduct(productData) {
    const newProd = {
      id: `prod-${Date.now()}`,
      code: productData.code || `PRD-${Math.floor(100 + Math.random() * 900)}`,
      name: productData.name,
      description: productData.description || '',
      category: productData.category || 'General',
      type: productData.type || 'Product', // 'Product' | 'Service'
      unit_price: Number(productData.unit_price) || 0,
      cost_price: Number(productData.cost_price) || 0,
      quantity_in_stock: productData.type === 'Service' ? 0 : Number(productData.quantity_in_stock) || 0,
      low_stock_threshold: productData.type === 'Service' ? null : Number(productData.low_stock_threshold) || 5,
      track_stock: productData.type !== 'Service' && Boolean(productData.track_stock),
      status: productData.status || 'Active',
    }

    inventory.value.unshift(newProd)
    saveStorage('inventory', inventory.value)
    return newProd
  }

  function updateProduct(id, fields) {
    const idx = inventory.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      inventory.value[idx] = { ...inventory.value[idx], ...fields }
      saveStorage('inventory', inventory.value)
      return inventory.value[idx]
    }
    return null
  }

  function deleteProduct(id) {
    inventory.value = inventory.value.filter((p) => p.id !== id)
    saveStorage('inventory', inventory.value)
  }

  // ==========================================
  // REMINDER ACTIONS
  // ==========================================
  function sendReminder(id) {
    const rem = reminders.value.find((r) => r.id === id)
    if (rem) {
      rem.last_sent_date = new Date().toISOString().split('T')[0]
      rem.delivery_status = 'Delivered'
      saveStorage('reminders', reminders.value)
    }
  }

  // ==========================================
  // CHANGE REQUEST ACTIONS
  // ==========================================
  const pendingChangeRequests = computed(() => {
    return changeRequests.value.filter((r) => r.status === 'Pending')
  })

  function submitChangeRequest({ requested_details, reason }) {
    const activeClient = currentUser.value || {}
    const fallbackName = activeClient.email ? activeClient.email.split('@')[0] : 'Client'
    const newReq = {
      id: `cr-${Date.now()}`,
      client_id: activeClient.id || 'usr-client-01',
      client_name: activeClient.full_name || fallbackName,
      client_email: activeClient.email || '',
      organization: activeClient.organization || activeClient.company || 'Client Organization',
      requested_date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      reason: reason || 'Customer requested information updates.',
      current_details: {
        full_name: activeClient.full_name || fallbackName,
        phone: activeClient.phone || '',
        company: activeClient.organization || activeClient.company || 'Client Organization',
        address: activeClient.address || '',
        city: activeClient.city || '',
        state: activeClient.state || '',
        zip: activeClient.zip || '',
        tax_id: activeClient.tax_id || '',
      },
      requested_details: { ...requested_details },
      review_notes: '',
      reviewed_by: null,
      reviewed_date: null,
    }

    changeRequests.value.unshift(newReq)
    saveStorage('change_requests', changeRequests.value)
    return newReq
  }

  function approveChangeRequest(requestId, reviewer = 'Admin') {
    const req = changeRequests.value.find((r) => r.id === requestId)
    if (!req) throw new Error('Change request not found')

    req.status = 'Approved'
    req.reviewed_by = reviewer
    req.reviewed_date = new Date().toISOString().split('T')[0]

    // Apply the changes to the user record
    const userToUpdate = users.value.find((u) => u.email === req.client_email || u.id === req.client_id)
    if (userToUpdate) {
      if (req.requested_details.full_name) userToUpdate.full_name = req.requested_details.full_name
      if (req.requested_details.phone) userToUpdate.phone = req.requested_details.phone
      if (req.requested_details.company) {
        userToUpdate.company = req.requested_details.company
        userToUpdate.client_name = req.requested_details.company
      }
      if (req.requested_details.address) userToUpdate.address = req.requested_details.address
      if (req.requested_details.city) userToUpdate.city = req.requested_details.city
      if (req.requested_details.state) userToUpdate.state = req.requested_details.state
      if (req.requested_details.zip) userToUpdate.zip = req.requested_details.zip
      if (req.requested_details.tax_id) userToUpdate.tax_id = req.requested_details.tax_id
      saveStorage('users', users.value)
    }

    saveStorage('change_requests', changeRequests.value)
    return req
  }

  function rejectChangeRequest(requestId, notes = '', reviewer = 'Admin') {
    const req = changeRequests.value.find((r) => r.id === requestId)
    if (!req) throw new Error('Change request not found')

    req.status = 'Rejected'
    req.review_notes = notes || 'Rejected by administration'
    req.reviewed_by = reviewer
    req.reviewed_date = new Date().toISOString().split('T')[0]

    saveStorage('change_requests', changeRequests.value)
    return req
  }

  // ==========================================
  // SETTINGS & COMPUTED METRICS
  // ==========================================
  function updateBusinessSettings(newSettings) {
    settings.value = { ...settings.value, ...newSettings }
    saveStorage('settings', settings.value)
  }

  const totalRevenue = computed(() => {
    return transactions.value
      .filter((t) => t.status === 'Settled')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0)
  })

  const totalOutstanding = computed(() => {
    return invoices.value
      .filter((i) => i.status !== 'Cancelled' && i.status !== 'Paid')
      .reduce((acc, i) => acc + Number(i.balance_due || 0), 0)
  })

  const overdueInvoicesCount = computed(() => {
    return invoices.value.filter((i) => i.status === 'Overdue').length
  })

  const paidInvoicesCount = computed(() => {
    return invoices.value.filter((i) => i.status === 'Paid').length
  })

  const lowStockItems = computed(() => {
    return inventory.value.filter(
      (p) => p.track_stock && p.quantity_in_stock <= (p.low_stock_threshold || 5),
    )
  })

  return {
    settings,
    inventory,
    products: inventory,
    invoices,
    transactions,
    reminders,
    promotions,
    users,
    fetchUsersFromSupabase,
    updateUserRole,
    changeRequests,
    pendingChangeRequests,
    currentRole,
    currentUser,
    isAdmin,
    setRole,
    resolveUserRole,
    formatCurrency,
    // Change Requests
    submitChangeRequest,
    approveChangeRequest,
    rejectChangeRequest,
    // Invoices
    createInvoice,
    updateInvoice,
    cancelInvoice,
    deleteInvoice,
    recordPayment,
    // Inventory
    addProduct,
    updateProduct,
    deleteProduct,
    // Reminders
    sendReminder,
    // Settings
    updateBusinessSettings,
    // Computed Metrics
    totalRevenue,
    totalOutstanding,
    overdueInvoicesCount,
    paidInvoicesCount,
    lowStockItems,
  }
})
