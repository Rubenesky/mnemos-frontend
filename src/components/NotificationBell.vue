<template>
  <div class="notif-bell" ref="bellRef">
    <!-- Bell button -->
    <button
      class="bell-btn"
      :class="{ 'bell-btn--active': open }"
      @click="open = !open"
      aria-label="Notificaciones"
    >
      <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div v-if="open" class="notif-dropdown">
        <div class="notif-header">
          <span class="notif-title">Notificaciones</span>
          <button
            v-if="unreadCount > 0"
            class="btn-mark-all"
            @click="markAllRead"
          >
            Marcar todo como leído
          </button>
        </div>

        <div class="notif-list">
          <div v-if="notifications.length === 0" class="notif-empty">
            Sin notificaciones
          </div>

          <button
            v-for="n in notifications"
            :key="n.id"
            class="notif-item"
            :class="{ 'notif-item--unread': !n.read_at }"
            @click="markRead(n)"
          >
            <span class="notif-icon">{{ typeIcon(n.type) }}</span>
            <span class="notif-body">
              <span class="notif-msg">{{ formatMessage(n) }}</span>
              <span class="notif-time">{{ relativeTime(n.created_at) }}</span>
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/api/axios'

const open          = ref(false)
const notifications = ref([])
const unreadCount   = ref(0)
const bellRef       = ref(null)

let pollInterval = null

async function fetchNotifications() {
  try {
    const { data } = await api.get('/notifications')
    notifications.value = data.data
    unreadCount.value   = data.unread_count
  } catch {
    // silent — background poll should not disturb UX
  }
}

async function markRead(n) {
  if (n.read_at) return
  try {
    const { data } = await api.post(`/notifications/${n.id}/read`)
    const idx = notifications.value.findIndex(x => x.id === n.id)
    if (idx !== -1) notifications.value[idx] = data.data
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {
    // ignore
  }
}

async function markAllRead() {
  try {
    await api.post('/notifications/read-all')
    notifications.value = notifications.value.map(n => ({ ...n, read_at: new Date().toISOString() }))
    unreadCount.value = 0
  } catch {
    // ignore
  }
}

function typeIcon(type) {
  if (type === 'consent_responded') return '📋'
  if (type === 'volunteer_upload')  return '📤'
  return '🔔'
}

function formatMessage(n) {
  if (n.type === 'consent_responded') {
    return `Consentimiento ${n.data.person_name}: ${n.data.status}`
  }
  if (n.type === 'volunteer_upload') {
    return `${n.data.uploader_name} ha subido ${n.data.asset_name}`
  }
  return n.type
}

function relativeTime(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return 'hace un momento'
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} días`
}

function handleClickOutside(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => {
  fetchNotifications()
  pollInterval = setInterval(fetchNotifications, 30000)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  clearInterval(pollInterval)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notif-bell {
  position: relative;
}

/* ── Bell button ── */
.bell-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  flex-shrink: 0;
}

.bell-btn:hover,
.bell-btn--active {
  background: #fef9c3;
  border-color: #f59e0b;
  color: #0f172a;
}

.bell-icon {
  width: 16px;
  height: 16px;
}

.bell-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #f59e0b;
  color: #0f172a;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* ── Dropdown ── */
.notif-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  max-height: 420px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.notif-title {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.btn-mark-all {
  font-size: 11px;
  font-weight: 500;
  color: #f59e0b;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: color 0.12s ease;
}

.btn-mark-all:hover {
  color: #d97706;
}

.notif-list {
  overflow-y: auto;
  flex: 1;
}

.notif-empty {
  padding: 24px 14px;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.1s ease;
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item:hover {
  background: #f8fafc;
}

.notif-item--unread {
  background: #fefce8;
}

.notif-item--unread:hover {
  background: #fef9c3;
}

.notif-icon {
  font-size: 15px;
  flex-shrink: 0;
  line-height: 1.4;
}

.notif-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.notif-msg {
  font-size: 12px;
  font-weight: 400;
  color: #0f172a;
  line-height: 1.4;
  word-break: break-word;
}

.notif-time {
  font-size: 11px;
  color: #94a3b8;
}

/* ── Transition ── */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
