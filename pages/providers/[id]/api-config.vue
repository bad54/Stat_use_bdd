<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <NuxtLink to="/providers" class="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-1">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Fournisseurs
        </NuxtLink>
        <h1 class="text-xl font-semibold text-gray-900">
          Configuration API — {{ state.provider?.name ?? '…' }}
        </h1>
        <p class="text-sm text-gray-500 mt-0.5">Paramètres SUSHI COUNTER pour la synchronisation automatique</p>
      </div>

      <div class="flex items-center gap-2 flex-shrink-0">
        <span v-if="state.config?.mockMode" class="badge badge-yellow">Mode mock</span>
        <span v-if="state.config?.lastSyncStatus === 'SUCCESS'" class="badge badge-green">Dernière synchro OK</span>
        <span v-if="state.config?.lastSyncStatus === 'FAILED'" class="badge badge-red">Dernière synchro échouée</span>
      </div>
    </div>

    <!-- Loading initial -->
    <SharedLoadingSpinner v-if="pending" full-page label="Chargement de la configuration..." />

    <template v-else>
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Colonne formulaire -->
        <div class="xl:col-span-2">
          <div class="card">
            <ProvidersApiConfigForm
              :config="state.config"
              :provider-code="state.provider?.code"
              :saving="saving"
              @submit="saveConfig"
            />
          </div>
        </div>

        <!-- Colonne actions + état -->
        <div class="space-y-4">
          <!-- Statut -->
          <div class="card space-y-3">
            <h3 class="section-title">État de la connexion</h3>

            <div v-if="!state.exists" class="text-sm text-gray-400 italic">
              Enregistrez d'abord la configuration.
            </div>

            <template v-else>
              <div v-if="state.config?.lastTestAt" class="space-y-1">
                <div class="text-xs text-gray-400">Dernier test</div>
                <div class="flex items-center gap-2">
                  <span class="badge" :class="state.config.lastTestStatus === 'SUCCESS' ? 'badge-green' : 'badge-red'">
                    {{ state.config.lastTestStatus === 'SUCCESS' ? 'Succès' : 'Échec' }}
                  </span>
                  <span class="text-xs text-gray-500">{{ formatDate(state.config.lastTestAt) }}</span>
                </div>
                <p v-if="state.config.lastTestMessage" class="text-xs text-gray-500 truncate" :title="state.config.lastTestMessage">
                  {{ state.config.lastTestMessage }}
                </p>
              </div>

              <div v-if="state.config?.lastSyncAt" class="space-y-1">
                <div class="text-xs text-gray-400">Dernière synchronisation</div>
                <div class="flex items-center gap-2">
                  <span class="badge" :class="state.config.lastSyncStatus === 'SUCCESS' ? 'badge-green' : 'badge-red'">
                    {{ state.config.lastSyncStatus === 'SUCCESS' ? 'Succès' : 'Échec' }}
                  </span>
                  <span class="text-xs text-gray-500">{{ formatDate(state.config.lastSyncAt) }}</span>
                </div>
                <p v-if="state.config.lastSyncRows != null" class="text-xs text-gray-500">
                  {{ formatNumber(state.config.lastSyncRows) }} métriques importées
                </p>
              </div>
            </template>
          </div>

          <!-- Boutons d'action -->
          <div class="card space-y-3">
            <h3 class="section-title">Actions</h3>

            <p v-if="!state.exists" class="text-xs text-gray-400 italic">Disponible après enregistrement de la configuration.</p>

            <template v-else>
              <!-- Test connexion -->
              <button
                class="btn-secondary w-full justify-center"
                :disabled="actionLoading !== null"
                @click="runTest(false)"
              >
                <svg v-if="actionLoading === 'test'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Tester la connexion
              </button>

              <!-- Test rapport -->
              <button
                class="btn-secondary w-full justify-center"
                :disabled="actionLoading !== null"
                @click="runTest(true)"
              >
                <svg v-if="actionLoading === 'report'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Tester le rapport
              </button>

              <!-- Synchroniser -->
              <div class="pt-1 border-t border-gray-100 space-y-2">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-xs text-gray-500 block mb-1">Début</label>
                    <input v-model="syncBeginDate" type="month" class="form-input text-sm py-1.5" />
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 block mb-1">Fin</label>
                    <input v-model="syncEndDate" type="month" class="form-input text-sm py-1.5" />
                  </div>
                </div>

                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="syncUseMock" type="checkbox" class="w-4 h-4 rounded text-yellow-500" />
                  <span class="text-xs text-gray-600">Utiliser les données mock</span>
                </label>

                <button
                  class="btn-primary w-full justify-center"
                  :disabled="actionLoading !== null"
                  @click="runSync"
                >
                  <svg v-if="actionLoading === 'sync'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Synchroniser les données
                </button>
              </div>
            </template>
          </div>

          <!-- Résultat de l'action -->
          <Transition name="fade">
            <div v-if="actionResult" class="card" :class="actionResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'">
              <div class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0" :class="actionResult.success ? 'text-green-600' : 'text-red-600'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path v-if="actionResult.success" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                <div class="text-sm" :class="actionResult.success ? 'text-green-800' : 'text-red-800'">
                  <p class="font-medium">{{ actionResult.success ? 'Succès' : 'Échec' }}</p>
                  <p class="mt-0.5 text-xs">{{ actionResult.message }}</p>
                  <p v-if="actionResult.url" class="mt-1 font-mono text-xs break-all opacity-70">{{ actionResult.url }}</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Logs -->
      <div class="card">
        <ProvidersApiConfigLogs
          :logs="logs"
          :loading="logsLoading"
          @refresh="fetchLogs"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatDate, formatNumber } from '~/utils/format'
import type { ProviderApiConfig, ApiSyncLogEntry } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const providerId = route.params.id as string
const { success, error: notifError } = useNotification()

interface PageState {
  exists: boolean
  provider: { id: string; name: string; code: string; type: string } | null
  config: ProviderApiConfig | null
}

const state = reactive<PageState>({
  exists: false,
  provider: null,
  config: null,
})

const saving = ref(false)
const actionLoading = ref<'test' | 'report' | 'sync' | null>(null)
const actionResult = ref<{ success: boolean; message: string; url?: string } | null>(null)
const logs = ref<ApiSyncLogEntry[]>([])
const logsLoading = ref(false)

const currentYear = new Date().getFullYear()
const syncBeginDate = ref(`${currentYear}-01`)
const syncEndDate = ref(`${currentYear}-12`)
const syncUseMock = ref(false)

const { data: initialData, pending } = await useFetch<{ exists: boolean; provider: PageState['provider']; config?: ProviderApiConfig }>(
  `/api/providers/${providerId}/api-config`,
)

watch(initialData, (d) => {
  if (!d) return
  state.exists = d.exists
  state.provider = d.provider ?? null
  state.config = d.config ?? null

  if (d.config?.defaultBeginDate) syncBeginDate.value = d.config.defaultBeginDate
  if (d.config?.defaultEndDate) syncEndDate.value = d.config.defaultEndDate
  if (d.config?.mockMode) syncUseMock.value = true
}, { immediate: true })

async function saveConfig(formData: Record<string, unknown>) {
  saving.value = true
  actionResult.value = null
  try {
    const result = await $fetch<{ config: ProviderApiConfig }>(`/api/providers/${providerId}/api-config`, {
      method: 'POST',
      body: formData,
    })
    state.config = result.config
    state.exists = true
    success('Configuration enregistrée.')
    await fetchLogs()
  } catch (e: any) {
    notifError(e.data?.message ?? 'Erreur lors de l\'enregistrement.')
  } finally {
    saving.value = false
  }
}

async function runTest(fullReport: boolean) {
  actionLoading.value = fullReport ? 'report' : 'test'
  actionResult.value = null
  try {
    const result = await $fetch<{ success: boolean; message: string; url?: string; mock?: boolean }>(
      `/api/providers/${providerId}/api-config/test`,
      {
        method: 'POST',
        body: { fullReport },
      },
    )
    actionResult.value = { success: result.success, message: result.message, url: result.url }
    await refreshConfig()
    await fetchLogs()
  } catch (e: any) {
    actionResult.value = {
      success: false,
      message: e.data?.message ?? 'Erreur lors du test.',
    }
  } finally {
    actionLoading.value = null
  }
}

async function runSync() {
  actionLoading.value = 'sync'
  actionResult.value = null
  try {
    const result = await $fetch<{ success: boolean; message: string; rowsImported?: number; mock?: boolean }>(
      `/api/providers/${providerId}/api-config/sync`,
      {
        method: 'POST',
        body: {
          beginDate: syncBeginDate.value || undefined,
          endDate: syncEndDate.value || undefined,
          useMock: syncUseMock.value,
        },
      },
    )
    actionResult.value = { success: result.success ?? true, message: result.message }
    if (result.success) {
      success(result.message)
    }
    await refreshConfig()
    await fetchLogs()
  } catch (e: any) {
    const msg = e.data?.message ?? 'Erreur lors de la synchronisation.'
    actionResult.value = { success: false, message: msg }
    notifError(msg)
  } finally {
    actionLoading.value = null
  }
}

async function refreshConfig() {
  try {
    const d = await $fetch<{ exists: boolean; provider: PageState['provider']; config?: ProviderApiConfig }>(
      `/api/providers/${providerId}/api-config`,
    )
    state.exists = d.exists
    state.config = d.config ?? null
  } catch { /* ignore */ }
}

async function fetchLogs() {
  logsLoading.value = true
  try {
    logs.value = await $fetch<ApiSyncLogEntry[]>(`/api/providers/${providerId}/api-config/logs`)
  } catch { /* ignore */ } finally {
    logsLoading.value = false
  }
}

onMounted(fetchLogs)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
