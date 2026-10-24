<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <LayoutHeader>
      <template #left-header>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-ink-gray-9">{{ __('Invoices') }}</h1>
          <span class="text-xs px-2 py-0.5 rounded-full bg-surface-gray-2 text-ink-gray-6 font-semibold">
            {{ filteredInvoices.length }}
          </span>
        </div>
      </template>
      <template #right-header>
        <router-link to="/invoices/new">
          <Button variant="solid" :label="__('Create Invoice')" iconLeft="plus" />
        </router-link>
      </template>
    </LayoutHeader>

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Invoicing KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-5 shadow-sm">
          <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-5">{{ __('Total Revenue') }}</span>
          <div class="mt-2 text-2xl font-bold text-ink-gray-9">${{ formatNum(business.totalRevenue) }}</div>
          <span class="text-xs text-emerald-600 mt-1 block">{{ __('Settled via payment transactions') }}</span>
        </div>

        <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-5 shadow-sm">
          <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-5">{{ __('Outstanding Balance') }}</span>
          <div class="mt-2 text-2xl font-bold text-amber-600">${{ formatNum(business.totalOutstanding) }}</div>
          <span class="text-xs text-ink-gray-4 mt-1 block">{{ __('Pending payment collection') }}</span>
        </div>

        <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-5 shadow-sm">
          <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-5">{{ __('Overdue Invoices') }}</span>
          <div class="mt-2 text-2xl font-bold" :class="business.overdueInvoicesCount > 0 ? 'text-red-600' : 'text-ink-gray-9'">
            {{ business.overdueInvoicesCount }}
          </div>
          <span class="text-xs text-red-500 mt-1 block">{{ __('Requires follow-up action') }}</span>
        </div>

        <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-5 shadow-sm">
          <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-5">{{ __('Paid Invoices') }}</span>
          <div class="mt-2 text-2xl font-bold text-ink-gray-9">{{ business.paidInvoicesCount }}</div>
          <span class="text-xs text-ink-gray-4 mt-1 block">{{ __('Fully completed invoices') }}</span>
        </div>
      </div>

      <!-- Filters & Status Tabs -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Status Tabs -->
        <div class="flex flex-wrap gap-1 bg-surface-gray-2 p-1 rounded-lg text-xs font-medium">
          <button
            v-for="st in statusOptions"
            :key="st"
            class="px-3 py-1.5 rounded-md transition-colors"
            :class="selectedStatus === st ? 'bg-surface-white text-ink-gray-9 font-bold shadow-sm' : 'text-ink-gray-6 hover:text-ink-gray-9'"
            @click="selectedStatus = st"
          >
            {{ __(st) }}
          </button>
        </div>

        <!-- Search Bar -->
        <div class="w-full sm:w-64">
          <TextInput
            v-model="searchQuery"
            type="search"
            :placeholder="__('Search invoice or client...')"
            iconLeft="search"
          />
        </div>
      </div>

      <!-- Invoices Data Table -->
      <div class="bg-surface-white rounded-xl border border-outline-gray-1 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-surface-gray-1 border-b border-outline-gray-1 text-xs font-semibold text-ink-gray-6 uppercase tracking-wider">
                <th class="py-3 px-6">{{ __('Invoice #') }}</th>
                <th class="py-3 px-6">{{ __('Client / Organization') }}</th>
                <th class="py-3 px-6">{{ __('Issue Date') }}</th>
                <th class="py-3 px-6">{{ __('Due Date') }}</th>
                <th class="py-3 px-6">{{ __('Total Amount') }}</th>
                <th class="py-3 px-6">{{ __('Balance Due') }}</th>
                <th class="py-3 px-6">{{ __('Status') }}</th>
                <th class="py-3 px-6 text-right">{{ __('Actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-gray-1">
              <tr
                v-for="inv in filteredInvoices"
                :key="inv.id"
                class="hover:bg-surface-gray-1 transition-colors cursor-pointer"
                @click="goToDetail(inv.id)"
              >
                <td class="py-4 px-6 font-semibold text-ink-gray-9">
                  {{ inv.invoice_number }}
                </td>
                <td class="py-4 px-6">
                  <div class="font-medium text-ink-gray-9">{{ inv.client_name }}</div>
                  <div class="text-xs text-ink-gray-4">{{ inv.contact_name }}</div>
                </td>
                <td class="py-4 px-6 text-ink-gray-6">{{ inv.issue_date }}</td>
                <td class="py-4 px-6 text-ink-gray-6">{{ inv.due_date }}</td>
                <td class="py-4 px-6 font-bold text-ink-gray-9">${{ formatNum(inv.total_amount) }}</td>
                <td class="py-4 px-6 font-bold" :class="inv.balance_due > 0 ? 'text-amber-600' : 'text-ink-gray-6'">
                  ${{ formatNum(inv.balance_due) }}
                </td>
                <td class="py-4 px-6">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusClass(inv.status)"
                  >
                    {{ __(inv.status) }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right" @click.stop>
                  <div class="flex items-center justify-end gap-1.5">
                    <Button
                      v-if="inv.balance_due > 0 && inv.status !== 'Cancelled'"
                      size="sm"
                      variant="outline"
                      :label="__('Pay')"
                      iconLeft="credit-card"
                      @click="openPaymentModal(inv)"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      iconLeft="eye"
                      @click="goToDetail(inv.id)"
                    />
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredInvoices.length">
                <td colspan="8" class="py-12 text-center text-ink-gray-4">
                  <p class="text-base font-semibold text-ink-gray-7">{{ __('No invoices found') }}</p>
                  <p class="text-xs mt-1">{{ __('Try adjusting your filter or create a new invoice.') }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Record Payment Modal Component -->
    <RecordPaymentModal
      v-model="showPaymentModal"
      :invoice="selectedInvoice"
      @paymentRecorded="onPaymentSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBusinessStore } from '@/stores/business'
import LayoutHeader from '@/components/LayoutHeader.vue'
import RecordPaymentModal from '@/components/Invoices/RecordPaymentModal.vue'
import { Button, TextInput } from 'frappe-ui'

const router = useRouter()
const business = useBusinessStore()

const selectedStatus = ref('All')
const searchQuery = ref('')
const showPaymentModal = ref(false)
const selectedInvoice = ref(null)

const statusOptions = ['All', 'Issued', 'Partially paid', 'Paid', 'Overdue', 'Draft', 'Cancelled']

const filteredInvoices = computed(() => {
  return business.invoices.filter((inv) => {
    // Status filter
    if (selectedStatus.value !== 'All' && inv.status !== selectedStatus.value) {
      return false
    }
    // Search query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchNum = inv.invoice_number?.toLowerCase().includes(q)
      const matchClient = inv.client_name?.toLowerCase().includes(q)
      const matchOrg = inv.organization_name?.toLowerCase().includes(q)
      return matchNum || matchClient || matchOrg
    }
    return true
  })
})

function goToDetail(id) {
  router.push({ path: `/invoices/${id}` })
}

function openPaymentModal(inv) {
  selectedInvoice.value = inv
  showPaymentModal.value = true
}

function onPaymentSuccess() {
  // Store is reactive, modal auto updates
}

function formatNum(num) {
  return Number(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getStatusClass(status) {
  switch (status) {
    case 'Paid':
      return 'bg-green-50 text-green-700 border border-green-200'
    case 'Overdue':
      return 'bg-red-50 text-red-700 border border-red-200'
    case 'Issued':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'Partially paid':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'Draft':
      return 'bg-surface-gray-2 text-ink-gray-7 border border-outline-gray-2'
    case 'Cancelled':
      return 'bg-surface-gray-2 text-ink-gray-4 line-through'
    default:
      return 'bg-surface-gray-2 text-ink-gray-6'
  }
}
</script>
