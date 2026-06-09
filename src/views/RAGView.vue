<template>
  <AppLayout :title="t('rag.title')">
    <div class="rag-view">
      <div class="chat-card" ref="chatBox">
        <div v-if="messages.length === 0" class="empty-state">
          <span class="empty-icon">🤖</span>
          <p class="empty-text">{{ t('rag.askQuestion') }}</p>
          <div class="examples-list">
            <button
              v-for="example in examples"
              :key="example"
              class="example-btn"
              @click="askExample(example)"
            >
              {{ example }}
            </button>
          </div>
        </div>

        <div v-for="(msg, i) in messages" :key="i" class="msg-group">
          <div class="bubble bubble--user">{{ msg.question }}</div>
          <div class="bubble bubble--ai">
            <span class="ai-label">✨ IA</span>
            {{ msg.answer }}
          </div>
        </div>

        <div v-if="loading" class="msg-group">
          <div class="bubble bubble--loading">{{ t('rag.querying') }}</div>
        </div>
      </div>

      <div class="input-bar">
        <input
          v-model="question"
          type="text"
          :placeholder="t('rag.placeholder')"
          @keyup.enter="handleQuery"
        />
        <button class="btn-send" :disabled="loading || !question" @click="handleQuery">
          {{ t('rag.askBtn') }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '../components/AppLayout.vue'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const { t } = useI18n()
const toast = useToastStore()
const question = ref('')
const loading = ref(false)
const messages = ref([])
const chatBox = ref(null)

const examples = computed(() => [
  t('rag.example1'),
  t('rag.example2'),
  t('rag.example3'),
  t('rag.example4'),
  t('rag.example5'),
])

async function handleQuery() {
  if (!question.value || loading.value) return

  const userQuestion = question.value
  question.value = ''
  loading.value = true

  try {
    const response = await api.post('/rag', { question: userQuestion })
    messages.value.push({
      question: userQuestion,
      answer: response.data.answer,
    })
    await nextTick()
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
  } catch (e) {
    toast.error(t('rag.queryError'))
  } finally {
    loading.value = false
  }
}

function askExample(example) {
  question.value = example
  handleQuery()
}
</script>

<style scoped>
.rag-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-card {
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 420px;
  max-height: calc(100vh - 52px - 48px - 60px);
  overflow-y: auto;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 0;
}

.empty-icon { font-size: 32px; }

.empty-text {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 400px;
  margin-top: 8px;
}

.example-btn {
  display: block;
  width: 100%;
  text-align: left;
  font-size: 12px;
  font-family: inherit;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  color: #64748b;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.example-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}

.msg-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bubble {
  max-width: 75%;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.bubble--user {
  align-self: flex-end;
  background: #0f172a;
  color: #ffffff;
  border-radius: 8px 8px 0 8px;
}

.bubble--ai {
  align-self: flex-start;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  border-radius: 8px 8px 8px 0;
}

.ai-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #f59e0b;
  margin-bottom: 4px;
}

.bubble--loading {
  align-self: flex-start;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
  border-radius: 8px 8px 8px 0;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.input-bar {
  background: #0f172a;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.input-bar input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 13px;
  font-family: inherit;
}

.input-bar input::placeholder {
  color: rgba(148, 163, 184, 0.6);
}

.btn-send {
  height: 28px;
  padding: 0 12px;
  background: #f59e0b;
  color: #0f172a;
  border: none;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.12s ease;
  flex-shrink: 0;
}

.btn-send:hover:not(:disabled) { opacity: 0.88; }
.btn-send:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
