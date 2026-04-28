import type { DashboardStats, DashboardCharts, DashboardFilters } from '~/types'

export function useDashboard() {
  const filters = reactive<DashboardFilters>({
    year: new Date().getFullYear(),
  })

  const stats = ref<DashboardStats | null>(null)
  const charts = ref<DashboardCharts | null>(null)
  const loadingStats = ref(false)
  const loadingCharts = ref(false)
  const error = ref<string | null>(null)

  async function fetchStats() {
    loadingStats.value = true
    error.value = null
    try {
      stats.value = await $fetch<DashboardStats>('/api/dashboard/stats', {
        params: cleanParams(filters),
      })
    } catch (e: any) {
      error.value = e.data?.message ?? 'Erreur lors du chargement des statistiques.'
    } finally {
      loadingStats.value = false
    }
  }

  async function fetchCharts() {
    loadingCharts.value = true
    try {
      charts.value = await $fetch<DashboardCharts>('/api/dashboard/charts', {
        params: cleanParams(filters),
      })
    } catch (e: any) {
      error.value = e.data?.message ?? 'Erreur lors du chargement des graphiques.'
    } finally {
      loadingCharts.value = false
    }
  }

  async function refresh() {
    await Promise.all([fetchStats(), fetchCharts()])
  }

  function cleanParams(f: DashboardFilters) {
    return Object.fromEntries(
      Object.entries(f).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    )
  }

  watch(filters, () => refresh(), { deep: true })

  return {
    filters,
    stats,
    charts,
    loadingStats,
    loadingCharts,
    error,
    fetchStats,
    fetchCharts,
    refresh,
  }
}
