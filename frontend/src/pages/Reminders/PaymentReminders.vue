<template>
  <div class="flex flex-col h-full overflow-hidden">
    <LayoutHeader>
      <template #left-header>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold text-ink-gray-9">{{ __('Payment Reminders') }}</h1>
          <span class="text-xs px-2 py-0.5 rounded-full bg-surface-gray-2 text-ink-gray-6 font-semibold">
            {{ business.reminders.length }}
          </span>
        </div>
      </template>
    </LayoutHeader>

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Reminder Overview Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-5 shadow-sm">
          <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-5">{{ __('Overdue Invoices Pending Reminder') }}</span>
          <div class="mt-2 text-2xl font-bold text-red-600">
            {{ business.reminders.filter(r => r.status === 'Overdue').length }}
          </div>
          <span class="text-xs text-red-500 mt-1 block">{{ __('Requires immediate collection outreach') }}</span>
        </div>

        <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-5 shadow-sm">
          <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-5">{{ __('Upcoming 30-Day Deadlines') }}</span>
          <div class="mt-2 text-2xl font-bold text-amber-600">
            {{ business.reminders.filter(r => r.status === 'Upcoming').length }}
          </div>
          <span class="text-xs text-ink-gray-4 mt-1 block">{{ __('Automated schedule armed') }}</span>
        </div>

        <div class="bg-surface-white rounded-xl border border-outline-gray-1 p-5 shadow-sm">
          <span class="text-xs font-semibold uppercase tracking-wider text-ink-gray-5">{{ __('Reminder Delivery Health') }}</span>
          <div class="mt-2 text-2xl font-bold text-emerald-600">100%</div>
          <span class="text-xs text-emerald-600 mt-1 block">{{ __('Zero delivery failures') }}</span>
        </div>
      </div>

      <!-- Reminders Table -->
      <div class="bg-surface-white rounded-xl border border-outline-gray-1 overflow-hidden shadow-sm">
        <div class="px-6 py-4 border-b border-outline-gray-1 flex items-center justify-between">
          <h2 class="text-base font-bold text-ink-gray-9">{{ __('Active Reminder Schedule') }}</h2>
          <span class="text-xs text-ink-gray-5">{{ __('Automated notices sent via verified company email') }}</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-surface-gray-1 border-b border-outline-gray-1 text-xs font-semibold text-ink-gray-6 uppercase tracking-wider">
                <th class="py-3 px-6">{{ __('Invoice / Target') }}</th>
                <th class="py-3 px-6">{{ __('Client Recipient') }}</th>
                <th class="py-3 px-6">{{ __('Due Date') }}</th>
                <th class="py-3 px-6">{{ __('Balance Due') }}</th>
                <th class="py-3 px-6">{{ __('Reminder Rule') }}</th>
                <th class="py-3 px-6">{{ __('Last Sent') }}</th>
                <th class="py-3 px-6">{{ __('Status') }}</th>
                <th class="py-3 px-6 text-right">{{ __('Action') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-gray-1">
              <tr
                v-for="rem in business.reminders"
                :key="rem.id"
                class="hover:bg-surface-gray-1 transition-colors"
              >
                <td class="py-4 px-6 font-semibold text-ink-gray-9">
                  {{ rem.invoice_number }}
                </td>
                <td class="py-4 px-6">
                  <div class="font-medium text-ink-gray-9">{{ rem.client_name }}</div>
                  <div class="text-xs text-ink-gray-4">{{ rem.client_email }}</div>
                </td>
                <td class="py-4 px-6 text-ink-gray-6">{{ rem.due_date }}</td>
                <td class="py-4 px-6 font-bold" :class="rem.status === 'Overdue' ? 'text-red-600' : 'text-ink-gray-9'">
                  ${{ formatNum(rem.balance_due) }}
                </td>
                <td class="py-4 px-6 text-xs text-ink-gray-7">{{ rem.reminder_type }}</td>
                <td class="py-4 px-6 text-xs text-ink-gray-5">{{ rem.last_sent_date || __('Never') }}</td>
                <td class="py-4 px-6">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="rem.delivery_status === 'Delivered' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'"
                  >
                    {{ rem.delivery_status }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    :label="__('Send Now')"
                    iconLeft="send"
                    @click="triggerReminder(rem.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useBusinessStore } from '@/stores/business'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { Button } from 'frappe-ui'

const business = useBusinessStore()

function triggerReminder(id) {
  business.sendReminder(id)
  alert('Reminder notification dispatched successfully!')
}

function formatNum(num) {
  return Number(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
</script>
