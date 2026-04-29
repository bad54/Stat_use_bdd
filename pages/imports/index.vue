<template>
  <div class="space-y-6">
    <!-- Étape 1 : Sélection -->
    <div v-if="step === 1" class="space-y-6">
      <div class="card card-body">
        <h2 class="section-title mb-4">Configuration de l'import</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Fournisseur <span class="text-red-500">*</span></label>
            <select v-model="selectedProviderId" class="form-select">
              <option value="">-- Sélectionner un fournisseur --</option>
              <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="form-label">Type de rapport</label>
            <select v-model="reportType" class="form-select">
              <option value="DR">DR - Database Report</option>
              <option value="PR">PR - Platform Report</option>
              <option value="TR">TR - Title Report</option>
              <option value="TR_J1">TR_J1 - Journal Requests</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Zone de dépôt -->
      <div class="card">
        <div class="card-body">
          <div
            class="border-2 border-dashed rounded-xl p-10 text-center transition-colors"
            :class="dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400'"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="onDrop"
            @click="fileInput?.click()"
          >
            <input ref="fileInput" type="file" accept=".csv,.tsv,.xlsx,.xls" class="hidden" @change="onFileSelect" />
            <div class="w-12 h-12 bg-gray-100 rounded-xl mx-auto flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-700 mb-1">Glissez un fichier ici ou cliquez pour parcourir</p>
            <p class="text-xs text-gray-500">Formats acceptés : CSV, TSV, XLSX, XLS · Max 10 MB</p>
          </div>

          <div v-if="uploading" class="mt-4 flex items-center gap-3">
            <SharedLoadingSpinner size="sm" />
            <span class="text-sm text-gray-600">Analyse du fichier en cours...</span>
          </div>

          <div v-if="uploadError" class="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {{ uploadError }}
          </div>
        </div>
      </div>
    </div>

    <!-- Étape 2 : Mapping -->
    <div v-if="step === 2 && uploadResult" class="space-y-6">
      <div class="flex items-center gap-3">
        <button class="btn-secondary btn-sm" @click="step = 1">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <div>
          <span class="font-medium text-gray-800">{{ uploadResult.filename }}</span>
          <span class="ml-2 text-sm text-gray-500">{{ uploadResult.totalRows }} lignes détectées</span>
        </div>
      </div>

      <!-- Alertes de parsing -->
      <div v-if="uploadResult.parseErrors.length" class="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
        <p class="font-semibold mb-1">Avertissements de lecture :</p>
        <ul class="list-disc list-inside space-y-0.5">
          <li v-for="err in uploadResult.parseErrors.slice(0, 5)" :key="err">{{ err }}</li>
        </ul>
      </div>

      <!-- Mapping des colonnes -->
      <div class="card">
        <div class="card-header">
          <h2 class="section-title">Correspondance des colonnes</h2>
          <p class="text-sm text-gray-500 mt-1">Associez chaque colonne source à un champ standard.</p>
        </div>
        <div class="card-body space-y-3">
          <div v-for="(mapping, idx) in currentMapping" :key="idx" class="flex items-center gap-4">
            <div class="flex-1">
              <select v-model="mapping.sourceColumn" class="form-select text-sm">
                <option value="">-- Ignorer --</option>
                <option v-for="h in uploadResult.headers" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div class="flex-1 text-sm font-medium text-gray-700">
              {{ fieldLabels[mapping.targetField] ?? mapping.targetField }}
              <span v-if="isRequired(mapping.targetField)" class="text-red-500 ml-1">*</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Prévisualisation -->
      <div class="card">
        <div class="card-header">
          <h2 class="section-title">Aperçu des données (10 premières lignes)</h2>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th v-for="h in uploadResult.headers.slice(0, 8)" :key="h">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in uploadResult.preview" :key="i">
                <td v-for="h in uploadResult.headers.slice(0, 8)" :key="h" class="text-xs max-w-[140px] truncate">
                  {{ row[h] ?? '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button class="btn-secondary" @click="step = 1">Annuler</button>
        <button class="btn-primary" :disabled="processing" @click="processImport">
          {{ processing ? 'Import en cours...' : `Importer ${uploadResult.totalRows} lignes` }}
        </button>
      </div>
    </div>

    <!-- Étape 3 : Résultat -->
    <div v-if="step === 3 && importResult" class="card card-body space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center"
          :class="importResult.rowsImported > 0 ? 'bg-green-100' : 'bg-red-100'">
          <svg v-if="importResult.rowsImported > 0" class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">Import {{ importResult.rowsImported > 0 ? 'terminé' : 'échoué' }}</h3>
          <p class="text-sm text-gray-500">
            {{ formatNumber(importResult.rowsImported) }} lignes importées sur {{ formatNumber(importResult.rowsTotal) }}
            <span v-if="importResult.rowsSkipped" class="text-yellow-700">
              · {{ formatNumber(importResult.rowsSkipped) }} ignorée(s)
            </span>
          </p>
        </div>
      </div>

      <div v-if="importResult.errors.length" class="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg space-y-1">
        <p class="font-semibold">Lignes ignorées :</p>
        <p v-for="e in importResult.errors" :key="e" class="text-xs">{{ e }}</p>
      </div>

      <div class="flex gap-3 pt-2">
        <NuxtLink to="/history" class="btn-secondary">Voir l'historique</NuxtLink>
        <NuxtLink to="/dashboard" class="btn-primary">Voir le dashboard</NuxtLink>
        <button class="btn-secondary" @click="resetImport">Nouvel import</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber } from '~/utils/format'
import type { Provider, UploadResult, FieldMapping } from '~/types'

definePageMeta({ layout: 'default' })

const step = ref<1 | 2 | 3>(1)
const selectedProviderId = ref('')
const reportType = ref('DR')
const dragOver = ref(false)
const uploading = ref(false)
const processing = ref(false)
const uploadError = ref<string | null>(null)
const uploadResult = ref<UploadResult | null>(null)
const importResult = ref<any>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const currentFile = ref<File | null>(null)

const fieldLabels: Record<string, string> = {
  platform: 'Plateforme',
  databaseName: 'Base de données',
  title: 'Titre / Revue',
  metricType: 'Type de métrique',
  period: 'Période (YYYY-MM)',
  year: 'Année',
  month: 'Mois',
  reportType: 'Type de rapport',
  consultations: 'Consultations',
  searches: 'Recherches',
  downloads: 'Téléchargements',
}

const requiredFields = ['platform', 'metricType', 'period', 'consultations']

function isRequired(field: string) {
  return requiredFields.includes(field)
}

const currentMapping = ref<FieldMapping[]>(
  Object.keys(fieldLabels).map(f => ({ sourceColumn: '', targetField: f }))
)

const { data: providers } = await useFetch<Provider[]>('/api/providers', { params: { active: 'true' } })

async function uploadFile(file: File) {
  if (!selectedProviderId.value) {
    uploadError.value = 'Veuillez sélectionner un fournisseur.'
    return
  }

  uploading.value = true
  uploadError.value = null
  currentFile.value = file

  const fd = new FormData()
  fd.append('file', file)
  fd.append('providerId', selectedProviderId.value)

  try {
    const result = await $fetch<UploadResult>('/api/imports/upload', { method: 'POST', body: fd })
    uploadResult.value = result

    // Initialiser le mapping avec les suggestions
    currentMapping.value = Object.keys(fieldLabels).map(f => {
      const suggested = result.suggestedMapping.find(m => m.targetField === f)
      return { sourceColumn: suggested?.sourceColumn ?? '', targetField: f }
    })

    step.value = 2
  } catch (e: any) {
    uploadError.value = e.data?.message ?? 'Erreur lors de l\'analyse du fichier.'
  } finally {
    uploading.value = false
  }
}

function onFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadFile(file)
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file) uploadFile(file)
}

async function processImport() {
  if (!uploadResult.value || !currentFile.value) return

  processing.value = true
  const activeMapping = currentMapping.value.filter(m => m.sourceColumn)

  try {
    const fileContent = await fileToBase64(currentFile.value)
    const ext = currentFile.value.name.split('.').pop()?.toLowerCase() ?? 'csv'
    const fileType = ext === 'xlsx' || ext === 'xls' ? 'xlsx' : ext === 'tsv' ? 'tsv' : 'csv'

    const result = await $fetch('/api/imports/process', {
      method: 'POST',
      body: {
        providerId: selectedProviderId.value,
        reportType: reportType.value,
        mapping: activeMapping,
        fileContent,
        filename: currentFile.value.name,
        fileType,
      },
    })

    importResult.value = result
    step.value = 3
  } catch (e: any) {
    uploadError.value = e.data?.message ?? 'Erreur lors du traitement.'
  } finally {
    processing.value = false
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function resetImport() {
  step.value = 1
  uploadResult.value = null
  importResult.value = null
  currentFile.value = null
  uploadError.value = null
  selectedProviderId.value = ''
}
</script>
