<template>
  <div class="min-h-screen bg-surface-gray-2 flex flex-col">
    <!-- Customer Portal Navigation Header -->
    <header class="bg-surface-white border-b border-outline-gray-1 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <!-- Logo & Portal Tag -->
          <div class="flex items-center gap-3">
            <router-link to="/portal" class="flex items-center gap-2">
              <img
                src="/crestara_logo.png"
                alt="Crestara CRM"
                class="h-8 w-auto object-contain"
              />
            </router-link>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
            >
              {{ __('Client Portal') }}
            </span>
          </div>

          <!-- Desktop Navigation Links -->
          <nav class="hidden md:flex space-x-1">
            <router-link
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="
                $route.path === item.to
                  ? 'bg-surface-gray-2 text-ink-gray-9 font-semibold'
                  : 'text-ink-gray-6 hover:text-ink-gray-9 hover:bg-surface-gray-1'
              "
            >
              {{ __(item.label) }}
            </router-link>
          </nav>

          <!-- Right: Workspace Switch & Account -->
          <div class="flex items-center gap-3">
            <button
              v-if="business.currentRole !== 'Customer'"
              type="button"
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-outline-gray-2 text-ink-gray-7 hover:bg-surface-gray-2 transition"
              @click="router.push('/dashboard')"
            >
              <span class="lucide-arrow-left size-3.5" />
              {{ __('CRM Workspace') }}
            </button>

            <!-- Profile & Logout Dropdown -->
            <Dropdown :options="userMenuOptions">
              <template #default>
                <button
                  class="flex items-center gap-2 p-1 rounded-full hover:bg-surface-gray-2 text-sm text-ink-gray-7 focus:outline-none"
                >
                  <Avatar
                    size="sm"
                    :label="business.currentUser.full_name || 'Client'"
                    :image="business.currentUser.avatar"
                  />
                  <span class="hidden lg:inline text-xs font-medium text-ink-gray-8">
                    {{ business.currentUser.full_name }}
                  </span>
                  <span class="lucide-chevron-down size-3.5 text-ink-gray-4" />
                </button>
              </template>
            </Dropdown>

            <!-- Mobile menu button -->
            <button
              class="md:hidden p-2 rounded-md text-ink-gray-6 hover:text-ink-gray-9 hover:bg-surface-gray-2"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <span :class="mobileMenuOpen ? 'lucide-x' : 'lucide-menu'" class="size-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile drawer links -->
      <div v-if="mobileMenuOpen" class="md:hidden border-t border-outline-gray-1 px-4 pt-2 pb-3 space-y-1 bg-surface-white">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="block px-3 py-2 rounded-md text-base font-medium"
          :class="
            $route.path === item.to
              ? 'bg-surface-gray-2 text-ink-gray-9 font-semibold'
              : 'text-ink-gray-6 hover:text-ink-gray-9 hover:bg-surface-gray-1'
          "
          @click="mobileMenuOpen = false"
        >
          {{ __(item.label) }}
        </router-link>

        <div v-if="business.currentRole !== 'Customer'" class="pt-2 border-t border-outline-gray-1 px-3">
          <button
            type="button"
            class="w-full text-left py-2 text-xs font-medium text-ink-blue-6"
            @click="router.push('/dashboard')"
          >
            ← {{ __('Return to CRM Workspace') }}
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-surface-white border-t border-outline-gray-1 py-4 text-center text-xs text-ink-gray-5">
      <div class="max-w-7xl mx-auto px-4">
        © {{ new Date().getFullYear() }} {{ business.settings.business_name }}. {{ __('Customer Workspace') }}
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBusinessStore } from '@/stores/business'
import { sessionStore } from '@/stores/session'
import { Dropdown, Avatar } from 'frappe-ui'

const router = useRouter()
const business = useBusinessStore()
const session = sessionStore()
const mobileMenuOpen = ref(false)

const navItems = [
  { label: 'Dashboard', to: '/portal' },
  { label: 'My Purchases & Invoices', to: '/portal/purchases' },
  { label: 'My Calendar', to: '/portal/calendar' },
  { label: 'Promotions', to: '/portal/promotions' },
  { label: 'My Account', to: '/portal/account' },
]

const userMenuOptions = computed(() => {
  const options = [
    {
      label: 'My Account',
      icon: 'user',
      onClick: () => router.push({ path: '/portal/account' }),
    },
  ]

  if (business.currentRole !== 'Customer') {
    options.push({
      label: 'CRM Workspace',
      icon: 'arrow-left',
      onClick: () => router.push({ path: '/dashboard' }),
    })
  }

  options.push({
    label: 'Sign Out',
    icon: 'log-out',
    onClick: () => session.logout.submit(),
  })

  return options
})
</script>
