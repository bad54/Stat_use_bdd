<template>
  <span class="badge" :class="badgeClass">{{ label }}</span>
</template>

<script setup lang="ts">
import { statusBadge, providerTypeBadge } from '~/utils/format'

const props = defineProps<{
  value: string
  type?: 'status' | 'provider-type'
}>()

const info = computed(() => {
  if (props.type === 'provider-type') return providerTypeBadge(props.value)
  return statusBadge(props.value)
})

const badgeClass = computed(() => info.value.class)
const label = computed(() => info.value.label)
</script>
