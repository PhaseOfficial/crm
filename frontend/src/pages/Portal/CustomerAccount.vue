<template>
  <div class="space-y-6 max-w-4xl">
    <div>
      <h1 class="text-2xl font-bold text-ink-gray-9">{{ __('My Account & Preferences') }}</h1>
      <p class="text-sm text-ink-gray-5 mt-1">
        {{ __('Manage your personal contact details, billing company information, and login credentials.') }}
      </p>
    </div>

    <form class="space-y-6" @submit.prevent="saveAccount">
      <!-- Profile Information -->
      <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-4">
        <h2 class="text-base font-bold text-ink-gray-9">{{ __('Contact Details') }}</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormControl
            v-model="profile.full_name"
            :label="__('Full Name')"
            type="text"
            required
          />
          <FormControl
            v-model="profile.email"
            :label="__('Email Address')"
            type="email"
            required
            disabled
          />
          <FormControl
            v-model="profile.phone"
            :label="__('Phone Number')"
            type="text"
            placeholder="+1 (555) 000-0000"
          />
          <FormControl
            v-model="profile.company"
            :label="__('Company / Organization')"
            type="text"
            placeholder="Company Name"
          />
        </div>
      </div>

      <!-- Billing Address -->
      <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-4">
        <h2 class="text-base font-bold text-ink-gray-9">{{ __('Billing Address') }}</h2>

        <div class="space-y-4">
          <FormControl
            v-model="profile.address"
            :label="__('Street Address')"
            type="textarea"
            rows="2"
            placeholder="123 Enterprise Blvd, Suite 100"
          />

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormControl
              v-model="profile.city"
              :label="__('City')"
              type="text"
              placeholder="San Francisco"
            />
            <FormControl
              v-model="profile.state"
              :label="__('State / Province')"
              type="text"
              placeholder="CA"
            />
            <FormControl
              v-model="profile.zip"
              :label="__('Postal Code')"
              type="text"
              placeholder="94105"
            />
          </div>
        </div>
      </div>

      <!-- Notification Preferences -->
      <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-6 shadow-sm space-y-3">
        <h2 class="text-base font-bold text-ink-gray-9">{{ __('Notification Preferences') }}</h2>
        <div class="space-y-2">
          <label class="flex items-center gap-3 text-sm text-ink-gray-8 cursor-pointer">
            <input v-model="profile.email_invoices" type="checkbox" class="rounded border-outline-gray-2 text-blue-600 focus:ring-blue-500" />
            <span>{{ __('Receive email copies of new invoices upon issuance') }}</span>
          </label>
          <label class="flex items-center gap-3 text-sm text-ink-gray-8 cursor-pointer">
            <input v-model="profile.email_reminders" type="checkbox" class="rounded border-outline-gray-2 text-blue-600 focus:ring-blue-500" />
            <span>{{ __('Receive upcoming due date and renewal reminders') }}</span>
          </label>
          <label class="flex items-center gap-3 text-sm text-ink-gray-8 cursor-pointer">
            <input v-model="profile.email_receipts" type="checkbox" class="rounded border-outline-gray-2 text-blue-600 focus:ring-blue-500" />
            <span>{{ __('Receive automated payment receipts') }}</span>
          </label>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3">
        <span v-if="savedMessage" class="text-sm text-emerald-600 font-medium">
          {{ savedMessage }}
        </span>
        <Button variant="solid" type="submit" :label="__('Save Changes')" :loading="saving" />
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useBusinessStore } from '@/stores/business'
import { FormControl, Button } from 'frappe-ui'

const business = useBusinessStore()
const saving = ref(false)
const savedMessage = ref('')

const profile = reactive({
  full_name: business.currentUser.full_name || 'Sarah Connor',
  email: business.currentUser.email || 'client@acme.corp',
  phone: '+1 (555) 789-0123',
  company: 'Acme Global Corp',
  address: '450 Mission Street, Floor 14',
  city: 'San Francisco',
  state: 'CA',
  zip: '94105',
  email_invoices: true,
  email_reminders: true,
  email_receipts: true,
})

function saveAccount() {
  saving.value = true
  setTimeout(() => {
    saving.value = false
    savedMessage.value = 'Preferences saved successfully!'
    setTimeout(() => {
      savedMessage.value = ''
    }, 3000)
  }, 500)
}
</script>
