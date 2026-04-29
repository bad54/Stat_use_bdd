<template>
  <div class="space-y-2">
    <div
      v-for="(entry, i) in entries"
      :key="i"
      class="flex items-center gap-2"
    >
      <input
        v-model="entry.key"
        class="form-input flex-1 text-sm font-mono"
        :placeholder="keyPlaceholder"
        @input="emitUpdate"
      />
      <span class="text-gray-400 text-sm flex-shrink-0">:</span>
      <input
        v-model="entry.value"
        class="form-input flex-1 text-sm font-mono"
        :placeholder="valuePlaceholder"
        :type="secretValues ? 'password' : 'text'"
        @input="emitUpdate"
      />
      <button
        type="button"
        class="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
        @click="removeEntry(i)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <button
      type="button"
      class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
      @click="addEntry"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      {{ addLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: Record<string, string> | null | undefined
  keyPlaceholder?: string
  valuePlaceholder?: string
  addLabel?: string
  secretValues?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

interface Entry { key: string; value: string }

const entries = ref<Entry[]>([])

watch(() => props.modelValue, (val) => {
  if (val && typeof val === 'object') {
    entries.value = Object.entries(val).map(([key, value]) => ({ key, value }))
  } else if (entries.value.length === 0) {
    entries.value = []
  }
}, { immediate: true })

function addEntry() {
  entries.value.push({ key: '', value: '' })
}

function removeEntry(i: number) {
  entries.value.splice(i, 1)
  emitUpdate()
}

function emitUpdate() {
  const result: Record<string, string> = {}
  for (const e of entries.value) {
    if (e.key.trim()) result[e.key.trim()] = e.value
  }
  emit('update:modelValue', result)
}
</script>
