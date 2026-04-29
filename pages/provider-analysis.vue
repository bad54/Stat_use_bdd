<template>
  <div class="space-y-6">
    <!-- Sélection fournisseur + filtres -->
    <div class="card card-body flex flex-wrap gap-4 items-end">
      <div class="flex-1 min-w-[220px]">
        <label class="form-label">Fournisseur</label>
        <select v-model="selectedProviderId" class="form-select">
          <option value="">-- Sélectionner --</option>
          <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div class="flex-1 min-w-[140px]">
        <label class="form-label">Année</label>
        <select v-model.number="selectedYear" class="form-select">
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

    <!-- Empty state -->
    <SharedEmptyState
      v-if="!selectedProviderId"
      title="Sélectionnez un fournisseur"
      description="Choisissez un fournisseur dans la liste pour voir l'analyse détaillée."
    />

    <!-- Loading -->
    <SharedLoadingSpinner v-else-if="loading" full-page label="Chargement de l'analyse..." />

    <!-- Données -->
    <div v-else-if="metrics" class="space-y-6">
      <!-- KPI -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SharedKpiCard label="Total consultations" :value="metrics.totals.consultations" color="blue" />
        <SharedKpiCard label="Total recherches" :value="metrics.totals.searches" color="green" />
        <SharedKpiCard label="Total téléchargements" :value="metrics.totals.downloads" color="purple" />
        <SharedKpiCard
          label="Évolution vs N-1"
          :value="evolution"
          unit="%"
          :subtitle="metrics.prevYearConsultations != null ? `vs ${formatNumber(metrics.prevYearConsultations)} l'an passé` : undefined"
          color="orange"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Évolution mensuelle -->
        <div class="card">
          <div class="card-header">
            <h2 class="section-title">Évolution mensuelle {{ selectedYear }}</h2>
          </div>
          <div class="card-body">
            <ChartsLineChart
              v-if="monthlyChartData.categories.length"
              :series="[{ name: 'Consultations', data: monthlyChartData.values }]"
              :categories="monthlyChartData.categories"
              height="260px"
            />
          </div>
        </div>

        <!-- Top plateformes -->
        <div class="card">
          <div class="card-header">
            <h2 class="section-title">Top plateformes</h2>
          </div>
          <div class="card-body">
            <ChartsBarChart
              v-if="metrics.topPlatforms.length"
              :series="[{ name: 'Consultations', data: metrics.topPlatforms.map(p => p.consultations) }]"
              :categories="metrics.topPlatforms.map(p => p.platform)"
              horizontal
              height="260px"
            />
            <SharedEmptyState v-else title="Aucune plateforme" description="Importez des données pour ce fournisseur." />
          </div>
        </div>
      </div>

      <!-- Derniers imports -->
      <div class="card">
        <div class="card-header">
          <h2 class="section-title">Derniers imports</h2>
        </div>
        <div v-if="metrics.recentImports.length" class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Source</th>
                <th>Statut</th>
                <th class="text-right">Lignes importées</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="imp in metrics.recentImports" :key="imp.id">
                <td class="text-xs text-gray-500">{{ formatDate(imp.createdAt) }}</td>
                <td><span class="badge badge-blue">{{ imp.reportType }}</span></td>
                <td class="text-xs text-gray-500">{{ imp.source }} · {{ imp.sourceFileName ?? '—' }}</td>
                <td><SharedStatusBadge :value="imp.status" /></td>
                <td class="text-right text-sm text-gray-600">{{ formatNumber(imp.rowsImported) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="card-body">
          <SharedEmptyState title="Aucun import" description="Pas encore d'imports pour ce fournisseur." />
        </div>
      </div>

      <!-- Tableau top plateformes -->
      <div v-if="metrics.topPlatforms.length" class="card">
        <div class="card-header">
          <h2 class="section-title">Détail par plateforme</h2>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Plateforme</th>
                <th class="text-right">Consultations</th>
                <th class="text-right">Part</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in metrics.topPlatforms" :key="p.platform">
                <td class="font-medium text-gray-800">{{ p.platform }}</td>
                <td class="text-right font-mono text-sm">{{ formatNumber(p.consultations) }}</td>
                <td class="text-right text-gray-500 text-sm">
                  {{ totalConsultations > 0 ? ((p.consultations / totalConsultations) * 100).toFixed(1) : 0 }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber, formatDate } from '~/utils/format'
import type { Provider } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const selectedProviderId = ref(String(route.query.provider ?? ''))
const selectedYear = ref(new Date().getFullYear())
const availableYears = [2024, 2023, 2022]

const { data: providers } = await useFetch<Provider[]>('/api/providers')

const loading = ref(false)
const metrics = ref<any>(null)

async function loadMetrics() {
  if (!selectedProviderId.value) return
  loading.value = true
  try {
    metrics.value = await $fetch(`/api/providers/${selectedProviderId.value}/metrics`, {
      params: { year: selectedYear.value },
    })
  } finally {
    loading.value = false
  }
}

watch([selectedProviderId, selectedYear], loadMetrics)

if (selectedProviderId.value) await loadMetrics()

const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

const monthlyChartData = computed(() => {
  if (!metrics.value) return { categories: [], values: [] }
  const byMonth = metrics.value.byMonth.filter((m: any) => m.year === selectedYear.value)
  return {
    categories: Array.from({ length: 12 }, (_, i) => monthNames[i]),
    values: Array.from({ length: 12 }, (_, i) => {
      const m = byMonth.find((b: any) => b.month === i + 1)
      return m?._sum?.consultations ?? 0
    }),
  }
})

const totalConsultations = computed(() =>
  metrics.value?.topPlatforms.reduce((s: number, p: any) => s + p.consultations, 0) ?? 0
)

const evolution = computed(() => {
  if (!metrics.value?.prevYearConsultations || metrics.value.prevYearConsultations === 0) return null
  return Math.round(
    ((metrics.value.totals.consultations - metrics.value.prevYearConsultations) / metrics.value.prevYearConsultations) * 100
  )
})
</script>
