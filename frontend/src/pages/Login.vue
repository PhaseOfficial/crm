<template>
  <div class="flex min-h-screen items-center justify-center bg-surface-gray-2 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-6 rounded-2xl bg-surface-white p-8 shadow-sm border border-outline-base">
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <img
            src="/crestara_logo.png"
            alt="Crestara CRM"
            class="h-12 w-auto object-contain max-w-[200px]"
          />
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-ink-gray-9">
          {{
            authMode === 'forgot'
              ? __('Reset your password')
              : authMode === 'signup'
                ? __('Create an account')
                : __('Sign in to Crestara CRM')
          }}
        </h2>
        <p class="mt-2 text-sm text-ink-gray-5">
          {{
            authMode === 'forgot'
              ? __('Enter your email to receive a password reset link')
              : authMode === 'signup'
                ? __('Get started with your business & CRM workspace')
                : __('Enter your credentials to access your workspace')
          }}
        </p>
      </div>

      <!-- Mode Selector Tabs (Sign In vs Sign Up) -->
      <div v-if="authMode !== 'forgot'" class="flex rounded-lg bg-surface-gray-2 p-1 text-sm font-medium">
        <button
          type="button"
          :class="[
            'w-1/2 rounded-md py-1.5 transition-all',
            authMode === 'signin'
              ? 'bg-surface-white text-ink-gray-9 shadow-sm'
              : 'text-ink-gray-5 hover:text-ink-gray-8',
          ]"
          @click="setMode('signin')"
        >
          {{ __('Sign In') }}
        </button>
        <button
          type="button"
          :class="[
            'w-1/2 rounded-md py-1.5 transition-all',
            authMode === 'signup'
              ? 'bg-surface-white text-ink-gray-9 shadow-sm'
              : 'text-ink-gray-5 hover:text-ink-gray-8',
          ]"
          @click="setMode('signup')"
        >
          {{ __('Sign Up') }}
        </button>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <ErrorMessage v-if="errorMessage" :message="errorMessage" />
        <Alert
          v-if="infoMessage"
          theme="green"
          :title="infoMessage"
        />

        <div v-if="authMode === 'signup'">
          <label class="block text-sm font-medium text-ink-gray-7 mb-1">
            {{ __('Full Name') }}
          </label>
          <TextInput
            v-model="fullName"
            type="text"
            placeholder="John Doe"
            required
            :disabled="loading"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-ink-gray-7 mb-1">
            {{ __('Email address') }}
          </label>
          <TextInput
            v-model="email"
            type="email"
            placeholder="name@company.com"
            required
            :disabled="loading"
          />
        </div>

        <div v-if="authMode !== 'forgot'">
          <div class="flex items-center justify-between mb-1">
            <label class="block text-sm font-medium text-ink-gray-7">
              {{ __('Password') }}
            </label>
            <button
              v-if="authMode === 'signin'"
              type="button"
              class="text-xs font-medium text-ink-blue-6 hover:underline"
              @click="setMode('forgot')"
            >
              {{ __('Forgot password?') }}
            </button>
          </div>
          <TextInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
            :disabled="loading"
          />
        </div>

        <Button
          class="w-full justify-center !mt-6"
          variant="solid"
          type="submit"
          :loading="loading"
        >
          {{
            authMode === 'forgot'
              ? __('Send Reset Link')
              : authMode === 'signup'
                ? __('Create Account')
                : __('Sign in')
          }}
        </Button>

        <div v-if="authMode === 'forgot'" class="text-center pt-2">
          <button
            type="button"
            class="text-sm font-medium text-ink-blue-6 hover:underline"
            @click="setMode('signin')"
          >
            {{ __('Back to Sign in') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { sessionStore } from '@/stores/session'
import { useBusinessStore } from '@/stores/business'
import { Button, TextInput, ErrorMessage, Alert } from 'frappe-ui'

const router = useRouter()
const session = sessionStore()
const business = useBusinessStore()

const authMode = ref('signin') // 'signin' | 'signup' | 'forgot'
const fullName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

function setMode(mode) {
  authMode.value = mode
  errorMessage.value = ''
  infoMessage.value = ''
}

async function handleSubmit() {
  loading.value = true
  errorMessage.value = ''
  infoMessage.value = ''

  try {
    if (authMode.value === 'forgot') {
      const { error } = await session.resetPasswordForEmail({
        email: email.value.trim(),
      })
      if (error) throw error
      infoMessage.value = 'Password reset instructions have been sent to your email.'
      return
    }

    if (authMode.value === 'signup') {
      const { data, error } = await session.signUp({
        email: email.value.trim(),
        password: password.value,
        data: {
          full_name: fullName.value.trim(),
        },
      })

      if (error) throw error

      if (data?.session) {
        business.resolveUserRole(email.value.trim())
        redirectByRole()
      } else {
        infoMessage.value = 'Account created! Please check your email to confirm your registration, or sign in.'
        authMode.value = 'signin'
      }
    } else {
      await session.login.submit({
        email: email.value.trim(),
        password: password.value,
      })

      business.resolveUserRole(email.value.trim())
      redirectByRole()
    }
  } catch (err) {
    errorMessage.value =
      err?.message || 'Authentication failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}

function redirectByRole() {
  if (business.currentRole === 'Customer') {
    router.replace('/portal')
  } else {
    router.replace('/dashboard')
  }
}
</script>
