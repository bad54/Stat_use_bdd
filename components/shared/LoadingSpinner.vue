<template>
  <div class="flex items-center justify-center" :class="wrapperClass">
    <svg
      class="animate-spin"
      :class="[sizeClass, colorClass]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    <span v-if="label" class="ml-2 text-sm text-gray-600">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  size?: 'sm' | 'md' | 'lg'
  color?: string
  label?: string
  fullPage?: boolean
}>()

const sizeClass = computed(() => ({
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
}[props.size ?? 'md']))

const colorClass = computed(() => props.color ?? 'text-primary-600')
const wrapperClass = computed(() => props.fullPage ? 'min-h-[200px]' : '')
</script>
