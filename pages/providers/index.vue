<template>
  <div class="space-y-6">
    <!-- Actions -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500">{{ providers.length }} fournisseur(s) configuré(s)</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nouveau fournisseur
      </button>
    </div>

    <!-- Loading -->
    <SharedLoadingSpinner v-if="loading" full-page label="Chargement..." />

    <!-- Empty -->
    <SharedEmptyState v-else-if="!providers.length" title="Aucun fournisseur" description="Ajoutez votre premier fournisseur pour commencer.">
      <button class="btn-primary" @click="openCreateModal">Ajouter un fournisseur</button>
    </SharedEmptyState>

    <!-- Tableau des fournisseurs -->
    <div v-else class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Fournisseur</th>
            <th>Type</th>
            <th>Statut</th>
            <th>Métriques</th>
            <th>Dernière synchro</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in providers" :key="p.id">
            <td>
              <div class="font-medium text-gray-900">{{ p.name }}</div>
              <div class="text-xs text-gray-400">{{ p.code }}</div>
              <div v-if="p.notes" class="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{{ p.notes }}</div>
            </td>
            <td>
              <SharedStatusBadge :value="p.type" type="provider-type" />
            </td>
            <td>
              <button
                class="badge cursor-pointer transition-colors"
                :class="p.isActive ? 'badge-green hover:bg-green-200' : 'badge-gray hover:bg-gray-200'"
                @click="toggleActive(p.id, !p.isActive)"
              >
                {{ p.isActive ? 'Actif' : 'Inactif' }}
              </button>
            </td>
            <td class="text-sm text-gray-600">
              {{ formatNumber(p._count?.usageMetrics ?? 0) }}
            </td>
            <td class="text-sm text-gray-500">
              {{ formatDateShort(p.lastSyncAt) }}
            </td>
            <td>
              <div class="flex items-center gap-2">
                <NuxtLink :to="`/provider-analysis?provider=${p.id}`"
                  class="btn-secondary btn-sm text-xs">Analyser</NuxtLink>
                <button class="btn-secondary btn-sm text-xs" @click="openEditModal(p)">Modifier</button>
                <button class="btn-danger btn-sm text-xs" @click="onDelete(p)">Supprimer</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal création/édition -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="fixed inset-0 z-[9998] flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showModal = false" />
          <div class="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-6">
              {{ editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur' }}
            </h3>
            <div class="space-y-4">
              <div>
                <label class="form-label">Nom <span class="text-red-500">*</span></label>
                <input v-model="form.name" class="form-input" placeholder="Ex: Elsevier / Scopus" />
              </div>
              <div>
                <label class="form-label">Code <span class="text-red-500">*</span></label>
                <input v-model="form.code" class="form-input uppercase" placeholder="Ex: ELSEVIER" :disabled="!!editing" />
              </div>
              <div>
                <label class="form-label">Type <span class="text-red-500">*</span></label>
                <select v-model="form.type" class="form-select">
                  <option value="API_SUSHI">API SUSHI</option>
                  <option value="FILE_IMPORT">Import fichier</option>
                  <option value="MANUAL">Manuel</option>
                </select>
              </div>
              <div v-if="form.type === 'API_SUSHI'">
                <label class="form-label">URL de l'API</label>
                <input v-model="form.apiUrl" class="form-input" placeholder="https://api.example.com/sushi/r51" />
              </div>
              <div>
                <label class="form-label">Notes</label>
                <textarea v-model="form.notes" class="form-textarea" rows="3" placeholder="Informations internes, identifiants de contact..." />
              </div>
              <div class="flex items-center gap-2">
                <input id="isActive" v-model="form.isActive" type="checkbox" class="w-4 h-4 rounded text-primary-600" />
                <label for="isActive" class="text-sm text-gray-700">Fournisseur actif</label>
              </div>
            </div>
            <div v-if="formError" class="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{{ formError }}</div>
            <div class="mt-6 flex gap-3 justify-end">
              <button class="btn-secondary" @click="showModal = false">Annuler</button>
              <button class="btn-primary" :disabled="saving" @click="saveProvider">
                {{ saving ? 'Enregistrement...' : (editing ? 'Mettre à jour' : 'Créer') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirmation suppression -->
    <SharedConfirmModal
      v-model="showDeleteModal"
      title="Supprimer le fournisseur"
      :message="`Êtes-vous sûr de vouloir supprimer « ${deletingProvider?.name} » ? Toutes les métriques associées seront également supprimées.`"
      confirm-label="Supprimer"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { formatNumber, formatDateShort } from '~/utils/format'
import type { Provider } from '~/types'

definePageMeta({ layout: 'default' })

const { providers, loading, error, fetchProviders, createProvider, updateProvider, deleteProvider, toggleActive } = useProviders()
const { success, error: notifError } = useNotification()

const showModal = ref(false)
const showDeleteModal = ref(false)
const editing = ref<Provider | null>(null)
const deletingProvider = ref<Provider | null>(null)
const saving = ref(false)
const formError = ref<string | null>(null)

const defaultForm = () => ({
  name: '',
  code: '',
  type: 'FILE_IMPORT' as Provider['type'],
  apiUrl: null as string | null,
  isActive: true,
  notes: null as string | null,
})

const form = reactive(defaultForm())

await fetchProviders()

function openCreateModal() {
  editing.value = null
  Object.assign(form, defaultForm())
  formError.value = null
  showModal.value = true
}

function openEditModal(p: Provider) {
  editing.value = p
  Object.assign(form, {
    name: p.name,
    code: p.code,
    type: p.type,
    apiUrl: p.apiUrl,
    isActive: p.isActive,
    notes: p.notes,
  })
  formError.value = null
  showModal.value = true
}

async function saveProvider() {
  if (!form.name.trim() || !form.code.trim()) {
    formError.value = 'Le nom et le code sont requis.'
    return
  }
  saving.value = true
  formError.value = null
  try {
    if (editing.value) {
      await updateProvider(editing.value.id, form)
      success('Fournisseur mis à jour.')
    } else {
      await createProvider({ ...form, code: form.code.toUpperCase() })
      success('Fournisseur créé.')
    }
    showModal.value = false
  } catch (e: any) {
    formError.value = e.data?.message ?? 'Erreur lors de l\'enregistrement.'
  } finally {
    saving.value = false
  }
}

function onDelete(p: Provider) {
  deletingProvider.value = p
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deletingProvider.value) return
  try {
    await deleteProvider(deletingProvider.value.id)
    success('Fournisseur supprimé.')
  } catch {
    notifError('Impossible de supprimer ce fournisseur.')
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
