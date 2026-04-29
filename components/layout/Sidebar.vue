<template>
  <aside class="fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-200 flex flex-col">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
      <div class="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <div class="min-w-0">
        <div class="text-sm font-bold text-gray-900 truncate">ICN Dashboard</div>
        <div class="text-xs text-gray-500">Statistiques BDD</div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
      <SidebarItem v-for="item in navItems" :key="item.to" :item="item" />
    </nav>

    <!-- Footer -->
    <div class="px-4 py-3 border-t border-gray-200">
      <div class="text-xs text-gray-400 text-center">ICN Business School · v0.1.0</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const navItems = [
  {
    label: 'Accueil',
    to: '/',
    icon: 'home',
  },
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: 'chart-bar',
  },
  {
    label: 'Fournisseurs',
    to: '/providers',
    icon: 'building-library',
  },
  {
    label: 'Import fichiers',
    to: '/imports',
    icon: 'arrow-up-tray',
  },
  {
    label: 'Synchronisation API',
    to: '/sync',
    icon: 'arrow-path',
  },
  {
    label: 'Analyse fournisseur',
    to: '/provider-analysis',
    icon: 'magnifying-glass-chart',
  },
  {
    label: 'Historique / Logs',
    to: '/history',
    icon: 'clock',
  },
  {
    label: 'Paramètres',
    to: '/settings',
    icon: 'cog-6-tooth',
  },
]
</script>
