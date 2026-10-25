<template>
  <div class="space-y-6 max-w-4xl">
    <div>
      <h1 class="text-2xl font-bold text-ink-gray-9">{{ __('My Account & Billing Information') }}</h1>
      <p class="text-sm text-ink-gray-5 mt-1">
        {{ __('Official organization records, verified contact profile, and change request status.') }}
      </p>
    </div>

    <!-- Official Information Policy Notice Banner -->
    <div class="bg-surface-blue-2 rounded-xl p-4 flex items-start gap-3">
      <span class="lucide-shield-check size-5 text-ink-blue-7 mt-0.5 shrink-0" />
      <div class="text-xs text-ink-blue-7 space-y-1">
        <p class="font-bold text-sm">
          {{ __('Verified Account Records') }}
        </p>
        <p class="leading-relaxed opacity-90">
          {{ __('For tax and compliance integrity, official organization details cannot be changed directly. To request updates to your company name, contact representative, or billing address, please click "Request Detail Change" below. Our administrative team will review and approve the request.') }}
        </p>
      </div>
    </div>

    <!-- Pending Change Request Alert (If customer has one under review) -->
    <div
      v-if="pendingCustomerRequest"
      class="bg-surface-amber-2 rounded-xl p-4 flex items-center justify-between text-ink-amber-7"
    >
      <div class="flex items-center gap-3">
        <span class="lucide-clock size-5 text-ink-amber-7 shrink-0" />
        <div>
          <h4 class="text-xs font-bold">{{ __('Pending Change Request Under Review') }}</h4>
          <p class="text-xs opacity-90 mt-0.5">
            {{ __('Requested on {0}: "{1}"', [pendingCustomerRequest.requested_date, pendingCustomerRequest.reason]) }}
          </p>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-amber-3 text-ink-amber-7">
        {{ __('Under Review') }}
      </span>
    </div>

    <!-- Official Account Record Card -->
    <div class="bg-surface-base rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-gray-1 pb-4">
        <div>
          <h2 class="text-base font-bold text-ink-gray-9 flex items-center gap-2">
            <span class="lucide-building size-5 text-ink-gray-7" />
            {{ __('Official Company & Contact Record') }}
          </h2>
          <span class="text-xs text-ink-gray-4">{{ __('Associated with active contracts, invoices and billing statements') }}</span>
        </div>

        <Button
          variant="solid"
          iconLeft="file-edit"
          :label="__('Request Detail Change')"
          @click="openChangeModal"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div class="space-y-4">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-4 block">{{ __('Company / Organization') }}</span>
            <span class="text-base font-bold text-ink-gray-9 mt-0.5 block">{{ clientProfile.company || clientProfile.client_name }}</span>
          </div>

          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-4 block">{{ __('Primary Contact Representative') }}</span>
            <span class="font-medium text-ink-gray-9 mt-0.5 block">{{ clientProfile.full_name }}</span>
          </div>

          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-4 block">{{ __('Registered Billing Email') }}</span>
            <span class="font-mono text-ink-gray-8 mt-0.5 block">{{ clientProfile.email }}</span>
          </div>

          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-4 block">{{ __('Phone Number') }}</span>
            <span class="font-medium text-ink-gray-8 mt-0.5 block">{{ clientProfile.phone || '+1 (555) 789-0123' }}</span>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-4 block">{{ __('Official Billing Address') }}</span>
            <p class="font-medium text-ink-gray-9 mt-0.5 whitespace-pre-line">{{ clientProfile.address || '450 Mission Street, Floor 14' }}</p>
            <p class="text-xs text-ink-gray-6">{{ clientProfile.city || 'San Francisco' }}, {{ clientProfile.state || 'CA' }} {{ clientProfile.zip || '94105' }}</p>
          </div>

          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-4 block">{{ __('Tax ID / VAT Registration') }}</span>
            <span class="font-mono font-medium text-ink-gray-9 mt-0.5 block">{{ clientProfile.tax_id || 'US-882-99120' }}</span>
          </div>

          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-4 block">{{ __('Record Verification Status') }}</span>
            <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-green-7 bg-surface-green-2 px-2.5 py-1 rounded-md border border-outline-green-2 mt-1">
              <span class="lucide-check-circle size-3.5" />
              {{ __('Verified & Active') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Requests History Table -->
    <div class="bg-surface-base rounded-xl border border-outline-gray-1 overflow-hidden shadow-sm">
      <div class="p-5 border-b border-outline-gray-1 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-ink-gray-9">{{ __('Change Request History') }}</h3>
          <p class="text-xs text-ink-gray-5 mt-0.5">{{ __('Log of all profile change requests submitted for administrative approval') }}</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead class="bg-surface-gray-1 border-b border-outline-gray-1 text-xs font-semibold text-ink-gray-6 uppercase tracking-wider">
            <tr>
              <th class="py-3 px-6">{{ __('Date') }}</th>
              <th class="py-3 px-6">{{ __('Requested Updates') }}</th>
              <th class="py-3 px-6">{{ __('Reason') }}</th>
              <th class="py-3 px-6">{{ __('Status') }}</th>
              <th class="py-3 px-6">{{ __('Review Notes') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-gray-1">
            <tr
              v-for="req in customerRequests"
              :key="req.id"
              class="hover:bg-surface-gray-1 transition-colors"
            >
              <td class="py-4 px-6 text-xs text-ink-gray-6 whitespace-nowrap">{{ req.requested_date }}</td>
              <td class="py-4 px-6">
                <div class="space-y-1 text-xs">
                  <div v-if="req.requested_details.company !== req.current_details.company">
                    <span class="font-semibold text-ink-gray-5">Company:</span>
                    <span class="text-ink-gray-9 ml-1 font-medium">{{ req.requested_details.company }}</span>
                  </div>
                  <div v-if="req.requested_details.full_name !== req.current_details.full_name">
                    <span class="font-semibold text-ink-gray-5">Contact:</span>
                    <span class="text-ink-gray-9 ml-1 font-medium">{{ req.requested_details.full_name }}</span>
                  </div>
                  <div v-if="req.requested_details.phone !== req.current_details.phone">
                    <span class="font-semibold text-ink-gray-5">Phone:</span>
                    <span class="text-ink-gray-9 ml-1 font-medium">{{ req.requested_details.phone }}</span>
                  </div>
                  <div v-if="req.requested_details.address !== req.current_details.address">
                    <span class="font-semibold text-ink-gray-5">Address:</span>
                    <span class="text-ink-gray-9 ml-1 font-medium">{{ req.requested_details.address }}</span>
                  </div>
                  <div v-if="req.requested_details.tax_id !== req.current_details.tax_id">
                    <span class="font-semibold text-ink-gray-5">Tax ID:</span>
                    <span class="text-ink-gray-9 ml-1 font-medium">{{ req.requested_details.tax_id }}</span>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6 text-xs text-ink-gray-7 max-w-xs">{{ req.reason }}</td>
              <td class="py-4 px-6 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-surface-amber-2 text-ink-amber-7': req.status === 'Pending',
                    'bg-surface-green-2 text-ink-green-7': req.status === 'Approved',
                    'bg-surface-red-2 text-ink-red-7': req.status === 'Rejected',
                  }"
                >
                  {{ req.status === 'Pending' ? __('Pending Review') : __(req.status) }}
                </span>
              </td>
              <td class="py-4 px-6 text-xs text-ink-gray-5">
                <span v-if="req.reviewed_by" class="block font-medium text-ink-gray-7">
                  {{ req.reviewed_by }} ({{ req.reviewed_date }})
                </span>
                <span>{{ req.review_notes || '—' }}</span>
              </td>
            </tr>
            <tr v-if="!customerRequests.length">
              <td colspan="5" class="py-8 text-center text-xs text-ink-gray-4">
                {{ __('No change requests submitted yet.') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Notification Preferences -->
    <div class="bg-surface-base rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-4">
      <div>
        <h2 class="text-base font-bold text-ink-gray-9">{{ __('Direct Notification Preferences') }}</h2>
        <p class="text-xs text-ink-gray-5 mt-0.5">{{ __('Select which billing notices and updates are delivered to your email') }}</p>
      </div>

      <div class="space-y-3">
        <label class="flex items-center gap-3 text-sm text-ink-gray-8 cursor-pointer">
          <input v-model="notifications.email_invoices" type="checkbox" class="rounded border-outline-gray-2 text-blue-600 focus:ring-blue-500" />
          <span>{{ __('Receive electronic invoice copy when issued') }}</span>
        </label>
        <label class="flex items-center gap-3 text-sm text-ink-gray-8 cursor-pointer">
          <input v-model="notifications.email_reminders" type="checkbox" class="rounded border-outline-gray-2 text-blue-600 focus:ring-blue-500" />
          <span>{{ __('Receive upcoming payment due date notices') }}</span>
        </label>
        <label class="flex items-center gap-3 text-sm text-ink-gray-8 cursor-pointer">
          <input v-model="notifications.email_receipts" type="checkbox" class="rounded border-outline-gray-2 text-blue-600 focus:ring-blue-500" />
          <span>{{ __('Receive payment confirmation receipts') }}</span>
        </label>
      </div>
    </div>

    <!-- Request Change Modal -->
    <Dialog v-model:open="showChangeModal" :size="'lg'">
      <template #body>
        <div class="p-6 bg-surface-base text-ink-gray-9 space-y-5">
          <div class="border-b border-outline-gray-1 pb-3">
            <h2 class="text-lg font-bold text-ink-gray-9">
              {{ __('Submit Account Detail Change Request') }}
            </h2>
            <p class="text-xs text-ink-gray-5 mt-1">
              {{ __('Proposed changes will be routed to Crestara administrators for verification before applying.') }}
            </p>
          </div>

          <form class="space-y-4" @submit.prevent="submitRequest">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormControl
                v-model="changeForm.company"
                :label="__('Company / Organization Name')"
                type="text"
                required
              />
              <FormControl
                v-model="changeForm.full_name"
                :label="__('Contact Full Name')"
                type="text"
                required
              />
              <FormControl
                v-model="changeForm.phone"
                :label="__('Phone Number')"
                type="text"
                required
              />
              <FormControl
                v-model="changeForm.tax_id"
                :label="__('Tax ID / VAT Registration')"
                type="text"
              />
            </div>

            <FormControl
              v-model="changeForm.address"
              :label="__('New Billing Street Address')"
              type="textarea"
              rows="2"
              required
            />

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormControl
                v-model="changeForm.city"
                :label="__('City')"
                type="text"
                required
              />
              <FormControl
                v-model="changeForm.state"
                :label="__('State / Province')"
                type="text"
                required
              />
              <FormControl
                v-model="changeForm.zip"
                :label="__('Postal Code')"
                type="text"
                required
              />
            </div>

            <FormControl
              v-model="changeForm.reason"
              :label="__('Reason for Change (Required by Administration)')"
              type="textarea"
              rows="2"
              placeholder="e.g. Relocating office headquarters, change in billing representative, updated corporate legal entity..."
              required
            />

            <div class="flex justify-end gap-2 pt-4 border-t border-outline-gray-1">
              <Button variant="outline" :label="__('Cancel')" @click="showChangeModal = false" />
              <Button
                variant="solid"
                type="submit"
                :label="__('Submit for Approval')"
                :loading="submitting"
                :disabled="!changeForm.reason.trim()"
              />
            </div>
          </form>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useBusinessStore } from '@/stores/business'
import { FormControl, Button, Dialog } from 'frappe-ui'

const business = useBusinessStore()
const showChangeModal = ref(false)
const submitting = ref(false)

const clientProfile = computed(() => {
  return business.currentUser || business.users.find((u) => u.role === 'Customer') || {}
})

const customerRequests = computed(() => {
  const email = clientProfile.value.email || 'client@acme.corp'
  return business.changeRequests.filter(
    (r) => r.client_email === email || r.client_id === clientProfile.value.id
  )
})

const pendingCustomerRequest = computed(() => {
  return customerRequests.value.find((r) => r.status === 'Pending')
})

const notifications = reactive({
  email_invoices: true,
  email_reminders: true,
  email_receipts: true,
})

const changeForm = reactive({
  company: '',
  full_name: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  tax_id: '',
  reason: '',
})

function openChangeModal() {
  changeForm.company = clientProfile.value.company || clientProfile.value.client_name || ''
  changeForm.full_name = clientProfile.value.full_name || ''
  changeForm.phone = clientProfile.value.phone || '+1 (555) 789-0123'
  changeForm.address = clientProfile.value.address || '450 Mission Street, Floor 14'
  changeForm.city = clientProfile.value.city || 'San Francisco'
  changeForm.state = clientProfile.value.state || 'CA'
  changeForm.zip = clientProfile.value.zip || '94105'
  changeForm.tax_id = clientProfile.value.tax_id || 'US-882-99120'
  changeForm.reason = ''
  showChangeModal.value = true
}

function submitRequest() {
  if (!changeForm.reason.trim()) return

  submitting.value = true
  setTimeout(() => {
    business.submitChangeRequest({
      requested_details: {
        company: changeForm.company,
        full_name: changeForm.full_name,
        phone: changeForm.phone,
        address: changeForm.address,
        city: changeForm.city,
        state: changeForm.state,
        zip: changeForm.zip,
        tax_id: changeForm.tax_id,
      },
      reason: changeForm.reason.trim(),
    })
    submitting.value = false
    showChangeModal.value = false
  }, 400)
}
</script>
