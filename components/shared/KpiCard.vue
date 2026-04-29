<template>
  <div class="kpi-card">
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-500 truncate">{{ label }}</p>
        <div class="mt-1 flex items-baseline gap-2">
          <span class="text-3xl font-bold text-gray-900">{{ formattedValue }}</span>
          <span v-if="unit" class="text-sm text-gray-500">{{ unit }}</span>
        </div>
      </div>
      <div v-if="icon" class="ml-3 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="iconBg">
        <SharedAppIcon :name="icon" class="w-6 h-6" :class="iconColor" />
      </div>
    </div>

    <div v-if="evolution !== null && evolution !== undefined" class="mt-3 flex items-center gap-1.5">
      <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
        :class="(evolution ?? 0) >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
            :d="(evolution ?? 0) >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'" />
        </svg>
        {{ Math.abs(evolution ?? 0) }}%
      </span>
      <span class="text-xs text-gray-500">vs année précédente</span>
    </div>

    <div v-if="subtitle" class="mt-2 text-xs text-gray-400">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber } from '~/utils/format'

const props = defineProps<{
  label: string
  value: number | null | undefined
  unit?: string
  evolution?: number | null
  subtitle?: string
  icon?: string
  color?: string
}>()

const formattedValue = computed(() => formatNumber(props.value ?? 0))

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  green: { bg: 'bg-green-50', text: 'text-green-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
}

const selected = computed(() => colorMap[props.color ?? 'blue'])
const iconBg = computed(() => selected.value?.bg ?? 'bg-blue-50')
const iconColor = computed(() => selected.value?.text ?? 'text-blue-600')
</script>
