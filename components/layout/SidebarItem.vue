<template>
  <NuxtLink
    :to="item.to"
    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
    :class="isActive
      ? 'bg-primary-50 text-primary-700'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
  >
    <SharedAppIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
    <span class="truncate">{{ item.label }}</span>
    <span v-if="isActive" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600" />
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  item: { label: string; to: string; icon: string }
}>()

const route = useRoute()
const isActive = computed(() =>
  props.item.to === '/' ? route.path === '/' : route.path.startsWith(props.item.to)
)
</script>
