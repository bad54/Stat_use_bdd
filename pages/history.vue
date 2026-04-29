<template>
  <div class="space-y-6">
    <!-- Filtres -->
    <div class="card card-body flex flex-wrap gap-4 items-end">
      <div class="flex-1 min-w-[180px]">
        <label class="form-label">Fournisseur</label>
        <select v-model="filters.providerId" class="form-select">
          <option value="">Tous les fournisseurs</option>
          <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div class="flex-1 min-w-[140px]">
        <label class="form-label">Statut</label>
        <select v-model="filters.status" class="form-select">
          <option value="">Tous les statuts</option>
          <option value="SUCCESS">Succès</option>
          <option value="PARTIAL">Partiel</option>
          <option value="FAILED">Échec</option>
          <option value="PENDING">En cours</option>
        </select>
      </div>
      <button class="btn-secondary btn-sm self-end" @click="resetFilters">Réinitialiser</button>
    </div>

    <!-- Onglets -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
        :class="activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Imports -->
    <div v-if="activeTab === 'imports'">
      <SharedLoadingSpinner v-if="loadingImports" full-page />
      <div v-else-if="importsData?.data.length" class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Fournisseur</th>
              <th>Type rapport</th>
              <th>Source</th>
              <th>Statut</th>
              <th class="text-right">Lignes</th>
              <th>Fichier</th>
              <th>Erreur</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="imp in importsData.data" :key="imp.id">
              <td class="text-xs text-gray-500 whitespace-nowrap">{{ formatDate(imp.createdAt) }}</td>
              <td class="font-medium text-gray-800">{{ imp.provider?.name }}</td>
              <td><span class="badge badge-blue">{{ imp.reportType }}</span></td>
              <td>
                <span class="badge" :class="imp.source === 'API' ? 'badge-purple' : 'badge-gray'">
                  {{ imp.source === 'API' ? 'API SUSHI' : imp.source === 'FILE' ? 'Fichier' : 'Manuel' }}
                </span>
              </td>
              <td><SharedStatusBadge :value="imp.status" /></td>
              <td class="text-right text-sm text-gray-600">
                {{ formatNumber(imp.rowsImported) }} / {{ formatNumber(imp.rowsTotal) }}
              </td>
              <td class="text-xs text-gray-500 max-w-[150px] truncate">{{ imp.sourceFileName ?? '—' }}</td>
              <td class="text-xs text-red-600 max-w-[200px] truncate" :title="imp.errorMessage ?? ''">
                {{ imp.errorMessage ? imp.errorMessage.slice(0, 80) + (imp.errorMessage.length > 80 ? '…' : '') : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <SharedEmptyState v-else title="Aucun import" description="L'historique des imports apparaîtra ici." />

      <!-- Pagination -->
      <div v-if="importsData?.pagination" class="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>{{ importsData.pagination.total }} import(s) au total</span>
        <div class="flex gap-2">
          <button class="btn-secondary btn-sm" :disabled="importsPage <= 1" @click="importsPage--">Précédent</button>
          <span class="self-center">Page {{ importsPage }} / {{ importsData.pagination.totalPages }}</span>
          <button class="btn-secondary btn-sm" :disabled="importsPage >= importsData.pagination.totalPages" @click="importsPage++">Suivant</button>
        </div>
      </div>
    </div>

    <!-- Logs API -->
    <div v-if="activeTab === 'api-logs'">
      <SharedLoadingSpinner v-if="loadingLogs" full-page />
      <div v-else-if="logsData?.data.length" class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Fournisseur</th>
              <th>Rapport</th>
              <th>Période</th>
              <th>Statut</th>
              <th class="text-right">Lignes</th>
              <th class="text-right">Durée</th>
              <th>Code HTTP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logsData.data" :key="log.id">
              <td class="text-xs text-gray-500 whitespace-nowrap">{{ formatDate(log.createdAt) }}</td>
              <td class="font-medium text-gray-800">{{ log.provider?.name }}</td>
              <td><span class="badge badge-blue">{{ log.reportType }}</span></td>
              <td class="text-xs text-gray-600">{{ log.beginDate }} → {{ log.endDate }}</td>
              <td><SharedStatusBadge :value="log.status" /></td>
              <td class="text-right text-sm text-gray-600">{{ formatNumber(log.rowsFetched) }}</td>
              <td class="text-right text-xs text-gray-500">{{ log.duration ? `${log.duration}ms` : '—' }}</td>
              <td class="text-xs" :class="log.responseCode === 200 ? 'text-green-600' : 'text-red-600'">
                {{ log.responseCode ?? '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <SharedEmptyState v-else title="Aucun log API" description="Les logs de synchronisation API apparaîtront ici." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate, formatNumber } from '~/utils/format'
import type { PaginatedResult, ReportImport, ApiSyncLog, Provider } from '~/types'

definePageMeta({ layout: 'default' })

const activeTab = ref<'imports' | 'api-logs'>('imports')
const tabs = [
  { id: 'imports', label: 'Imports de fichiers' },
  { id: 'api-logs', label: 'Logs API SUSHI' },
]

const importsPage = ref(1)
const filters = reactive({ providerId: '', status: '' })

const { data: providers } = await useFetch<Provider[]>('/api/providers')

const importsParams = computed(() => ({
  page: importsPage.value,
  limit: 20,
  ...(filters.providerId ? { providerId: filters.providerId } : {}),
  ...(filters.status ? { status: filters.status } : {}),
}))

const { data: importsData, pending: loadingImports, refresh: refreshImports } = await useFetch<PaginatedResult<ReportImport>>(
  '/api/imports',
  { params: importsParams, watch: [importsParams] }
)

const logsParams = computed(() => ({
  page: 1,
  limit: 20,
  ...(filters.providerId ? { providerId: filters.providerId } : {}),
  ...(filters.status ? { status: filters.status } : {}),
}))

const { data: logsData, pending: loadingLogs } = await useFetch<PaginatedResult<ApiSyncLog>>(
  '/api/logs',
  { params: logsParams, watch: [logsParams] }
)

function resetFilters() {
  filters.providerId = ''
  filters.status = ''
  importsPage.value = 1
}
</script>
