<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="section-title">Historique des opérations</h3>
      <button class="btn-secondary btn-sm" :disabled="loading" @click="$emit('refresh')">
        <svg class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
        </svg>
        Rafraîchir
      </button>
    </div>

    <SharedLoadingSpinner v-if="loading" size="sm" />

    <SharedEmptyState
      v-else-if="!logs.length"
      title="Aucune opération"
      description="Les tests et synchronisations apparaîtront ici."
    />

    <div v-else class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Rapport</th>
            <th>Période</th>
            <th>Statut</th>
            <th class="text-right">Lignes</th>
            <th class="text-right">Durée</th>
            <th>Source</th>
            <th>Erreur</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td class="text-xs text-gray-500 whitespace-nowrap">{{ formatDate(log.createdAt) }}</td>
            <td><span class="badge badge-blue">{{ log.reportType }}</span></td>
            <td class="text-xs text-gray-500">
              {{ log.beginDate && log.endDate ? `${log.beginDate} → ${log.endDate}` : '—' }}
            </td>
            <td>
              <span class="badge" :class="log.status === 'SUCCESS' ? 'badge-green' : 'badge-red'">
                {{ log.status === 'SUCCESS' ? 'Succès' : 'Échec' }}
              </span>
            </td>
            <td class="text-right text-sm text-gray-600">{{ log.rowsFetched }}</td>
            <td class="text-right text-xs text-gray-500">{{ log.duration ? `${log.duration}ms` : '—' }}</td>
            <td>
              <span v-if="log.isMock" class="badge badge-yellow">Mock</span>
              <span v-else class="badge badge-gray">Réel</span>
            </td>
            <td class="text-xs text-red-600 max-w-[180px] truncate" :title="log.errorMessage ?? ''">
              {{ log.errorMessage ? log.errorMessage.slice(0, 60) + (log.errorMessage.length > 60 ? '…' : '') : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/format'

defineProps<{
  logs: any[]
  loading?: boolean
}>()

defineEmits<{ refresh: [] }>()
</script>
