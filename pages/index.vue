<template>
  <div class="space-y-8">
    <!-- Hero -->
    <div class="card bg-gradient-to-br from-primary-600 to-primary-800 text-white p-8 rounded-2xl border-0">
      <div class="max-w-2xl">
        <div class="inline-flex items-center gap-2 bg-white/20 text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <span class="w-1.5 h-1.5 rounded-full bg-green-400" />
          Application opérationnelle
        </div>
        <h1 class="text-3xl font-bold mb-3">Statistiques des bases de données documentaires</h1>
        <p class="text-primary-100 text-base leading-relaxed mb-6">
          Centralisez, harmonisez et analysez les statistiques de consultation des bases de données et
          plateformes documentaires utilisées par ICN Business School.
          Import CSV · TSV · Excel · API SUSHI COUNTER R5/R5.1 · Export CSV.
        </p>
        <div class="flex flex-wrap gap-3">
          <NuxtLink to="/dashboard"
            class="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-50 transition-colors text-sm">
            <SharedAppIcon name="chart-bar" class="w-4 h-4" />
            Voir le dashboard
          </NuxtLink>
          <NuxtLink to="/imports"
            class="inline-flex items-center gap-2 bg-primary-700/50 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm">
            <SharedAppIcon name="arrow-up-tray" class="w-4 h-4" />
            Importer des données
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- KPI rapides -->
    <div v-if="stats">
      <h2 class="section-title mb-4">Aperçu global</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SharedKpiCard
          label="Total consultations"
          :value="stats.totalConsultations"
          :evolution="stats.evolution"
          color="blue"
        />
        <SharedKpiCard label="Total recherches" :value="stats.totalSearches" color="green" />
        <SharedKpiCard label="Total téléchargements" :value="stats.totalDownloads" color="purple" />
        <SharedKpiCard label="Fournisseurs actifs" :value="stats.activeProviders" color="orange" />
      </div>
    </div>

    <!-- Accès rapide -->
    <div>
      <h2 class="section-title mb-4">Accès rapide</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="link in quickLinks"
          :key="link.to"
          :to="link.to"
          class="card p-5 hover:shadow-md hover:border-primary-200 transition-all group"
        >
          <div class="w-10 h-10 rounded-xl mb-3 flex items-center justify-center flex-shrink-0"
            :class="link.iconBg">
            <SharedAppIcon :name="link.icon" class="w-5 h-5" :class="link.iconColor" />
          </div>
          <div class="font-semibold text-gray-800 text-sm group-hover:text-primary-700">{{ link.label }}</div>
          <div class="text-xs text-gray-500 mt-0.5">{{ link.description }}</div>
        </NuxtLink>
      </div>
    </div>

    <!-- Dernier import -->
    <div v-if="stats?.latestImport" class="card card-body">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-medium text-gray-700">Dernier import</div>
          <div class="text-xs text-gray-500 mt-0.5">
            {{ stats.latestImport.provider }} ·
            {{ formatDate(stats.latestImport.date) }} ·
            {{ formatNumber(stats.latestImport.rowsImported) }} lignes importées
          </div>
        </div>
        <SharedStatusBadge :value="stats.latestImport.status" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate, formatNumber } from '~/utils/format'
import type { DashboardStats } from '~/types'

definePageMeta({ layout: 'default' })

const { data: stats } = await useFetch<DashboardStats>('/api/dashboard/stats')

const quickLinks = [
  { to: '/dashboard', label: 'Dashboard analytique', description: 'KPI, graphiques et comparaisons', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', icon: 'chart-bar' },
  { to: '/providers', label: 'Fournisseurs', description: 'Gérer les fournisseurs de BDD', iconBg: 'bg-orange-50', iconColor: 'text-orange-600', icon: 'building-library' },
  { to: '/imports', label: 'Import fichiers', description: 'CSV, TSV, Excel', iconBg: 'bg-green-50', iconColor: 'text-green-600', icon: 'arrow-up-tray' },
  { to: '/history', label: 'Historique', description: 'Logs et imports passés', iconBg: 'bg-purple-50', iconColor: 'text-purple-600', icon: 'clock' },
]
</script>
