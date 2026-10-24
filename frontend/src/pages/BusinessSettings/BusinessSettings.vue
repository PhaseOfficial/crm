<template>
  <div class="flex flex-col h-full overflow-hidden">
    <LayoutHeader>
      <template #left-header>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-ink-gray-9">{{ __('Business Settings') }}</h1>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {{ __('Administrator Only') }}
          </span>
        </div>
      </template>
      <template #right-header>
        <div class="flex items-center gap-2">
          <span v-if="savedSuccess" class="text-xs text-emerald-600 font-semibold">
            {{ __('Settings saved!') }}
          </span>
          <Button variant="solid" :label="__('Save Settings')" :loading="saving" @click="save" />
        </div>
      </template>
    </LayoutHeader>

    <div class="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl">
      <!-- Company Information Card -->
      <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-4">
        <h2 class="text-base font-bold text-ink-gray-9 flex items-center gap-2">
          <span class="lucide-building-2 size-5 text-blue-500" />
          {{ __('Company & Contact Information') }}
        </h2>
        <p class="text-xs text-ink-gray-5">
          {{ __('These details will appear on all outgoing customer invoices and receipts.') }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormControl
            v-model="form.business_name"
            :label="__('Company Legal Name')"
            type="text"
            required
          />
          <FormControl
            v-model="form.business_email"
            :label="__('Billing Email Address')"
            type="email"
            required
          />
          <FormControl
            v-model="form.business_phone"
            :label="__('Billing Phone')"
            type="text"
            required
          />
          <FormControl
            v-model="form.tax_id"
            :label="__('Tax ID / VAT Number')"
            type="text"
            placeholder="e.g. US-94-8829103"
          />
        </div>

        <FormControl
          v-model="form.business_address"
          :label="__('Official Street Address')"
          type="textarea"
          rows="3"
        />
      </div>

      <!-- Invoicing & Currency Rules -->
      <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-4">
        <h2 class="text-base font-bold text-ink-gray-9 flex items-center gap-2">
          <span class="lucide-receipt size-5 text-emerald-500" />
          {{ __('Invoice Numbering & Financial Defaults') }}
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormControl
            v-model="form.invoice_prefix"
            :label="__('Invoice Prefix')"
            type="text"
            placeholder="INV-2026-"
            required
          />
          <FormControl
            v-model.number="form.next_invoice_number"
            :label="__('Next Sequence Number')"
            type="number"
            min="1"
            required
          />
          <FormControl
            v-model="form.currency"
            :label="__('Currency')"
            type="select"
            :options="['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'ZAR']"
            required
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormControl
            v-model.number="form.default_payment_terms"
            :label="__('Default Terms (Days)')"
            type="number"
            min="0"
          />
          <FormControl
            v-model.number="form.tax_rate"
            :label="__('Default Tax Rate (%)')"
            type="number"
            step="0.1"
            min="0"
          />
          <FormControl
            v-model.number="form.late_fee_percentage"
            :label="__('Late Fee (% per month)')"
            type="number"
            step="0.5"
            min="0"
          />
        </div>

        <FormControl
          v-model="form.notes_template"
          :label="__('Default Footer / Remittance Notes')"
          type="textarea"
          rows="2"
        />
      </div>

      <!-- Staff Management & Role Permissions -->
      <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-ink-gray-9 flex items-center gap-2">
              <span class="lucide-users size-5 text-purple-500" />
              {{ __('Staff Accounts & Role Assignments') }}
            </h2>
            <p class="text-xs text-ink-gray-5 mt-0.5">
              {{ __('Control access permissions across internal CRM modules and customer portal.') }}
            </p>
          </div>
          <Button size="sm" variant="outline" :label="__('Invite Staff')" iconLeft="user-plus" @click="showInvite = true" />
        </div>

        <div class="border border-outline-gray-1 rounded-lg overflow-hidden">
          <table class="w-full text-left text-sm border-collapse">
            <thead class="bg-surface-gray-1 text-xs font-semibold text-ink-gray-6 uppercase tracking-wider">
              <tr>
                <th class="py-3 px-4">{{ __('User') }}</th>
                <th class="py-3 px-4">{{ __('Email') }}</th>
                <th class="py-3 px-4">{{ __('Assigned Role') }}</th>
                <th class="py-3 px-4 text-right">{{ __('Access Area') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-gray-1">
              <tr v-for="user in business.users" :key="user.id" class="hover:bg-surface-gray-1">
                <td class="py-3 px-4 flex items-center gap-2.5">
                  <Avatar size="sm" :label="user.full_name" :image="user.avatar" />
                  <span class="font-medium text-ink-gray-9">{{ user.full_name }}</span>
                </td>
                <td class="py-3 px-4 text-ink-gray-6">{{ user.email }}</td>
                <td class="py-3 px-4">
                  <select
                    v-model="user.role"
                    class="bg-surface-white border border-outline-gray-2 rounded px-2 py-1 text-xs font-semibold text-ink-gray-8 focus:outline-none"
                  >
                    <option value="Administrator">{{ __('Administrator') }}</option>
                    <option value="Staff">{{ __('Staff') }}</option>
                    <option value="Customer">{{ __('Customer') }}</option>
                  </select>
                </td>
                <td class="py-3 px-4 text-right text-xs">
                  <span
                    class="px-2 py-0.5 rounded-full font-medium"
                    :class="
                      user.role === 'Customer'
                        ? 'bg-blue-50 text-blue-700'
                        : user.role === 'Administrator'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-emerald-50 text-emerald-700'
                    "
                  >
                    {{ user.role === 'Customer' ? __('Customer Portal (/portal)') : __('Full CRM (/dashboard)') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Invite / Add Staff Modal -->
    <Dialog v-model:open="showInvite" :size="'md'">
      <template #body>
        <div class="p-6 bg-surface-white space-y-4">
          <h2 class="text-lg font-bold text-ink-gray-9 border-b border-outline-gray-1 pb-3">
            {{ __('Invite Team Member') }}
          </h2>
          <div class="space-y-4">
            <FormControl
              v-model="newMember.full_name"
              :label="__('Full Name')"
              type="text"
              placeholder="Jane Doe"
              required
            />
            <FormControl
              v-model="newMember.email"
              :label="__('Email Address')"
              type="email"
              placeholder="jane@crestara.com"
              required
            />
            <FormControl
              v-model="newMember.role"
              :label="__('Assigned Role')"
              type="select"
              :options="['Staff', 'Administrator', 'Customer']"
              required
            />
          </div>
          <div class="flex justify-end gap-2 pt-4 border-t border-outline-gray-1">
            <Button variant="subtle" :label="__('Cancel')" @click="showInvite = false" />
            <Button
              variant="solid"
              :label="__('Add Member')"
              :disabled="!newMember.email || !newMember.full_name"
              @click="addTeamMember"
            />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useBusinessStore } from '@/stores/business'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { FormControl, Button, Avatar, Dialog } from 'frappe-ui'

const business = useBusinessStore()
const saving = ref(false)
const savedSuccess = ref(false)
const showInvite = ref(false)

const newMember = reactive({
  full_name: '',
  email: '',
  role: 'Staff',
})

function addTeamMember() {
  if (!newMember.email || !newMember.full_name) return
  business.users.push({
    id: `usr-${Date.now()}`,
    email: newMember.email.trim(),
    full_name: newMember.full_name.trim(),
    role: newMember.role,
    avatar: null,
  })
  localStorage.setItem('crestara_users', JSON.stringify(business.users))
  newMember.full_name = ''
  newMember.email = ''
  newMember.role = 'Staff'
  showInvite.value = false
}

const form = reactive({ ...business.settings })

function save() {
  saving.value = true
  setTimeout(() => {
    business.updateBusinessSettings(form)
    saving.value = false
    savedSuccess.value = true
    setTimeout(() => {
      savedSuccess.value = false
    }, 3000)
  }, 400)
}
</script>
