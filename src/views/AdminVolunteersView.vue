<template>
  <AppLayout :title="t('admin.volunteers.title')">
    <div class="admin-volunteers">
      <AdminSubnav />

      <div class="page-header">
        <p class="page-subtitle">{{ t('admin.volunteers.subtitle') }}</p>
      </div>

      <div class="table-card">
        <div v-if="loading" class="state-placeholder">{{ t('common.loading') }}</div>
        <div v-else-if="!volunteers.length" class="state-placeholder">
          {{ t('admin.volunteers.noVolunteers') }}
        </div>
        <table v-else class="volunteers-table">
          <thead>
            <tr>
              <th>{{ t('admin.volunteers.col.name') }}</th>
              <th>{{ t('admin.volunteers.col.status') }}</th>
              <th>{{ t('admin.volunteers.col.expires') }}</th>
              <th>{{ t('admin.volunteers.col.daysLeft') }}</th>
              <th>{{ t('admin.volunteers.col.assets') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="vol in volunteers" :key="vol.id" :class="{ 'row--inactive': !vol.is_active }">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ vol.name.charAt(0).toUpperCase() }}</div>
                  <div>
                    <p class="user-name">{{ vol.name }}</p>
                    <p class="user-email">{{ vol.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" :class="vol.is_active ? 'badge--green' : 'badge--gray'">
                  {{ vol.is_active ? t('admin.volunteers.status.active') : t('admin.volunteers.status.inactive') }}
                </span>
              </td>
              <td class="text-muted">
                {{ vol.expires_at ? formatDate(vol.expires_at) : '—' }}
              </td>
              <td>
                <span class="badge" :class="daysClass(vol.days_remaining)">
                  {{ daysLabel(vol.days_remaining) }}
                </span>
              </td>
              <td class="text-center">{{ vol.assets_count }}</td>
              <td>
                <button class="btn-icon" :title="t('admin.volunteers.extendAccess')" @click="openExtend(vol)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Extend Modal -->
    <Teleport to="body">
      <div v-if="showExtend" class="modal-backdrop" @click.self="showExtend = false">
        <div class="modal">
          <h3 class="modal-title">
            {{ t('admin.volunteers.extendTitle', { name: extendTarget?.name }) }}
          </h3>
          <form @submit.prevent="submitExtend" class="modal-form">
            <div class="form-group">
              <label>{{ t('admin.volunteers.extendDays') }}</label>
              <input
                v-model.number="extendDays"
                type="number"
                min="1"
                max="365"
                required
                class="form-input"
              />
              <p class="hint">{{ t('admin.volunteers.extendHint') }}</p>
            </div>
            <p v-if="extendError" class="form-error">{{ extendError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showExtend = false">
                {{ t('common.cancel') }}
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? t('admin.volunteers.extending') : t('admin.volunteers.extendAccess') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/AppLayout.vue'
import AdminSubnav from '@/components/AdminSubnav.vue'
import api from '@/api/axios'
import { useToastStore } from '@/stores/toast'

const { t } = useI18n({ useScope: 'global' })
const toast = useToastStore()

const loading      = ref(false)
const volunteers   = ref([])
const showExtend   = ref(false)
const extendTarget = ref(null)
const extendDays   = ref(30)
const extendError  = ref(null)
const saving       = ref(false)

async function fetchVolunteers() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/volunteers')
    volunteers.value = data
  } finally {
    loading.value = false
  }
}

function openExtend(vol) {
  extendTarget.value = vol
  extendDays.value   = 30
  extendError.value  = null
  showExtend.value   = true
}

async function submitExtend() {
  extendError.value = null
  saving.value = true
  try {
    const { data } = await api.patch(`/admin/volunteers/${extendTarget.value.id}/extend`, {
      days: extendDays.value,
    })
    const idx = volunteers.value.findIndex(v => v.id === data.id)
    if (idx !== -1) volunteers.value[idx] = data
    showExtend.value = false
    toast.success(t('admin.volunteers.extended'))
  } catch (err) {
    extendError.value = err.response?.data?.message ?? t('common.error')
  } finally {
    saving.value = false
  }
}

function daysClass(days) {
  if (days === null) return 'badge--gray'
  if (days > 14)     return 'badge--green'
  if (days >= 1)     return 'badge--yellow'
  return 'badge--red'
}

function daysLabel(days) {
  if (days === null)  return t('admin.volunteers.days.never')
  if (days <= 0)      return t('admin.volunteers.days.expired')
  return t('admin.volunteers.days.days', { n: days })
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString()
}

onMounted(fetchVolunteers)
</script>

<style scoped>
.admin-volunteers {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 640px) {
  .table-card {
    box-shadow: inset -10px 0 10px -8px rgba(0, 0, 0, 0.08);
  }
}

.volunteers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.volunteers-table th {
  padding: 10px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.volunteers-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.volunteers-table tbody tr:last-child td {
  border-bottom: none;
}

.volunteers-table tbody tr:hover {
  background: #f8fafc;
}

.row--inactive {
  opacity: 0.55;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #0f172a;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-name {
  font-weight: 500;
  color: #0f172a;
  margin: 0;
  font-size: 13px;
}

.user-email {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
}

.text-muted {
  color: #94a3b8;
  font-size: 12px;
}

.text-center {
  text-align: center;
}

.btn-icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.btn-icon svg {
  width: 14px;
  height: 14px;
}

.btn-icon:hover {
  background: #f8fafc;
  border-color: #f59e0b;
  color: #f59e0b;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: #ffffff;
  border-radius: 12px;
  padding: 28px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 20px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #0f172a;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: #f59e0b;
}

.hint {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
}

.form-error {
  font-size: 12px;
  color: #991b1b;
  margin: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}
</style>
