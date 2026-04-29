<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
    <div>
      <h1 class="text-base font-semibold text-gray-800">{{ pageTitle }}</h1>
      <p v-if="pageSubtitle" class="text-xs text-gray-500">{{ pageSubtitle }}</p>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-xs text-gray-400">{{ currentDate }}</span>
      <div class="w-px h-5 bg-gray-200" />
      <span class="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
        ICN Business School
      </span>
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Accueil', subtitle: 'Tableau de bord des statistiques de consultation' },
  '/dashboard': { title: 'Dashboard', subtitle: 'Vue d\'ensemble des métriques d\'utilisation' },
  '/providers': { title: 'Fournisseurs', subtitle: 'Gestion des fournisseurs de bases de données' },
  '/imports': { title: 'Import de fichiers', subtitle: 'Importer des statistiques depuis un fichier CSV, TSV ou Excel' },
  '/sync': { title: 'Synchronisation API', subtitle: 'Connexion aux API SUSHI COUNTER' },
  '/provider-analysis': { title: 'Analyse par fournisseur', subtitle: 'Statistiques détaillées par fournisseur' },
  '/history': { title: 'Historique / Logs', subtitle: 'Historique des imports et synchronisations' },
  '/settings': { title: 'Paramètres', subtitle: 'Configuration de l\'application' },
}

const pageInfo = computed(() => {
  const path = route.path
  return pageTitles[path] ?? { title: 'ICN Dashboard', subtitle: '' }
})

const pageTitle = computed(() => pageInfo.value.title)
const pageSubtitle = computed(() => pageInfo.value.subtitle)

const currentDate = computed(() =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
)
</script>
