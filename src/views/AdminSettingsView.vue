<template>
  <AppLayout :title="t('admin.settings.title')">
    <div class="admin-settings">
      <AdminSubnav />

      <div v-if="loading" class="state-placeholder">{{ t('common.loading') }}</div>
      <template v-else>
        <!-- Preview banner -->
        <div class="preview-banner">
          <span class="preview-label">{{ t('admin.settings.preview') }}</span>
          <span class="preview-name">{{ form.org_name || '—' }}</span>
          <img v-if="logoPreview" :src="logoPreview" alt="logo" class="preview-logo" />
        </div>

        <form class="settings-form" @submit.prevent="saveSettings">
          <!-- Logo -->
          <div class="form-section">
            <h3 class="section-title">{{ t('admin.settings.form.logo') }}</h3>
            <div class="logo-row">
              <div class="logo-preview-wrap">
                <img v-if="logoPreview" :src="logoPreview" alt="logo" class="logo-img" />
                <div v-else class="logo-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              </div>
              <div class="logo-controls">
                <label class="btn-upload">
                  <input type="file" accept="image/png,image/jpeg,image/webp" class="file-input" @change="onLogoChange" />
                  {{ uploadingLogo ? t('common.saving') : t('admin.settings.form.logo') }}
                </label>
                <p class="hint">{{ t('admin.settings.form.logoHint') }}</p>
              </div>
            </div>
          </div>

          <!-- Identity fields -->
          <div class="form-section">
            <h3 class="section-title">{{ t('admin.settings.title') }}</h3>
            <div class="fields-grid">
              <div class="form-group form-group--full">
                <label>{{ t('admin.settings.form.orgName') }} <span class="required">*</span></label>
                <input v-model="form.org_name" type="text" required maxlength="255" class="form-input" />
              </div>
              <div class="form-group form-group--full">
                <label>{{ t('admin.settings.form.orgDescription') }}</label>
                <textarea v-model="form.org_description" maxlength="500" rows="3" class="form-input form-textarea"></textarea>
              </div>
              <div class="form-group">
                <label>{{ t('admin.settings.form.orgWebsite') }}</label>
                <input v-model="form.org_website" type="url" maxlength="255" class="form-input" placeholder="https://" />
              </div>
              <div class="form-group">
                <label>{{ t('admin.settings.form.orgEmail') }}</label>
                <input v-model="form.org_email" type="email" maxlength="255" class="form-input" />
              </div>
            </div>
          </div>

          <!-- Locale -->
          <div class="form-section">
            <h3 class="section-title">{{ t('admin.settings.form.orgLocale') }}</h3>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="form.org_locale" value="es" />
                <span>{{ t('admin.settings.form.localeEs') }}</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="form.org_locale" value="en" />
                <span>{{ t('admin.settings.form.localeEn') }}</span>
              </label>
            </div>
          </div>

          <p v-if="saveError" class="form-error">{{ saveError }}</p>

          <div class="form-footer">
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? t('admin.settings.form.saving') : t('admin.settings.form.save') }}
            </button>
          </div>
        </form>
      </template>
    </div>
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

const loading = ref(true)
const saving = ref(false)
const uploadingLogo = ref(false)
const saveError = ref(null)
const logoPreview = ref(null)

const form = ref({
  org_name: '',
  org_description: '',
  org_website: '',
  org_email: '',
  org_locale: 'es',
})

onMounted(async () => {
  try {
    const res = await api.get('/admin/settings')
    const s = res.data
    form.value.org_name        = s.org_name        ?? ''
    form.value.org_description = s.org_description ?? ''
    form.value.org_website     = s.org_website     ?? ''
    form.value.org_email       = s.org_email       ?? ''
    form.value.org_locale      = s.org_locale      ?? 'es'
    logoPreview.value          = s.org_logo_url    || null
  } catch {
    // silently show empty form
  } finally {
    loading.value = false
  }
})

async function saveSettings() {
  saveError.value = null
  saving.value = true
  try {
    const payload = {
      org_name:        form.value.org_name        || '',
      org_description: form.value.org_description ?? '',
      org_locale:      form.value.org_locale,
      org_website:     form.value.org_website     || null,
      org_email:       form.value.org_email       || null,
    }
    await api.patch('/admin/settings', payload)
    toast.success(t('admin.settings.saved') + ' — ' + t('admin.settings.savedDesc'))
  } catch (e) {
    saveError.value = e.response?.data?.message
      || Object.values(e.response?.data?.errors || {})[0]?.[0]
      || t('admin.settings.error')
  } finally {
    saving.value = false
  }
}

async function onLogoChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  logoPreview.value = URL.createObjectURL(file)
  uploadingLogo.value = true
  try {
    const fd = new FormData()
    fd.append('logo', file)
    const res = await api.post('/admin/settings/logo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    logoPreview.value = res.data.org_logo_url
    toast.success(t('admin.settings.saved') + ' — ' + t('admin.settings.savedDesc'))
  } catch {
    toast.error(t('admin.settings.error'))
    logoPreview.value = null
  } finally {
    uploadingLogo.value = false
  }
}
</script>

<style scoped>
.admin-settings {
  max-width: 720px;
}

.state-placeholder {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

/* Preview banner */
.preview-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef9c3;
  border: 1px solid #fde047;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 20px;
  font-size: 13px;
}

.preview-label { color: #854d0e; font-weight: 500; }
.preview-name  { color: #0f172a; font-weight: 600; }
.preview-logo  { height: 24px; border-radius: 4px; margin-left: auto; }

/* Form */
.settings-form { display: flex; flex-direction: column; gap: 0; }

.form-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 16px;
}

/* Logo row */
.logo-row { display: flex; align-items: flex-start; gap: 16px; }

.logo-preview-wrap {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.logo-img { width: 100%; height: 100%; object-fit: contain; }

.logo-placeholder svg {
  width: 28px;
  height: 28px;
  color: #cbd5e1;
}

.logo-controls { display: flex; flex-direction: column; gap: 6px; }

.btn-upload {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-upload:hover { background: #e2e8f0; }
.file-input { display: none; }

.hint { font-size: 11px; color: #94a3b8; margin: 0; }

/* Fields */
.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group--full { grid-column: 1 / -1; }

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.required { color: #dc2626; }

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

.form-textarea {
  height: auto;
  padding: 8px 10px;
  resize: vertical;
}

/* Radio */
.radio-group { display: flex; gap: 20px; }

.radio-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.radio-label input[type="radio"] { accent-color: #f59e0b; }

/* Errors */
.form-error {
  font-size: 12px;
  color: #dc2626;
  margin: 0 0 8px;
  padding: 6px 10px;
  background: #fee2e2;
  border-radius: 6px;
}

/* Footer */
.form-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 18px;
  background: #f59e0b;
  color: #0f172a;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.12s;
}
.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
