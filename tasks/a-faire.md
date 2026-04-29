# Plan de travail — ICN Database Usage Dashboard

## Progression globale

- [x] Phase 1 : Fichiers de fondation
- [x] Phase 2 : Schéma Prisma + seed
- [x] Phase 3 : Routes API serveur
- [x] Phase 4 : Types, composables
- [x] Phase 5 : Layout + composants partagés
- [x] Phase 6 : Dashboard + graphiques
- [x] Phase 7 : Pages fonctionnelles
- [x] Phase 8 : Connecteurs SUSHI mockés
- [x] Phase 9 : Tests Vitest
- [x] Phase 10 : CI GitHub Actions + documentation
- [x] Phase 11 : Validation build (npm install, tests, build)
- [x] Phase 12 : Configuration API par fournisseur (UI complète)
- [ ] Phase 13 : Commits Git + push GitHub

---

## Tâches détaillées

### Phase 1 — Fondation ✅
- [x] package.json
- [x] nuxt.config.ts
- [x] tsconfig.json
- [x] docker-compose.yml
- [x] .env.example / .env
- [x] .gitignore
- [x] tailwind.config.ts
- [x] eslint.config.mjs
- [x] vitest.config.ts
- [x] assets/css/main.css

### Phase 2 — Base de données ✅
- [x] prisma/schema.prisma (Provider, ProviderCredential, ReportImport, UsageMetric, ImportMapping, ApiSyncLog, AppSetting)
- [x] prisma/seed.ts (6 fournisseurs, 2 ans de données, imports de démo)

### Phase 3 — API serveur ✅
- [x] server/utils/prisma.ts (singleton)
- [x] server/utils/response.ts
- [x] server/utils/parsers.ts (CSV, TSV, XLSX)
- [x] server/utils/mapping.ts (mapping colonnes + auto-détection)
- [x] server/api/providers/ (GET, POST, GET:id, PUT:id, DELETE:id, GET:id/metrics)
- [x] server/api/dashboard/ (stats, charts, filters)
- [x] server/api/imports/ (list, upload, process)
- [x] server/api/exports/csv.get.ts
- [x] server/api/logs/index.get.ts
- [x] server/api/settings/ (GET, POST)
- [x] server/api/sushi/test.post.ts
- [x] server/services/sushi.ts

### Phase 4 — Types + composables ✅
- [x] types/index.ts
- [x] composables/useProviders.ts
- [x] composables/useDashboard.ts
- [x] composables/useNotification.ts
- [x] utils/format.ts

### Phase 5 — Layout ✅
- [x] layouts/default.vue
- [x] components/layout/Sidebar.vue
- [x] components/layout/SidebarItem.vue
- [x] components/layout/Header.vue
- [x] components/shared/KpiCard.vue
- [x] components/shared/Notifications.vue
- [x] components/shared/LoadingSpinner.vue
- [x] components/shared/EmptyState.vue
- [x] components/shared/StatusBadge.vue
- [x] components/shared/ConfirmModal.vue

### Phase 6 — Dashboard ✅
- [x] components/charts/LineChart.vue
- [x] components/charts/BarChart.vue
- [x] components/charts/PieChart.vue
- [x] components/dashboard/DashboardFiltersBar.vue
- [x] pages/dashboard.vue

### Phase 7 — Pages ✅
- [x] pages/index.vue
- [x] pages/providers/index.vue
- [x] pages/imports/index.vue
- [x] pages/history.vue
- [x] pages/provider-analysis.vue
- [x] pages/settings.vue
- [x] pages/sync.vue
- [x] app.vue

### Phase 8 — SUSHI ✅
- [x] server/services/sushi.ts (SushiService générique + factories)
- [x] server/api/sushi/test.post.ts

### Phase 9 — Tests ✅
- [x] tests/unit/parsers.test.ts
- [x] tests/unit/mapping.test.ts
- [x] tests/unit/sushi.test.ts
- [x] tests/unit/format.test.ts
- [x] tests/unit/secrets.test.ts
- [x] tests/unit/counter-parser.test.ts

### Phase 10 — CI + docs ✅
- [x] .github/workflows/ci.yml
- [x] CLAUDE.md
- [x] README.md
- [x] docs/SPEC.md

---

## Validations à effectuer

### Phase 11 — Build

| Commande | Statut | Résultat |
|----------|--------|---------|
| npm install | ✅ | 1062 packages installés |
| docker compose up -d | ⚠️ | Docker non disponible en CI (PostgreSQL local utilisé) |
| npx prisma generate | ✅ | Client généré |
| npx prisma migrate dev | ✅ | Migration init appliquée |
| npx prisma db seed | ✅ | 6 fournisseurs, 624 métriques créées |
| npm test | ✅ | 60/60 tests passent (6 fichiers) |
| npm run build | ✅ | Build complet, 8.05 MB |

---

## Revue finale

À compléter après Phase 11.
