import { defineStore } from 'pinia'
import { computed, ref, reactive } from 'vue'
import { formatCompactNumber } from '@/utils/numberFormat.js'

export const visible = ref(false)

export const notifications = reactive({
  data: [],
  fetched: true,
  loading: false,
  reload: () => {},
  fetch: () => Promise.resolve([]),
})

export const unreadNotificationsCount = computed(() => {
  const count = notifications.data?.filter((n) => !n.read).length || 0
  return count ? formatCompactNumber(count) : 0
})

export const notificationsStore = defineStore('crm-notifications', () => {
  const mark_as_read = {
    submit: () => {},
    loading: ref(false),
  }

  function toggle() {
    visible.value = !visible.value
  }

  function mark_doc_as_read(doc) {
    toggle()
  }

  return {
    unreadNotificationsCount,
    mark_as_read,
    mark_doc_as_read,
    toggle,
  }
})
