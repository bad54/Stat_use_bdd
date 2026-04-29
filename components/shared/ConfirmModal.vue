<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-[9998] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('update:modelValue', false)" />
        <div class="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-base font-semibold text-gray-900 mb-1">{{ title }}</h3>
              <p class="text-sm text-gray-500">{{ message }}</p>
            </div>
          </div>
          <div class="mt-6 flex gap-3 justify-end">
            <button class="btn-secondary" @click="$emit('update:modelValue', false)">Annuler</button>
            <button class="btn-danger" @click="onConfirm">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()

function onConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
