<template>
  <div>
    <label class="form-label">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Champ déjà configuré -->
    <div v-if="hasExisting && !isChanging" class="flex items-center gap-2">
      <div class="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
        <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <span class="font-mono text-gray-600">{{ maskedValue || '••••••••' }}</span>
        <span class="text-xs text-green-600 font-medium ml-auto">Configuré</span>
      </div>
      <button
        type="button"
        class="btn-secondary btn-sm text-xs flex-shrink-0"
        @click="isChanging = true"
      >
        Modifier
      </button>
      <button
        type="button"
        class="btn-danger btn-sm text-xs flex-shrink-0"
        @click="onClear"
      >
        Effacer
      </button>
    </div>

    <!-- Saisie d'une nouvelle valeur -->
    <div v-else class="flex items-center gap-2">
      <div class="flex-1 relative">
        <input
          :type="showValue ? 'text' : 'password'"
          :value="modelValue"
          :placeholder="placeholder"
          class="form-input pr-10 font-mono"
          autocomplete="new-password"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <button
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          @click="showValue = !showValue"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path v-if="showValue" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        </button>
      </div>
      <button
        v-if="hasExisting && isChanging"
        type="button"
        class="btn-secondary btn-sm text-xs flex-shrink-0"
        @click="cancel"
      >
        Annuler
      </button>
    </div>

    <p v-if="hint" class="mt-1 text-xs text-gray-400">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  label: string
  placeholder?: string
  hint?: string
  required?: boolean
  hasExisting?: boolean
  maskedValue?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'clear': []
}>()

const showValue = ref(false)
const isChanging = ref(false)

function cancel() {
  isChanging.value = false
  emit('update:modelValue', '')
}

function onClear() {
  emit('clear')
  emit('update:modelValue', '')
  isChanging.value = false
}
</script>
