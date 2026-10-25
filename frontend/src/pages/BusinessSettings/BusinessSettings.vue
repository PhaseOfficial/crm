<template>
  <div class="flex flex-col h-full overflow-hidden">
    <LayoutHeader>
      <template #left-header>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-ink-gray-9">{{ __('Business Settings') }}</h1>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-purple-2 text-ink-purple-7 border border-outline-purple-2">
            {{ __('Administrator Only') }}
          </span>
        </div>
      </template>
      <template #right-header>
        <div class="flex items-center gap-2">
          <span v-if="savedSuccess" class="text-xs text-ink-green-3 font-semibold">
            {{ __('Settings saved!') }}
          </span>
          <Button variant="solid" :label="__('Save Settings')" :loading="saving" @click="save" />
        </div>
      </template>
    </LayoutHeader>

    <div class="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl">
      <!-- Company Information Card -->
      <div class="bg-surface-base rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-4">
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
      <div class="bg-surface-base rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-4">
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
      <div class="bg-surface-base rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-4">
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
                    class="bg-surface-gray-1 border border-outline-gray-2 rounded px-2 py-1 text-xs font-semibold text-ink-gray-9 focus:outline-none"
                    @change="onRoleChanged(user)"
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
                        ? 'bg-surface-blue-2 text-ink-blue-7'
                        : user.role === 'Administrator'
                          ? 'bg-surface-purple-2 text-ink-purple-7'
                          : 'bg-surface-green-2 text-ink-green-7'
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

      <!-- Client Account Change Requests Queue -->
      <div class="bg-surface-base rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-ink-gray-9 flex items-center gap-2">
                <span class="lucide-file-check size-5 text-blue-500" />
                {{ __('Client Account Change Requests') }}
              </h2>
              <span
                v-if="business.pendingChangeRequests.length"
                class="px-2 py-0.5 rounded-full text-xs font-bold bg-surface-amber-2 text-ink-amber-7 border border-outline-amber-2"
              >
                {{ business.pendingChangeRequests.length }} {{ __('Pending Review') }}
              </span>
            </div>
            <p class="text-xs text-ink-gray-5 mt-0.5">
              {{ __('Review and approve or reject profile, company name, and billing address updates submitted by portal clients.') }}
            </p>
          </div>
        </div>

        <div class="border border-outline-gray-1 rounded-lg overflow-hidden">
          <table class="w-full text-left text-sm border-collapse">
            <thead class="bg-surface-gray-1 text-xs font-semibold text-ink-gray-6 uppercase tracking-wider">
              <tr>
                <th class="py-3 px-4">{{ __('Client & Organization') }}</th>
                <th class="py-3 px-4">{{ __('Requested Updates') }}</th>
                <th class="py-3 px-4">{{ __('Client Reason') }}</th>
                <th class="py-3 px-4">{{ __('Status') }}</th>
                <th class="py-3 px-4 text-right">{{ __('Actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-gray-1">
              <tr
                v-for="req in business.changeRequests"
                :key="req.id"
                class="hover:bg-surface-gray-1"
              >
                <td class="py-4 px-4">
                  <div class="font-bold text-ink-gray-9">{{ req.organization }}</div>
                  <div class="text-xs text-ink-gray-6">{{ req.client_name }}</div>
                  <div class="text-xs text-ink-gray-4">{{ req.client_email }}</div>
                  <div class="text-[10px] text-ink-gray-4 mt-0.5">{{ req.requested_date }}</div>
                </td>

                <td class="py-4 px-4">
                  <div class="space-y-1 text-xs">
                    <div
                      v-if="req.requested_details.company && req.requested_details.company !== req.current_details.company"
                      class="flex items-center gap-1.5"
                    >
                      <span class="font-semibold text-ink-gray-5">Company:</span>
                      <span class="line-through text-ink-gray-4">{{ req.current_details.company }}</span>
                      <span class="text-ink-gray-4">→</span>
                      <span class="font-bold text-ink-gray-9">{{ req.requested_details.company }}</span>
                    </div>

                    <div
                      v-if="req.requested_details.full_name && req.requested_details.full_name !== req.current_details.full_name"
                      class="flex items-center gap-1.5"
                    >
                      <span class="font-semibold text-ink-gray-5">Contact:</span>
                      <span class="line-through text-ink-gray-4">{{ req.current_details.full_name }}</span>
                      <span class="text-ink-gray-4">→</span>
                      <span class="font-bold text-ink-gray-9">{{ req.requested_details.full_name }}</span>
                    </div>

                    <div
                      v-if="req.requested_details.phone && req.requested_details.phone !== req.current_details.phone"
                      class="flex items-center gap-1.5"
                    >
                      <span class="font-semibold text-ink-gray-5">Phone:</span>
                      <span class="line-through text-ink-gray-4">{{ req.current_details.phone }}</span>
                      <span class="text-ink-gray-4">→</span>
                      <span class="font-bold text-ink-gray-9">{{ req.requested_details.phone }}</span>
                    </div>

                    <div
                      v-if="req.requested_details.address && req.requested_details.address !== req.current_details.address"
                      class="flex items-center gap-1.5"
                    >
                      <span class="font-semibold text-ink-gray-5">Address:</span>
                      <span class="line-through text-ink-gray-4">{{ req.current_details.address }}</span>
                      <span class="text-ink-gray-4">→</span>
                      <span class="font-bold text-ink-gray-9">{{ req.requested_details.address }}</span>
                    </div>

                    <div
                      v-if="req.requested_details.tax_id && req.requested_details.tax_id !== req.current_details.tax_id"
                      class="flex items-center gap-1.5"
                    >
                      <span class="font-semibold text-ink-gray-5">Tax ID:</span>
                      <span class="line-through text-ink-gray-4">{{ req.current_details.tax_id }}</span>
                      <span class="text-ink-gray-4">→</span>
                      <span class="font-bold text-ink-gray-9">{{ req.requested_details.tax_id }}</span>
                    </div>
                  </div>
                </td>

                <td class="py-4 px-4 text-xs text-ink-gray-7 max-w-xs">
                  {{ req.reason }}
                </td>

                <td class="py-4 px-4">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                    :class="{
                      'bg-surface-amber-2 text-ink-amber-7 border border-outline-amber-2': req.status === 'Pending',
                      'bg-surface-green-2 text-ink-green-7 border border-outline-green-2': req.status === 'Approved',
                      'bg-surface-red-2 text-ink-red-7 border border-outline-red-2': req.status === 'Rejected',
                    }"
                  >
                    {{ __(req.status) }}
                  </span>
                  <div v-if="req.reviewed_by" class="text-[10px] text-ink-gray-4 mt-0.5">
                    by {{ req.reviewed_by }} ({{ req.reviewed_date }})
                  </div>
                </td>

                <td class="py-4 px-4 text-right">
                  <div v-if="req.status === 'Pending'" class="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="solid"
                      theme="green"
                      :label="__('Approve')"
                      @click="approveRequest(req.id)"
                    />
                    <Button
                      size="sm"
                      variant="subtle"
                      theme="red"
                      :label="__('Reject')"
                      @click="openRejectModal(req)"
                    />
                  </div>
                  <div v-else class="text-xs text-ink-gray-4">
                    {{ req.review_notes || __('Completed') }}
                  </div>
                </td>
              </tr>
              <tr v-if="!business.changeRequests.length">
                <td colspan="5" class="py-8 text-center text-xs text-ink-gray-4">
                  {{ __('No customer change requests logged.') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Reject Request Dialog -->
    <Dialog v-model:open="showRejectDialog" :size="'sm'">
      <template #body>
        <div class="p-6 bg-surface-base space-y-4">
          <h2 class="text-base font-bold text-ink-gray-9 border-b border-outline-gray-1 pb-3">
            {{ __('Reject Change Request') }}
          </h2>
          <p class="text-xs text-ink-gray-6">
            {{ __('Provide a reason for rejecting the request from {0}. The client will see this note in their portal.', [selectedReqToReject?.organization || 'the client']) }}
          </p>
          <FormControl
            v-model="rejectionReason"
            :label="__('Rejection Reason / Note')"
            type="textarea"
            rows="3"
            placeholder="e.g. Please provide supporting corporate documentation or updated W-9 before change can be authorized."
            required
          />
          <div class="flex justify-end gap-2 pt-3 border-t border-outline-gray-1">
            <Button variant="subtle" :label="__('Cancel')" @click="showRejectDialog = false" />
            <Button
              variant="solid"
              theme="red"
              :label="__('Confirm Rejection')"
              :disabled="!rejectionReason.trim()"
              @click="confirmRejection"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Invite / Add Staff Modal -->
    <Dialog v-model:open="showInvite" :size="'md'">
      <template #body>
        <div class="p-6 bg-surface-base space-y-4">
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
import { reactive, ref, onMounted } from 'vue'
import { useBusinessStore } from '@/stores/business'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { FormControl, Button, Avatar, Dialog } from 'frappe-ui'

const business = useBusinessStore()
const saving = ref(false)
const savedSuccess = ref(false)
const showInvite = ref(false)
const showRejectDialog = ref(false)
const selectedReqToReject = ref(null)
const rejectionReason = ref('')

onMounted(() => {
  business.fetchUsersFromSupabase()
})

function onRoleChanged(user) {
  business.updateUserRole(user.id, user.role)
}

function approveRequest(id) {
  business.approveChangeRequest(id, business.currentUser?.full_name || 'Admin')
}

function openRejectModal(req) {
  selectedReqToReject.value = req
  rejectionReason.value = ''
  showRejectDialog.value = true
}

function confirmRejection() {
  if (!selectedReqToReject.value || !rejectionReason.value.trim()) return
  business.rejectChangeRequest(
    selectedReqToReject.value.id,
    rejectionReason.value.trim(),
    business.currentUser?.full_name || 'Admin'
  )
  showRejectDialog.value = false
  selectedReqToReject.value = null
}

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
