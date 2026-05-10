<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AgentConfig } from '../lib/types';

const props = defineProps<{
  visible: boolean;
  agentName: string;
  agentConfig: AgentConfig | undefined;
}>();

const emit = defineEmits<{
  (e: 'spawn', nodeId: string, directory: string): void;
  (e: 'close'): void;
}>();

const nodeId = ref(props.agentConfig?.defaultNodeId ?? '');
const directory = ref(props.agentConfig?.defaultDirectory ?? '');
const isSubmitting = ref(false);

const canSubmit = computed(() => {
  return nodeId.value.trim().length > 0 && directory.value.trim().length > 0;
});

const directoryError = computed(() => {
  const dir = directory.value.trim();
  if (!dir) return '';
  const isAbsolute = dir.startsWith('/') || /^[A-Za-z]:[\\/]/.test(dir);
  return isAbsolute ? '' : 'Directory must be an absolute path';
});

async function handleSubmit() {
  if (!canSubmit.value || directoryError.value) return;
  isSubmitting.value = true;
  emit('spawn', nodeId.value.trim(), directory.value.trim());
}

function handleClose() {
  if (!isSubmitting.value) {
    emit('close');
  }
}
</script>

<template>
  <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
    <div class="dialog">
      <div class="dialog-header">
        <h3>New Gateway Session</h3>
        <button class="close-btn" @click="handleClose" :disabled="isSubmitting">×</button>
      </div>

      <div class="dialog-body">
        <div class="field">
          <label>Agent</label>
          <div class="agent-name">{{ agentName }}</div>
        </div>

        <div class="field">
          <label for="gw-node">Node ID <span class="required">*</span></label>
          <input
            id="gw-node"
            v-model="nodeId"
            type="text"
            placeholder="e.g. gpu-node-1"
            :disabled="isSubmitting"
            autocapitalize="none"
            autocorrect="off"
          />
        </div>

        <div class="field">
          <label for="gw-dir">Working Directory <span class="required">*</span></label>
          <input
            id="gw-dir"
            v-model="directory"
            type="text"
            placeholder="/home/user/project-alpha"
            :disabled="isSubmitting"
            autocapitalize="none"
            autocorrect="off"
            spellcheck="false"
          />
          <p v-if="directoryError" class="field-error">{{ directoryError }}</p>
          <p v-else class="field-hint">Absolute path on the target node</p>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn secondary" @click="handleClose" :disabled="isSubmitting">Cancel</button>
        <button
          class="btn primary"
          :disabled="!canSubmit || !!directoryError || isSubmitting"
          @click="handleSubmit"
        >
          {{ isSubmitting ? 'Spawning...' : 'Create Session' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.dialog {
  background: var(--bg-main, #fff);
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-muted, #999);
  padding: 0.25rem;
}

.close-btn:hover {
  color: var(--text-primary, #333);
}

.dialog-body {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary, #666);
}

.required {
  color: #dc3545;
}

.agent-name {
  padding: 0.5rem 0.75rem;
  background: var(--bg-hover, #f0f0f0);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}

.field input {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  background: var(--bg-main, #fff);
  color: var(--text-primary, #333);
  font-size: 16px; /* prevent iOS zoom */
}

.field input:focus {
  outline: none;
  border-color: var(--text-accent, #0066cc);
}

.field-error {
  margin: 0;
  font-size: 0.75rem;
  color: #dc3545;
}

.field-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted, #999);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color, #e0e0e0);
}

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.secondary {
  background: var(--bg-hover, #f0f0f0);
  color: var(--text-primary, #333);
}

.btn.primary {
  background: var(--bg-primary, #0066cc);
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: var(--bg-primary-hover, #0052a3);
}

@media (prefers-color-scheme: dark) {
  .dialog-overlay {
    background: rgba(0, 0, 0, 0.6);
  }
  .agent-name {
    background: #333;
  }
  .btn.secondary {
    background: #333;
    color: #e0e0e0;
  }
}

@media (max-width: 800px) {
  .dialog-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .dialog {
    border-radius: 12px 12px 0 0;
    max-height: 85vh;
  }
}
</style>
