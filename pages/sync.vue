<template>
  <div class="space-y-6">
    <!-- Information banner -->
    <div class="card bg-blue-50 border-blue-200 card-body">
      <div class="flex items-start gap-4">
        <svg class="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 class="font-semibold text-blue-800 mb-1">Connecteurs SUSHI en préparation</h3>
          <p class="text-sm text-blue-700">
            Les connecteurs API SUSHI COUNTER R5/R5.1 sont en cours de développement.
            La structure du service est en place. Les vraies clés API sont configurées
            via les variables d'environnement.
          </p>
        </div>
      </div>
    </div>

    <!-- Liste des fournisseurs SUSHI -->
    <div class="card">
      <div class="card-header">
        <h2 class="section-title">Fournisseurs avec API SUSHI</h2>
      </div>
      <div class="card-body">
        <SharedLoadingSpinner v-if="!providers" />
        <div v-else class="space-y-3">
          <div
            v-for="p in sushiProviders"
            :key="p.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            <div>
              <div class="font-medium text-gray-800">{{ p.name }}</div>
              <div class="text-xs text-gray-500 mt-0.5">{{ p.apiUrl }}</div>
              <div class="mt-1 flex items-center gap-2">
                <SharedStatusBadge :value="p.type" type="provider-type" />
                <span class="text-xs text-gray-400">Dernière synchro : {{ formatDateShort(p.lastSyncAt) }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                class="btn-secondary btn-sm"
                @click="testConnection(p)"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tester
              </button>
              <button class="btn-primary btn-sm" disabled title="Clés API requises">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Synchroniser
              </button>
            </div>
          </div>

          <div v-if="!sushiProviders?.length">
            <SharedEmptyState title="Aucun fournisseur SUSHI" description="Ajoutez un fournisseur de type API SUSHI depuis la page Fournisseurs.">
              <NuxtLink to="/providers" class="btn-primary">Gérer les fournisseurs</NuxtLink>
            </SharedEmptyState>
          </div>
        </div>
      </div>
    </div>

    <!-- Résultats de test -->
    <div v-if="testResults.length" class="card">
      <div class="card-header">
        <h2 class="section-title">Résultats des tests</h2>
      </div>
      <div class="card-body space-y-3">
        <div
          v-for="result in testResults"
          :key="result.providerName + result.timestamp"
          class="p-3 rounded-lg border text-sm"
          :class="result.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'"
        >
          <div class="font-medium">{{ result.providerName }}</div>
          <div class="text-xs mt-0.5">{{ result.message }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ result.timestamp }}</div>
        </div>
      </div>
    </div>

    <!-- Documentation SUSHI -->
    <div class="card">
      <div class="card-header">
        <h2 class="section-title">Rapports SUSHI COUNTER R5.1 supportés</h2>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="report in sushiReports" :key="report.code" class="p-3 bg-gray-50 rounded-lg">
            <div class="font-semibold text-primary-700 text-sm">{{ report.code }}</div>
            <div class="text-xs text-gray-600 mt-0.5">{{ report.name }}</div>
          </div>
        </div>
        <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          <strong>Configuration requise :</strong> Configurez les clés API dans le fichier <code>.env</code>
          selon le modèle <code>.env.example</code>. Ne commitez jamais de vraies clés API.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDateShort } from '~/utils/format'
import type { Provider } from '~/types'

definePageMeta({ layout: 'default' })

const { data: providers } = await useFetch<Provider[]>('/api/providers')

const sushiProviders = computed(() => providers.value?.filter(p => p.type === 'API_SUSHI') ?? [])

const testResults = ref<{ providerName: string; success: boolean; message: string; timestamp: string }[]>([])

async function testConnection(provider: Provider) {
  testResults.value.unshift({
    providerName: provider.name,
    success: false,
    message: `Test de connexion vers ${provider.apiUrl ?? 'URL non configurée'} — Mode mock actif. Configurez les clés API dans .env pour les vrais tests.`,
    timestamp: new Date().toLocaleString('fr-FR'),
  })
}

const sushiReports = [
  { code: 'PR', name: 'Platform Report' },
  { code: 'DR', name: 'Database Report' },
  { code: 'TR', name: 'Title Report' },
  { code: 'TR_J1', name: 'Journal Requests' },
  { code: 'TR_B1', name: 'Book Requests' },
  { code: 'IR', name: 'Item Report' },
]
</script>
