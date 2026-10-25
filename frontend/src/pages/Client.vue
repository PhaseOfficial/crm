<template>
  <div v-if="client" class="flex flex-col flex-1 h-full overflow-hidden bg-surface-gray-2">
    <!-- Header -->
    <LayoutHeader>
      <template #left-header>
        <div class="flex items-center gap-3">
          <Button
            variant="ghost"
            iconLeft="arrow-left"
            @click="router.push('/clients')"
          />
          <div class="size-10 rounded-xl bg-surface-blue-2 border border-outline-blue-2 flex items-center justify-center font-bold text-ink-blue-7 text-sm">
            {{ (client.company_name || 'C').substring(0, 2).toUpperCase() }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-bold text-ink-gray-9 leading-none">
                {{ client.company_name }}
              </h1>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold"
                :class="client.status === 'Active' ? 'bg-surface-green-2 text-ink-green-7 border border-outline-green-2' : 'bg-surface-gray-2 text-ink-gray-6'"
              >
                {{ __(client.status || 'Active') }}
              </span>
            </div>
            <span class="text-xs text-ink-gray-5 mt-0.5 block">
              {{ client.legal_structure }} • {{ client.industry || 'Organization' }}
            </span>
          </div>
        </div>
      </template>

      <template #right-header>
        <div class="flex items-center gap-2">
          <router-link :to="`/invoices/new?customer=${encodeURIComponent(client.company_name)}&email=${encodeURIComponent(client.primary_email)}`">
            <Button variant="subtle" iconLeft="plus" :label="__('Issue Invoice')" />
          </router-link>
          <Button
            variant="outline"
            iconLeft="user-plus"
            :label="__('Upgrade to Staff')"
            @click="showUpgradeModal = true"
          />
          <Button
            variant="solid"
            iconLeft="file-edit"
            :label="__('Edit Client')"
            @click="showEditModal = true"
          />
        </div>
      </template>
    </LayoutHeader>

    <!-- Body Layout -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl w-full mx-auto">
      <!-- Top Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Card 1: Registration & Tax -->
        <div class="bg-surface-base border border-outline-gray-1 rounded-xl p-5 shadow-sm space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-ink-gray-5 flex items-center gap-1.5">
            <span class="lucide-building size-4 text-ink-gray-7" />
            {{ __('Corporate Registry') }}
          </h4>
          <div class="space-y-2 text-xs">
            <div>
              <span class="text-ink-gray-4 block">{{ __('Company Registration No. (CRN)') }}</span>
              <span class="font-mono font-bold text-ink-gray-9 text-sm">{{ client.company_registration_number || '—' }}</span>
            </div>
            <div>
              <span class="text-ink-gray-4 block">{{ __('Tax ID / TIN / EIN') }}</span>
              <span class="font-mono font-bold text-ink-gray-9 text-sm">{{ client.tin || client.tax_id || '—' }}</span>
            </div>
            <div v-if="client.vat_number">
              <span class="text-ink-gray-4 block">{{ __('VAT Number') }}</span>
              <span class="font-mono text-ink-gray-8">{{ client.vat_number }}</span>
            </div>
          </div>
        </div>

        <!-- Card 2: Primary Contact Person -->
        <div class="bg-surface-base border border-outline-gray-1 rounded-xl p-5 shadow-sm space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-ink-gray-5 flex items-center gap-1.5">
            <span class="lucide-user-check size-4 text-ink-blue-6" />
            {{ __('Primary Contact Person') }}
          </h4>
          <div class="space-y-1.5 text-xs">
            <div>
              <span class="text-sm font-bold text-ink-gray-9 block">
                {{ client.first_name ? `${client.first_name} ${client.last_name || ''}` : (client.contact_name || client.primary_email) }}
              </span>
              <span class="text-ink-gray-5">{{ client.job_title || __('Primary Representative') }}</span>
            </div>
            <div class="pt-1 flex items-center gap-1.5 text-ink-gray-7">
              <span class="lucide-mail size-3.5 text-ink-gray-4" />
              <span class="truncate">{{ client.billing_email || client.primary_email }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-ink-gray-7">
              <span class="lucide-phone size-3.5 text-ink-gray-4" />
              <span>{{ client.phone || client.mobile_no || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Card 3: Commercial & Billing -->
        <div class="bg-surface-base border border-outline-gray-1 rounded-xl p-5 shadow-sm space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-ink-gray-5 flex items-center gap-1.5">
            <span class="lucide-badge-dollar-sign size-4 text-ink-green-6" />
            {{ __('Commercial & Terms') }}
          </h4>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-ink-gray-5">{{ __('Payment Terms') }}</span>
              <span class="font-bold text-ink-gray-9">{{ client.default_payment_terms || 'Net 30' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-ink-gray-5">{{ __('Currency') }}</span>
              <span class="font-bold text-ink-gray-9">{{ client.default_currency || 'USD' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-ink-gray-5">{{ __('Credit Limit') }}</span>
              <span class="font-bold text-ink-gray-9">${{ Number(client.credit_limit || 0).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between items-center pt-1 border-t border-outline-gray-1">
              <span class="text-ink-gray-5">{{ __('Total Outstanding') }}</span>
              <span class="font-bold font-mono text-amber-600">${{ Number(clientBalance).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Official Billing Address Card -->
      <div class="bg-surface-base border border-outline-gray-1 rounded-xl p-5 shadow-sm space-y-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-ink-gray-5 flex items-center gap-1.5">
          <span class="lucide-map-pin size-4 text-ink-gray-7" />
          {{ __('Official Billing Address') }}
        </h4>
        <p class="text-sm text-ink-gray-9 whitespace-pre-line">
          {{ client.billing_address_line1 || client.address || 'No billing street specified' }}
          <span v-if="client.billing_address_line2" class="block text-ink-gray-6">{{ client.billing_address_line2 }}</span>
        </p>
        <p class="text-xs text-ink-gray-6">
          {{ client.billing_city || client.city }}, {{ client.billing_state_province || client.state }} {{ client.billing_postal_code || client.zip }} • {{ client.billing_country || 'United States' }}
        </p>
      </div>

      <!-- Invoices Issued to this Client Table -->
      <div class="bg-surface-base border border-outline-gray-1 rounded-xl overflow-hidden shadow-sm">
        <div class="p-4 border-b border-outline-gray-1 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-ink-gray-9">{{ __('Invoices & Billing History') }}</h3>
            <p class="text-xs text-ink-gray-5">{{ __('All invoices issued to this organization') }}</p>
          </div>
          <span class="text-xs font-semibold text-ink-gray-6">
            {{ clientInvoices.length }} {{ __('Invoices') }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-surface-gray-2 text-ink-gray-6 uppercase tracking-wider font-semibold border-b border-outline-gray-1">
              <tr>
                <th class="py-3 px-4">{{ __('Invoice #') }}</th>
                <th class="py-3 px-4">{{ __('Issue Date') }}</th>
                <th class="py-3 px-4">{{ __('Due Date') }}</th>
                <th class="py-3 px-4">{{ __('Amount') }}</th>
                <th class="py-3 px-4">{{ __('Balance') }}</th>
                <th class="py-3 px-4">{{ __('Status') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-gray-1">
              <tr
                v-for="inv in clientInvoices"
                :key="inv.id"
                class="hover:bg-surface-gray-1 cursor-pointer"
                @click="router.push(`/invoices/${inv.id}`)"
              >
                <td class="py-3 px-4 font-mono font-bold text-ink-blue-7">{{ inv.invoice_number }}</td>
                <td class="py-3 px-4 text-ink-gray-6">{{ inv.issue_date }}</td>
                <td class="py-3 px-4 text-ink-gray-6">{{ inv.due_date }}</td>
                <td class="py-3 px-4 font-mono font-semibold text-ink-gray-9">${{ Number(inv.total_amount).toLocaleString() }}</td>
                <td class="py-3 px-4 font-mono font-bold" :class="Number(inv.balance_due) > 0 ? 'text-amber-600' : 'text-emerald-600'">
                  ${{ Number(inv.balance_due).toLocaleString() }}
                </td>
                <td class="py-3 px-4">
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold"
                    :class="{
                      'bg-surface-green-2 text-ink-green-7': inv.status === 'Paid',
                      'bg-surface-amber-2 text-ink-amber-7': inv.status === 'Issued' || inv.status === 'Partially paid',
                      'bg-surface-red-2 text-ink-red-7': inv.status === 'Overdue',
                    }"
                  >
                    {{ __(inv.status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="!clientInvoices.length">
                <td colspan="6" class="py-8 text-center text-ink-gray-4">
                  {{ __('No invoices issued to this client yet.') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex flex-1 items-center justify-center p-12">
    <div class="text-center space-y-3">
      <span class="lucide-building size-10 text-ink-gray-4 mx-auto" />
      <h3 class="text-base font-bold text-ink-gray-9">{{ __('Client Not Found') }}</h3>
      <Button variant="solid" :label="__('Back to Clients')" @click="router.push('/clients')" />
    </div>
  </div>

  <!-- Upgrade Client to Staff Modal -->
  <Dialog v-model:open="showUpgradeModal" :size="'sm'">
    <template #body>
      <div class="p-6 bg-surface-base space-y-4">
        <div class="flex items-center gap-2 border-b border-outline-gray-1 pb-3">
          <span class="lucide-arrow-up-circle size-5 text-amber-600" />
          <h2 class="text-base font-bold text-ink-gray-9">
            {{ __('Upgrade Client to Staff Member') }}
          </h2>
        </div>
        <p class="text-xs text-ink-gray-7 leading-relaxed">
          Are you sure you want to upgrade <strong>{{ client?.company_name || client?.first_name }}</strong> ({{ client?.primary_email }}) to an internal <strong>Staff</strong> member?
        </p>
        <div class="p-3 bg-surface-amber-2/60 border border-outline-amber-2 rounded-lg text-xs space-y-1 text-ink-amber-8">
          <span class="font-bold flex items-center gap-1.5">
            <span class="lucide-shield-check size-3.5" />
            {{ __('Permission Elevation') }}
          </span>
          <p class="text-[11px] text-ink-gray-6">
            {{ __('This will elevate their account to CRM staff access, permitting internal pipeline management.') }}
          </p>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-outline-gray-1">
          <Button variant="subtle" :label="__('Cancel')" @click="showUpgradeModal = false" />
          <Button
            variant="solid"
            theme="amber"
            iconLeft="arrow-up-right"
            :label="__('Confirm Upgrade')"
            @click="confirmUpgradeClient"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, Dialog } from 'frappe-ui'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { useBusinessStore } from '@/stores/business'

const props = defineProps({
  clientId: {
    type: String,
    default: '',
  },
})

const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const showEditModal = ref(false)
const showUpgradeModal = ref(false)

const currentId = computed(() => props.clientId || route.params.clientId || route.params.organizationId)

onMounted(async () => {
  if (currentId.value) {
    await business.fetchCustomerFromSupabase(currentId.value)
  }
})

async function confirmUpgradeClient() {
  if (!client.value) return
  const c = client.value

  await business.updateUserRole(c.id, 'Staff')

  // Update in business.users
  const userIdx = business.users.findIndex(
    (u) => u.id === c.id || (c.primary_email && u.email?.toLowerCase() === c.primary_email.toLowerCase())
  )
  if (userIdx !== -1) {
    business.users[userIdx].role = 'Staff'
  } else {
    business.users.push({
      id: c.id,
      email: c.primary_email,
      full_name: c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : c.company_name,
      role: 'Staff',
      avatar: null,
    })
  }

  // Remove from customers list
  business.customers = business.customers.filter((item) => item.id !== c.id)

  localStorage.setItem('crestara_users', JSON.stringify(business.users))
  localStorage.setItem('crestara_customers', JSON.stringify(business.customers))

  showUpgradeModal.value = false
  router.push('/business-settings')
}

const client = computed(() => {
  return business.customers.find((c) => c.id === currentId.value) || business.customers[0]
})

const clientInvoices = computed(() => {
  if (!client.value) return []
  const name = client.value.company_name?.toLowerCase()
  const email = client.value.primary_email?.toLowerCase()

  return business.invoices.filter((inv) => {
    return (
      (name && inv.client_name?.toLowerCase().includes(name)) ||
      (name && inv.organization_name?.toLowerCase().includes(name)) ||
      (email && inv.client_email?.toLowerCase() === email) ||
      inv.customer_id === client.value.id
    )
  })
})

const clientBalance = computed(() => {
  return clientInvoices.value
    .filter((inv) => inv.status !== 'Cancelled')
    .reduce((acc, inv) => acc + Number(inv.balance_due || 0), 0)
})
</script>
