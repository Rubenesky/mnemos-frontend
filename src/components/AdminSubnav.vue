<template>
  <nav class="admin-subnav">
    <RouterLink to="/admin/users"      class="subnav-item" :class="{ active: route.path.startsWith('/admin/users') }">{{ t('admin.nav.users') }}</RouterLink>
    <RouterLink to="/admin/settings"   class="subnav-item" :class="{ active: route.path.startsWith('/admin/settings') }">{{ t('admin.nav.settings') }}</RouterLink>
    <RouterLink to="/admin/system"     class="subnav-item" :class="{ active: route.path.startsWith('/admin/system') }">{{ t('admin.nav.system') }}</RouterLink>
    <RouterLink to="/admin/volunteers" class="subnav-item" :class="{ active: route.path.startsWith('/admin/volunteers') }">{{ t('admin.nav.volunteers') }}</RouterLink>
  </nav>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
</script>

<style scoped>
.admin-subnav {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 20px;
  padding-bottom: 0;
}

.subnav-item {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.12s, border-color 0.12s;
}

.subnav-item:hover {
  color: #0f172a;
  border-bottom-color: #cbd5e1;
}

.subnav-item.active {
  color: #0f172a;
  border-bottom-color: #f59e0b;
}
</style>
