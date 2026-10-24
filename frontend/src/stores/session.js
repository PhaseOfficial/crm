import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import { supabase } from '@/utils/supabase'

export const sessionStore = defineStore('crm-session', () => {
  const currentSession = ref(null)
  const currentUser = ref(null)
  const isInitialized = ref(false)

  function syncUserCookie(userObj) {
    if (typeof document === 'undefined') return
    if (userObj?.email) {
      document.cookie = `user_id=${userObj.email}; path=/; max-age=2592000`
      if (typeof window !== 'undefined') {
        window.frappe_boot = window.frappe_boot || {}
        window.frappe_boot.session = { user: userObj.email }
        window.boot = window.boot || {}
        window.boot.session = { user: userObj.email }
      }
    } else {
      document.cookie = 'user_id=; path=/; max-age=0'
      if (typeof window !== 'undefined') {
        window.frappe_boot = window.frappe_boot || {}
        window.frappe_boot.session = { user: 'Guest' }
        window.boot = window.boot || {}
        window.boot.session = { user: 'Guest' }
      }
    }
  }

  // Initialize session from Supabase
  const initPromise = supabase.auth.getSession().then(({ data: { session } }) => {
    currentSession.value = session
    currentUser.value = session?.user || null
    isInitialized.value = true
    syncUserCookie(session?.user)
    return session
  })

  // Listen to Auth State changes (login, logout, token refresh)
  supabase.auth.onAuthStateChange((_event, session) => {
    currentSession.value = session
    currentUser.value = session?.user || null
    isInitialized.value = true
    syncUserCookie(session?.user)
  })

  const user = computed(() => {
    return currentUser.value?.email || currentUser.value?.id || null
  })

  const isLoggedIn = computed(() => !!currentUser.value)

  const loginLoading = ref(false)
  const loginError = ref(null)

  // Login handler compatible with existing code (.submit({ usr, pwd }))
  const login = {
    get loading() {
      return loginLoading.value
    },
    set loading(val) {
      loginLoading.value = Boolean(val)
    },
    get error() {
      return loginError.value
    },
    set error(val) {
      loginError.value = val
    },
    async submit(credentials = {}) {
      const email = credentials.email || credentials.usr
      const password = credentials.password || credentials.pwd

      if (!email || !password) {
        throw new Error('Please enter both email and password.')
      }

      loginLoading.value = true
      loginError.value = null

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          loginError.value = error
          throw error
        }

        currentSession.value = data.session
        currentUser.value = data.user
        return data
      } catch (err) {
        loginError.value = err
        throw err
      } finally {
        loginLoading.value = false
      }
    },
    reset() {
      loginError.value = null
      loginLoading.value = false
    },
  }

  const logoutLoading = ref(false)

  // Logout handler compatible with existing code (.submit())
  const logout = {
    get loading() {
      return logoutLoading.value
    },
    set loading(val) {
      logoutLoading.value = Boolean(val)
    },
    async submit() {
      logoutLoading.value = true
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error('Supabase sign out error:', err)
      } finally {
        currentSession.value = null
        currentUser.value = null
        logoutLoading.value = false
        syncUserCookie(null)
        router.replace({ name: 'Login' })
      }
    },
  }

  async function signUp({ email, password, data = {} }) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data },
    })
  }

  return {
    user,
    currentUser,
    currentSession,
    isLoggedIn,
    isInitialized,
    initPromise,
    login,
    logout,
    signUp,
  }
})
