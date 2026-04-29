<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Paramètres généraux -->
      <div class="lg:col-span-2 space-y-4">
        <div class="card">
          <div class="card-header">
            <h2 class="section-title">Paramètres généraux</h2>
          </div>
          <div class="card-body space-y-4">
            <SharedLoadingSpinner v-if="loading" />
            <div v-else-if="settings.length">
              <div v-for="s in generalSettings" :key="s.key" class="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
                <div class="flex-1">
                  <label class="form-label mb-0">{{ s.label ?? s.key }}</label>
                  <p class="text-xs text-gray-400">{{ s.key }}</p>
                </div>
                <div class="w-64">
                  <input v-model="editedValues[s.key]" class="form-input text-sm" />
                </div>
              </div>
              <div class="mt-4 flex justify-end">
                <button class="btn-primary" :disabled="saving" @click="saveSettings">
                  {{ saving ? 'Enregistrement...' : 'Sauvegarder' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Informations système -->
        <div class="card">
          <div class="card-header">
            <h2 class="section-title">Informations système</h2>
          </div>
          <div class="card-body space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Version</span>
              <span class="font-medium">0.1.0 (MVP)</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Stack</span>
              <span class="font-medium">Nuxt 3 · PostgreSQL · Prisma</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Authentification</span>
              <span class="badge badge-yellow">Non configurée (MVP)</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">SUSHI COUNTER</span>
              <span class="badge badge-gray">R5.1 (connecteurs en préparation)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Documentation rapide -->
      <div class="space-y-4">
        <div class="card">
          <div class="card-header">
            <h2 class="section-title">Fournisseurs préconfigurés</h2>
          </div>
          <div class="card-body">
            <ul class="space-y-2 text-sm text-gray-600">
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-400" />
                Elsevier / Scopus
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-400" />
                Sage Journals
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-400" />
                Statista
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-400" />
                Cairn
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-400" />
                EBSCO
              </li>
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-400" />
                ProQuest
              </li>
            </ul>
            <NuxtLink to="/providers" class="btn-secondary btn-sm mt-4 w-full justify-center">
              Gérer les fournisseurs
            </NuxtLink>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="section-title">Authentification future</h2>
          </div>
          <div class="card-body text-sm text-gray-600 space-y-2">
            <p>L'application est conçue pour accueillir une authentification institutionnelle :</p>
            <ul class="list-disc list-inside text-xs text-gray-500 space-y-1">
              <li>SSO / Microsoft Entra ID</li>
              <li>OpenID Connect</li>
              <li>SAML</li>
              <li>CAS institutionnel</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppSetting } from '~/types'

definePageMeta({ layout: 'default' })

const { success, error: notifError } = useNotification()
const saving = ref(false)

const { data: settings, pending: loading, refresh } = await useFetch<AppSetting[]>('/api/settings')

const editedValues = reactive<Record<string, string>>({})

watchEffect(() => {
  if (settings.value) {
    settings.value.forEach(s => { editedValues[s.key] = s.value })
  }
})

const generalSettings = computed(() =>
  (settings.value ?? []).filter(s => s.category === 'general')
)

async function saveSettings() {
  saving.value = true
  try {
    await Promise.all(
      Object.entries(editedValues).map(([key, value]) => {
        const original = settings.value?.find(s => s.key === key)
        return $fetch('/api/settings', {
          method: 'POST',
          body: { key, value, category: original?.category ?? 'general', label: original?.label },
        })
      })
    )
    await refresh()
    success('Paramètres sauvegardés.')
  } catch {
    notifError('Erreur lors de la sauvegarde.')
  } finally {
    saving.value = false
  }
}
</script>
