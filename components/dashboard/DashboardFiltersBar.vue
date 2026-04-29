<template>
  <div class="card card-body flex flex-wrap gap-4 items-end">
    <div class="flex-1 min-w-[140px]">
      <label class="form-label">Année</label>
      <select v-model.number="localFilters.year" class="form-select" @change="emit('update:filters', { ...localFilters })">
        <option v-for="y in filterOptions.years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <div class="flex-1 min-w-[180px]">
      <label class="form-label">Fournisseur</label>
      <select v-model="localFilters.providerId" class="form-select" @change="emit('update:filters', { ...localFilters })">
        <option value="">Tous les fournisseurs</option>
        <option v-for="p in filterOptions.providers" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>

    <div class="flex-1 min-w-[160px]">
      <label class="form-label">Type de métrique</label>
      <select v-model="localFilters.metricType" class="form-select" @change="emit('update:filters', { ...localFilters })">
        <option value="">Toutes les métriques</option>
        <option v-for="m in filterOptions.metricTypes" :key="m" :value="m">{{ m }}</option>
      </select>
    </div>

    <div class="flex-1 min-w-[140px]">
      <label class="form-label">Type de rapport</label>
      <select v-model="localFilters.reportType" class="form-select" @change="emit('update:filters', { ...localFilters })">
        <option value="">Tous les rapports</option>
        <option v-for="r in filterOptions.reportTypes" :key="r" :value="r">{{ r }}</option>
      </select>
    </div>

    <button class="btn-secondary btn-sm self-end" @click="resetFilters">
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Réinitialiser
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DashboardFilters } from '~/types'

const props = defineProps<{
  filters: DashboardFilters
  filterOptions: {
    years: number[]
    providers: { id: string; name: string }[]
    metricTypes: string[]
    reportTypes: string[]
  }
}>()

const emit = defineEmits<{
  'update:filters': [filters: DashboardFilters]
}>()

const localFilters = reactive<DashboardFilters>({ ...props.filters })

function resetFilters() {
  Object.assign(localFilters, {
    year: new Date().getFullYear(),
    providerId: undefined,
    metricType: undefined,
    reportType: undefined,
  })
  emit('update:filters', { ...localFilters })
}
</script>
