<template>
  <div class="space-y-6">
    <!-- Filtres -->
    <DashboardDashboardFiltersBar
      v-if="filterOptions"
      :filters="filters"
      :filter-options="filterOptions"
      @update:filters="onFiltersUpdate"
    />

    <!-- KPI Row -->
    <div v-if="loadingStats" class="flex justify-center py-8">
      <SharedLoadingSpinner label="Chargement des statistiques..." />
    </div>
    <div v-else-if="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <SharedKpiCard label="Total consultations" :value="stats.totalConsultations" :evolution="stats.evolution" color="blue" />
      <SharedKpiCard label="Total recherches" :value="stats.totalSearches" color="green" />
      <SharedKpiCard label="Total téléchargements" :value="stats.totalDownloads" color="purple" />
      <SharedKpiCard label="Fournisseurs actifs" :value="stats.activeProviders" color="orange" />
    </div>

    <div v-if="stats && stats.evolution !== null" class="card card-body text-sm text-gray-600">
      <strong>Évolution {{ filters.year }} vs {{ (filters.year ?? 0) - 1 }} :</strong>
      <span :class="(stats.evolution ?? 0) >= 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'">
        {{ (stats.evolution ?? 0) > 0 ? '+' : '' }}{{ stats.evolution }}%
      </span>
      ({{ formatNumber(stats.prevYearConsultations) }} consultations l'année précédente)
    </div>

    <!-- Graphiques -->
    <div v-if="loadingCharts" class="flex justify-center py-12">
      <SharedLoadingSpinner size="lg" label="Chargement des graphiques..." />
    </div>
    <div v-else-if="charts" class="space-y-6">
      <!-- Évolution mensuelle -->
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <h2 class="section-title">Consultations mensuelles {{ filters.year }}</h2>
          <button class="btn-secondary btn-sm" @click="exportCSV">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter CSV
          </button>
        </div>
        <div class="card-body">
          <ChartsLineChart
            v-if="monthlySeriesData.length"
            :series="monthlySeriesData"
            :categories="charts.byMonth.map(m => m.label)"
            height="320px"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top plateformes -->
        <div class="card">
          <div class="card-header">
            <h2 class="section-title">Top 10 plateformes</h2>
          </div>
          <div class="card-body">
            <ChartsBarChart
              v-if="charts.topPlatforms.length"
              :series="[{ name: 'Consultations', data: charts.topPlatforms.map(p => p.consultations) }]"
              :categories="charts.topPlatforms.map(p => p.platform)"
              horizontal
              height="350px"
            />
            <SharedEmptyState v-else title="Aucune donnée" description="Importez des données pour voir les plateformes." />
          </div>
        </div>

        <!-- Par fournisseur -->
        <div class="card">
          <div class="card-header">
            <h2 class="section-title">Consultations par fournisseur</h2>
          </div>
          <div class="card-body">
            <ChartsPieChart
              v-if="charts.byProvider.length"
              :data="charts.byProvider.map(p => ({ name: p.providerName, value: p.consultations }))"
              donut
              height="300px"
            />
            <SharedEmptyState v-else title="Aucune donnée" description="Importez des données pour voir la répartition." />
          </div>
        </div>

        <!-- Par métrique COUNTER -->
        <div class="card">
          <div class="card-header">
            <h2 class="section-title">Répartition par métrique COUNTER</h2>
          </div>
          <div class="card-body">
            <ChartsPieChart
              v-if="charts.byMetricType.length"
              :data="charts.byMetricType.map(m => ({ name: m.metricType, value: m.consultations }))"
              height="280px"
            />
          </div>
        </div>

        <!-- Source API vs Fichier -->
        <div class="card">
          <div class="card-header">
            <h2 class="section-title">Répartition API vs Import fichier</h2>
          </div>
          <div class="card-body">
            <ChartsPieChart
              v-if="charts.bySource.length"
              :data="charts.bySource.map(s => ({
                name: s.source === 'API' ? 'API SUSHI' : s.source === 'FILE' ? 'Import fichier' : 'Manuel',
                value: s.consultations
              }))"
              donut
              height="280px"
            />
          </div>
        </div>
      </div>

      <!-- Comparaison N vs N-1 -->
      <div class="card">
        <div class="card-header">
          <h2 class="section-title">Comparaison {{ charts.year }} vs {{ charts.prevYear }}</h2>
        </div>
        <div class="card-body">
          <ChartsBarChart
            :series="[
              { name: String(charts.year), data: charts.byMonth.map(m => m.consultations), color: '#3b82f6' },
              { name: String(charts.prevYear), data: charts.byMonth.map(m => m.prevYearConsultations), color: '#e5e7eb' },
            ]"
            :categories="charts.byMonth.map(m => m.label)"
            height="280px"
          />
        </div>
      </div>
    </div>

    <!-- Tableau des top plateformes -->
    <div v-if="charts?.topPlatforms.length" class="card">
      <div class="card-header">
        <h2 class="section-title">Détail par plateforme</h2>
      </div>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Plateforme</th>
              <th class="text-right">Consultations</th>
              <th class="text-right">Part (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in charts.topPlatforms" :key="p.platform">
              <td class="text-gray-400 text-xs">{{ i + 1 }}</td>
              <td class="font-medium text-gray-800">{{ p.platform }}</td>
              <td class="text-right font-tabular-nums">{{ formatNumber(p.consultations) }}</td>
              <td class="text-right text-gray-500">
                {{ totalConsultations > 0 ? ((p.consultations / totalConsultations) * 100).toFixed(1) : 0 }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber } from '~/utils/format'
import type { DashboardStats, DashboardCharts, DashboardFilters } from '~/types'

definePageMeta({ layout: 'default' })

const filters = reactive<DashboardFilters>({ year: new Date().getFullYear() })

const stats = ref<DashboardStats | null>(null)
const charts = ref<DashboardCharts | null>(null)
const filterOptions = ref<any>(null)
const loadingStats = ref(true)
const loadingCharts = ref(true)

function cleanParams(f: DashboardFilters) {
  return Object.fromEntries(
    Object.entries(f).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  )
}

async function loadStats() {
  loadingStats.value = true
  stats.value = await $fetch<DashboardStats>('/api/dashboard/stats', { params: cleanParams(filters) })
  loadingStats.value = false
}

async function loadCharts() {
  loadingCharts.value = true
  charts.value = await $fetch<DashboardCharts>('/api/dashboard/charts', { params: cleanParams(filters) })
  loadingCharts.value = false
}

function onFiltersUpdate(newFilters: DashboardFilters) {
  Object.assign(filters, newFilters)
  loadStats()
  loadCharts()
}

const monthlySeriesData = computed(() => {
  if (!charts.value) return []
  return [
    {
      name: 'Consultations',
      data: charts.value.byMonth.map(m => m.consultations),
      color: '#3b82f6',
    },
    {
      name: 'Recherches',
      data: charts.value.byMonth.map(m => m.searches),
      color: '#10b981',
    },
  ]
})

const totalConsultations = computed(() =>
  charts.value?.topPlatforms.reduce((s, p) => s + p.consultations, 0) ?? 0
)

function exportCSV() {
  const params = new URLSearchParams(cleanParams(filters) as any).toString()
  window.location.href = `/api/exports/csv${params ? '?' + params : ''}`
}

// Initial load
await Promise.all([
  loadStats(),
  loadCharts(),
  $fetch('/api/dashboard/filters').then(d => { filterOptions.value = d }),
])
</script>
