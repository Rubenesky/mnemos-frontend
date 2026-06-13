<template>
  <AppLayout :title="t('admin.users.title')">
    <div class="admin-users">
      <AdminSubnav />
      <!-- Header -->
      <div class="page-header">
        <p class="page-subtitle">{{ t('admin.users.subtitle') }}</p>
        <button class="btn-primary" @click="openCreate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {{ t('admin.users.addUser') }}
        </button>
      </div>

      <!-- Table -->
      <div class="table-card">
        <div v-if="loading" class="state-placeholder">{{ t('common.loading') }}</div>
        <div v-else-if="error" class="state-error">{{ error }}</div>
        <table v-else class="users-table">
          <thead>
            <tr>
              <th>{{ t('admin.users.col.name') }}</th>
              <th>{{ t('admin.users.col.role') }}</th>
              <th>{{ t('admin.users.col.status') }}</th>
              <th>{{ t('admin.users.col.assets') }}</th>
              <th>{{ t('admin.users.col.created') }}</th>
              <th>{{ t('admin.users.col.lastLogin') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" :class="{ 'row--inactive': !user.is_active }">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
                  <div>
                    <p class="user-name">{{ user.name }}</p>
                    <p class="user-email">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <span class="role-badge" :class="`role-badge--${user.role}`">{{ t('roles.' + user.role) }}</span>
              </td>
              <td>
                <span class="status-badge" :class="user.is_active ? 'status--active' : 'status--inactive'">
                  {{ user.is_active ? t('admin.users.active') : t('admin.users.inactive') }}
                </span>
              </td>
              <td class="text-center">{{ user.assets_count }}</td>
              <td class="text-muted">{{ formatDate(user.created_at) }}</td>
              <td class="text-muted">{{ user.last_login_at ? formatDate(user.last_login_at) : '—' }}</td>
              <td>
                <div class="row-actions">
                  <button class="btn-icon" :title="t('admin.users.editRole')" @click="openRoleModal(user)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    v-if="user.is_active"
                    class="btn-icon btn-icon--warn"
                    :title="t('admin.users.deactivate')"
                    :disabled="user.id === auth.user?.id"
                    @click="confirmDeactivate(user)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                  </button>
                  <button
                    v-else
                    class="btn-icon btn-icon--success"
                    :title="t('admin.users.activate')"
                    @click="activateUser(user)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                  <button
                    class="btn-icon btn-icon--danger"
                    :title="t('admin.users.delete')"
                    :disabled="user.id === auth.user?.id"
                    @click="confirmDelete(user)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create User Modal -->
    <Teleport to="body">
      <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
        <div class="modal">
          <h3 class="modal-title">{{ t('admin.users.addUser') }}</h3>
          <form @submit.prevent="submitCreate" class="modal-form">
            <div class="form-group">
              <label>{{ t('admin.users.form.name') }}</label>
              <input v-model="form.name" type="text" required class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.users.form.email') }}</label>
              <input v-model="form.email" type="email" required class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.users.form.password') }}</label>
              <input v-model="form.password" type="password" required minlength="8" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.users.form.role') }}</label>
              <select v-model="form.role" required class="form-input">
                <option value="admin">{{ t('roles.admin') }}</option>
                <option value="editor">{{ t('roles.editor') }}</option>
                <option value="volunteer">{{ t('roles.volunteer') }}</option>
                <option value="viewer">{{ t('roles.viewer') }}</option>
              </select>
            </div>
            <div v-if="form.role === 'volunteer'" class="form-group">
              <label>{{ t('admin.users.form.expiresAt') }}</label>
              <input v-model="form.expires_at" type="date" :min="tomorrow" required class="form-input" />
            </div>
            <p v-if="formError" class="form-error">{{ formError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showCreate = false">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? t('common.saving') : t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Change Role Modal -->
    <Teleport to="body">
      <div v-if="showRole" class="modal-backdrop" @click.self="showRole = false">
        <div class="modal">
          <h3 class="modal-title">{{ t('admin.users.editRole') }} — {{ roleTarget?.name }}</h3>
          <form @submit.prevent="submitRole" class="modal-form">
            <div class="form-group">
              <label>{{ t('admin.users.form.role') }}</label>
              <select v-model="roleForm.role" required class="form-input">
                <option value="admin">{{ t('roles.admin') }}</option>
                <option value="editor">{{ t('roles.editor') }}</option>
                <option value="volunteer">{{ t('roles.volunteer') }}</option>
                <option value="viewer">{{ t('roles.viewer') }}</option>
              </select>
            </div>
            <div v-if="roleForm.role === 'volunteer'" class="form-group">
              <label>{{ t('admin.users.form.expiresAt') }}</label>
              <input v-model="roleForm.expires_at" type="date" :min="tomorrow" required class="form-input" />
            </div>
            <p v-if="formError" class="form-error">{{ formError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showRole = false">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? t('common.saving') : t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Confirm Deactivate -->
    <Teleport to="body">
      <div v-if="showDeactivate" class="modal-backdrop" @click.self="showDeactivate = false">
        <div class="modal modal--sm">
          <h3 class="modal-title">{{ t('admin.users.deactivateConfirm.title') }}</h3>
          <p class="modal-body">{{ t('admin.users.deactivateConfirm.body', { name: deactivateTarget?.name }) }}</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showDeactivate = false">{{ t('common.cancel') }}</button>
            <button class="btn-danger" :disabled="saving" @click="submitDeactivate">
              {{ saving ? t('common.saving') : t('admin.users.deactivate') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirm Delete -->
    <Teleport to="body">
      <div v-if="showDelete" class="modal-backdrop" @click.self="showDelete = false">
        <div class="modal modal--sm">
          <h3 class="modal-title">{{ t('admin.users.deleteConfirm.title') }}</h3>
          <p class="modal-body">{{ t('admin.users.deleteConfirm.body', { name: deleteTarget?.name }) }}</p>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showDelete = false">{{ t('common.cancel') }}</button>
            <button class="btn-danger" :disabled="saving" @click="submitDelete">
              {{ saving ? t('common.saving') : t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/AppLayout.vue'
import AdminSubnav from '@/components/AdminSubnav.vue'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n({ useScope: 'global' })
const auth = useAuthStore()

const users = ref([])
const loading = ref(true)
const error = ref(null)
const saving = ref(false)
const formError = ref(null)

const showCreate = ref(false)
const showRole = ref(false)
const showDeactivate = ref(false)
const showDelete = ref(false)

const roleTarget = ref(null)
const deactivateTarget = ref(null)
const deleteTarget = ref(null)

const form = ref({ name: '', email: '', password: '', role: 'viewer', expires_at: '' })
const roleForm = ref({ role: 'viewer', expires_at: '' })

const tomorrow = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
})

onMounted(fetchUsers)

async function fetchUsers() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/admin/users')
    users.value = res.data
  } catch {
    error.value = t('common.errorLoading')
  } finally {
    loading.value = false
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function openCreate() {
  form.value = { name: '', email: '', password: '', role: 'viewer', expires_at: '' }
  formError.value = null
  showCreate.value = true
}

async function submitCreate() {
  formError.value = null
  saving.value = true
  try {
    const payload = { name: form.value.name, email: form.value.email, password: form.value.password, role: form.value.role }
    if (form.value.role === 'volunteer') payload.expires_at = form.value.expires_at
    const res = await api.post('/admin/users', payload)
    users.value.unshift(res.data)
    showCreate.value = false
  } catch (e) {
    formError.value = e.response?.data?.message
      || Object.values(e.response?.data?.errors || {})[0]?.[0]
      || t('common.errorSaving')
  } finally {
    saving.value = false
  }
}

function openRoleModal(user) {
  roleTarget.value = user
  roleForm.value = { role: user.role, expires_at: user.expires_at ? user.expires_at.split('T')[0] : '' }
  formError.value = null
  showRole.value = true
}

async function submitRole() {
  formError.value = null
  saving.value = true
  try {
    const payload = { role: roleForm.value.role }
    if (roleForm.value.role === 'volunteer') payload.expires_at = roleForm.value.expires_at
    const res = await api.patch(`/admin/users/${roleTarget.value.id}/role`, payload)
    Object.assign(roleTarget.value, res.data)
    showRole.value = false
  } catch (e) {
    formError.value = e.response?.data?.message || t('common.errorSaving')
  } finally {
    saving.value = false
  }
}

function confirmDeactivate(user) {
  deactivateTarget.value = user
  formError.value = null
  showDeactivate.value = true
}

async function submitDeactivate() {
  saving.value = true
  try {
    const res = await api.patch(`/admin/users/${deactivateTarget.value.id}/deactivate`)
    Object.assign(deactivateTarget.value, res.data)
    showDeactivate.value = false
  } catch (e) {
    formError.value = e.response?.data?.message || t('common.errorSaving')
  } finally {
    saving.value = false
  }
}

async function activateUser(user) {
  try {
    const res = await api.patch(`/admin/users/${user.id}/activate`)
    Object.assign(user, res.data)
  } catch {
    // no-op: table row stays as-is
  }
}

function confirmDelete(user) {
  deleteTarget.value = user
  formError.value = null
  showDelete.value = true
}

async function submitDelete() {
  saving.value = true
  try {
    await api.delete(`/admin/users/${deleteTarget.value.id}`)
    users.value = users.value.filter(u => u.id !== deleteTarget.value.id)
    showDelete.value = false
  } catch (e) {
    formError.value = e.response?.data?.message || t('common.errorSaving')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.admin-users {
  max-width: 1100px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 640px) {
  /* Inset shadow paints on the viewport edge, not the content edge — no content covered */
  .table-card {
    box-shadow: inset -10px 0 10px -8px rgba(0, 0, 0, 0.08);
  }
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.users-table th {
  background: #f8fafc;
  padding: 10px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
}

.users-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
}

.users-table tr:last-child td { border-bottom: none; }
.row--inactive td { opacity: 0.55; }

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
  color: #f59e0b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-name { font-weight: 500; color: #0f172a; margin: 0; }
.user-email { font-size: 12px; color: #64748b; margin: 0; }

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
}
.role-badge--admin    { background: #fef9c3; color: #854d0e; }
.role-badge--editor   { background: #dbeafe; color: #1e40af; }
.role-badge--viewer   { background: #f1f5f9; color: #64748b; }
.role-badge--volunteer{ background: #f3e8ff; color: #6b21a8; }

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
}
.status--active   { background: #dcfce7; color: #166534; }
.status--inactive { background: #fee2e2; color: #991b1b; }

.text-center { text-align: center; }
.text-muted  { color: #94a3b8; font-size: 12px; }

.row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.btn-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.btn-icon svg { width: 13px; height: 13px; }
.btn-icon:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
.btn-icon:disabled { opacity: 0.35; cursor: not-allowed; }

.btn-icon--warn:hover    { background: #fef9c3; border-color: #fde047; color: #854d0e; }
.btn-icon--success:hover { background: #dcfce7; border-color: #86efac; color: #166534; }
.btn-icon--danger:hover  { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  background: #0f172a;
  color: #f59e0b;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.12s;
}
.btn-primary svg { width: 14px; height: 14px; }
.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  height: 34px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 13px;
  font-family: inherit;
  color: #64748b;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-secondary:hover { background: #f1f5f9; }

.btn-danger {
  height: 34px;
  padding: 0 14px;
  background: #dc2626;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.12s;
}
.btn-danger:hover { opacity: 0.85; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
}
.modal--sm { max-width: 360px; }

.modal-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 18px;
}

.modal-body {
  font-size: 13px;
  color: #475569;
  margin: 0 0 18px;
  line-height: 1.5;
}

.modal-form { display: flex; flex-direction: column; gap: 14px; }

.form-group { display: flex; flex-direction: column; gap: 5px; }

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  height: 36px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 13px;
  font-family: inherit;
  color: #0f172a;
  background: #fff;
  transition: border-color 0.12s;
}
.form-input:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
}

select.form-input { cursor: pointer; }

.form-error {
  font-size: 12px;
  color: #dc2626;
  margin: 0;
  padding: 6px 10px;
  background: #fee2e2;
  border-radius: 6px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.state-placeholder,
.state-error {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}
.state-error { color: #dc2626; }
</style>
