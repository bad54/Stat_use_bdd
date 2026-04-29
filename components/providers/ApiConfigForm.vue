<template>
  <form class="space-y-6" @submit.prevent="$emit('submit', formData)">
    <!-- Preset rapide -->
    <div v-if="providerCode" class="flex items-center gap-2 flex-wrap">
      <span class="text-sm text-gray-500">Pré-remplir :</span>
      <button
        v-for="preset in availablePresets"
        :key="preset.label"
        type="button"
        class="badge badge-blue cursor-pointer hover:bg-blue-200"
        @click="applyPreset(preset)"
      >
        {{ preset.label }}
      </button>
    </div>

    <!-- ─── Connexion ──────────────────────────────────────────────────────── -->
    <fieldset class="space-y-4">
      <legend class="section-title">Connexion SUSHI</legend>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Type d'API</label>
          <select v-model="formData.apiType" class="form-select">
            <option value="SUSHI_R51">SUSHI R5.1</option>
            <option value="SUSHI_R5">SUSHI R5</option>
            <option value="CUSTOM">Personnalisé</option>
          </select>
        </div>
        <div>
          <label class="form-label">Version COUNTER</label>
          <select v-model="formData.counterVersion" class="form-select">
            <option value="5.1">5.1</option>
            <option value="5.0">5.0</option>
          </select>
        </div>
      </div>

      <div>
        <label class="form-label">URL de base <span class="text-red-500">*</span></label>
        <input
          v-model="formData.baseUrl"
          type="url"
          class="form-input font-mono text-sm"
          placeholder="https://api.example.com/sushi/r51"
          required
        />
      </div>

      <div>
        <label class="form-label">URL de secours</label>
        <input
          v-model="formData.fallbackUrl"
          type="url"
          class="form-input font-mono text-sm"
          placeholder="https://api2.example.com/sushi/r51"
        />
      </div>

      <div>
        <label class="form-label">Endpoint personnalisé</label>
        <input
          v-model="formData.endpoint"
          class="form-input font-mono text-sm"
          placeholder="/reports (laissez vide pour la valeur par défaut)"
        />
      </div>

      <div>
        <label class="form-label">Type de rapport</label>
        <select v-model="formData.reportType" class="form-select">
          <option value="DR">DR — Database Report</option>
          <option value="PR">PR — Platform Report</option>
          <option value="TR">TR — Title Report</option>
          <option value="IR">IR — Item Report</option>
        </select>
      </div>
    </fieldset>

    <!-- ─── Identifiants ──────────────────────────────────────────────────── -->
    <fieldset class="space-y-4">
      <legend class="section-title">Identifiants</legend>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Customer ID</label>
          <input v-model="formData.customerId" class="form-input font-mono text-sm" placeholder="customer_id" />
        </div>
        <div>
          <label class="form-label">Requestor ID</label>
          <input v-model="formData.requestorId" class="form-input font-mono text-sm" placeholder="requestor_id" />
        </div>
      </div>

      <ProvidersSecretField
        v-model="formData.apiKeyPlain"
        label="Clé API"
        placeholder="Entrez la clé API"
        hint="Sera masquée après enregistrement."
        :has-existing="config?.hasApiKey ?? false"
        :masked-value="config?.apiKeyMasked"
        @clear="formData.clearApiKey = true"
      />

      <ProvidersSecretField
        v-model="formData.tokenPlain"
        label="Token d'institution (insttoken)"
        placeholder="Entrez le token"
        :has-existing="config?.hasToken ?? false"
        :masked-value="config?.tokenMasked"
        @clear="formData.clearToken = true"
      />
    </fieldset>

    <!-- ─── En-têtes personnalisés ────────────────────────────────────────── -->
    <fieldset class="space-y-3">
      <legend class="section-title">En-têtes HTTP personnalisés</legend>
      <ProvidersKeyValueEditor
        v-model="formData.headersJson"
        key-placeholder="X-Header-Name"
        value-placeholder="valeur"
        add-label="Ajouter un en-tête"
      />
    </fieldset>

    <!-- ─── Paramètres de requête ─────────────────────────────────────────── -->
    <fieldset class="space-y-3">
      <legend class="section-title">Paramètres de requête supplémentaires</legend>
      <ProvidersKeyValueEditor
        v-model="formData.queryParamsJson"
        key-placeholder="param"
        value-placeholder="valeur"
        add-label="Ajouter un paramètre"
      />
    </fieldset>

    <!-- ─── Période par défaut ────────────────────────────────────────────── -->
    <fieldset class="space-y-4">
      <legend class="section-title">Période par défaut</legend>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Début</label>
          <input v-model="formData.defaultBeginDate" type="month" class="form-input" />
        </div>
        <div>
          <label class="form-label">Fin</label>
          <input v-model="formData.defaultEndDate" type="month" class="form-input" />
        </div>
      </div>
    </fieldset>

    <!-- ─── Options ───────────────────────────────────────────────────────── -->
    <fieldset class="space-y-3">
      <legend class="section-title">Options</legend>

      <label class="flex items-start gap-3 cursor-pointer">
        <input v-model="formData.mockMode" type="checkbox" class="mt-0.5 w-4 h-4 rounded text-yellow-500" />
        <span>
          <span class="text-sm font-medium text-gray-700">Mode mock activé</span>
          <span class="block text-xs text-gray-400">Les synchronisations utiliseront des données fictives réalistes.</span>
        </span>
      </label>

      <label class="flex items-start gap-3 cursor-pointer">
        <input v-model="formData.isActive" type="checkbox" class="mt-0.5 w-4 h-4 rounded text-primary-600" />
        <span class="text-sm font-medium text-gray-700">Configuration active</span>
      </label>
    </fieldset>

    <!-- ─── Notes ─────────────────────────────────────────────────────────── -->
    <div>
      <label class="form-label">Notes internes</label>
      <textarea v-model="formData.notes" class="form-textarea" rows="3" placeholder="Contacts, numéros de contrat, remarques..." />
    </div>

    <!-- ─── Actions ───────────────────────────────────────────────────────── -->
    <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
      <slot name="actions">
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Enregistrement...' : 'Enregistrer la configuration' }}
        </button>
      </slot>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { ProviderApiConfig } from '~/types'

interface FormData {
  apiType: string
  counterVersion: string
  baseUrl: string
  fallbackUrl: string | null
  endpoint: string | null
  reportType: string
  customerId: string | null
  requestorId: string | null
  apiKeyPlain: string
  tokenPlain: string
  clearApiKey: boolean
  clearToken: boolean
  headersJson: Record<string, string> | null
  queryParamsJson: Record<string, string> | null
  defaultBeginDate: string | null
  defaultEndDate: string | null
  mockMode: boolean
  isActive: boolean
  notes: string | null
}

const props = defineProps<{
  config?: ProviderApiConfig | null
  providerCode?: string
  saving?: boolean
}>()

defineEmits<{ submit: [data: FormData] }>()

interface Preset {
  label: string
  data: Partial<FormData>
}

const PRESETS: Record<string, Preset[]> = {
  ELSEVIER: [
    {
      label: 'Elsevier / ScienceDirect',
      data: {
        apiType: 'SUSHI_R51',
        counterVersion: '5.1',
        baseUrl: 'https://api.elsevier.com/analytics/scival/sushi',
        reportType: 'DR',
        headersJson: { 'X-ELS-APIKey': '', 'X-ELS-Insttoken': '' },
      },
    },
    {
      label: 'Scopus',
      data: {
        apiType: 'SUSHI_R51',
        counterVersion: '5.1',
        baseUrl: 'https://api.elsevier.com/analytics/scival/sushi',
        reportType: 'DR',
        headersJson: { 'X-ELS-APIKey': '', 'X-ELS-Insttoken': '' },
        queryParamsJson: { platform: 'Scopus' },
      },
    },
  ],
  SAGE: [
    {
      label: 'Sage Journals',
      data: {
        apiType: 'SUSHI_R51',
        counterVersion: '5.1',
        baseUrl: 'https://journals.sagepub.com/sushi/r51',
        fallbackUrl: 'https://sushi.sagepub.com/r51',
        reportType: 'DR',
      },
    },
  ],
  STATISTA: [
    {
      label: 'Statista',
      data: {
        apiType: 'SUSHI_R51',
        counterVersion: '5.1',
        baseUrl: 'https://www.statista.com/services/sushi/r51',
        reportType: 'DR',
      },
    },
  ],
  CAIRN: [
    {
      label: 'Cairn.info',
      data: {
        apiType: 'SUSHI_R5',
        counterVersion: '5.0',
        baseUrl: 'https://www.cairn.info/api/sushi',
        reportType: 'DR',
      },
    },
  ],
  EBSCO: [
    {
      label: 'EBSCO',
      data: {
        apiType: 'SUSHI_R51',
        counterVersion: '5.1',
        baseUrl: 'https://sushi.ebsco.com/api/r51/reports',
        reportType: 'DR',
      },
    },
  ],
  PROQUEST: [
    {
      label: 'ProQuest',
      data: {
        apiType: 'SUSHI_R51',
        counterVersion: '5.1',
        baseUrl: 'https://sandbox.proquest.com/sushi/r51',
        reportType: 'DR',
      },
    },
  ],
}

const availablePresets = computed(() => {
  if (!props.providerCode) return []
  const code = props.providerCode.toUpperCase()
  for (const [key, presets] of Object.entries(PRESETS)) {
    if (code.includes(key)) return presets
  }
  return []
})

const formData = reactive<FormData>({
  apiType: 'SUSHI_R51',
  counterVersion: '5.1',
  baseUrl: '',
  fallbackUrl: null,
  endpoint: null,
  reportType: 'DR',
  customerId: null,
  requestorId: null,
  apiKeyPlain: '',
  tokenPlain: '',
  clearApiKey: false,
  clearToken: false,
  headersJson: null,
  queryParamsJson: null,
  defaultBeginDate: null,
  defaultEndDate: null,
  mockMode: false,
  isActive: true,
  notes: null,
})

watch(() => props.config, (cfg) => {
  if (!cfg) return
  Object.assign(formData, {
    apiType: cfg.apiType,
    counterVersion: cfg.counterVersion,
    baseUrl: cfg.baseUrl,
    fallbackUrl: cfg.fallbackUrl,
    endpoint: cfg.endpoint,
    reportType: cfg.reportType,
    customerId: cfg.customerId,
    requestorId: cfg.requestorId,
    headersJson: cfg.headersJson,
    queryParamsJson: cfg.queryParamsJson,
    defaultBeginDate: cfg.defaultBeginDate,
    defaultEndDate: cfg.defaultEndDate,
    mockMode: cfg.mockMode,
    isActive: cfg.isActive,
    notes: cfg.notes,
    apiKeyPlain: '',
    tokenPlain: '',
    clearApiKey: false,
    clearToken: false,
  })
}, { immediate: true })

function applyPreset(preset: Preset) {
  Object.assign(formData, preset.data)
}
</script>
