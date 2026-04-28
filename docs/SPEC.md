# Spécification technique — ICN Database Usage Dashboard

## Contexte métier

ICN Business School accède à un large panel de bases de données et plateformes documentaires.
Les statistiques de consultation (COUNTER SUSHI) étaient traitées dans Power BI.
Ce projet remplace Power BI par une application web autonome, maintenable et extensible.

## Objectifs

1. Centraliser les statistiques de toutes les plateformes dans une base PostgreSQL
2. Harmoniser les données dans un format COUNTER standard
3. Permettre l'import depuis fichiers (CSV, TSV, XLSX) et API SUSHI
4. Produire des tableaux de bord analytiques interactifs
5. Permettre l'export CSV des données filtrées
6. Préparer l'intégration SSO institutionnel

## Périmètre MVP

### Inclus
- Dashboard KPI + graphiques ECharts
- CRUD fournisseurs (6 préconfigurés)
- Import fichiers CSV / TSV / XLSX avec mapping
- Historique des imports
- Analyse par fournisseur
- Export CSV filtré
- Connecteurs SUSHI mockés (structure en place)
- Tests unitaires (parsers, mapping, SUSHI)
- CI GitHub Actions
- Documentation complète

### Exclu du MVP
- Authentification
- Appels SUSHI réels (structure prête, clés manquantes)
- Export Excel / PDF
- Notifications email
- API publique documentée

## Architecture

### Backend (Nitro / Nuxt Server)

```
server/
├── api/
│   ├── providers/        GET / POST / GET :id / PUT :id / DELETE :id
│   ├── providers/:id/    GET metrics
│   ├── imports/          GET (list) / POST (upload) / POST (process)
│   ├── dashboard/        GET stats / GET charts / GET filters
│   ├── exports/          GET csv
│   ├── logs/             GET (api sync logs)
│   ├── settings/         GET / POST
│   └── sushi/            POST test
├── services/
│   └── sushi.ts          SushiService + factories fournisseurs
└── utils/
    ├── prisma.ts          Singleton Prisma
    ├── parsers.ts         CSV / TSV / XLSX
    └── mapping.ts         Mapping colonnes → champs standard
```

### Frontend (Nuxt 3 / Vue 3)

```
pages/
├── index.vue             Accueil
├── dashboard.vue         Dashboard analytique
├── providers/index.vue   Liste + CRUD fournisseurs
├── imports/index.vue     Import fichiers (3 étapes)
├── history.vue           Historique imports + logs API
├── provider-analysis.vue Analyse par fournisseur
├── sync.vue              Synchronisation API SUSHI
└── settings.vue          Paramètres application

components/
├── charts/               LineChart / BarChart / PieChart (ECharts)
├── dashboard/            DashboardFiltersBar
├── layout/               Sidebar / Header / SidebarItem
└── shared/               KpiCard / StatusBadge / EmptyState / etc.
```

## Modèle de données

### Provider
- Fournisseur de bases de données
- Types : API_SUSHI, FILE_IMPORT, MANUAL
- Champs : name, code (unique), type, apiUrl, isActive, notes, lastSyncAt

### ProviderCredential
- Credentials API par fournisseur (non exposées en frontend)
- Champs : providerId, key, value, isSecret

### ReportImport
- Historique d'un import (fichier ou API)
- Champs : providerId, reportType, source, status, rowsImported, rowsTotal, errorMessage

### UsageMetric
- Donnée harmonisée (une ligne = une métrique, un mois, une plateforme)
- Champs : providerId, importId, platform, databaseName, title, reportType, metricType, year, month, period, consultations, searches, downloads, source

### ImportMapping
- Règle de correspondance colonne source → champ cible
- Par fournisseur et type de rapport

### ApiSyncLog
- Log d'un appel API SUSHI
- Champs : status, rowsFetched, requestUrl, responseCode, duration

### AppSetting
- Paramètres clé/valeur de l'application

## Flux d'import fichier

```
1. Sélection fournisseur + type rapport
2. Upload fichier → POST /api/imports/upload
   - Détection format (CSV/TSV/XLSX)
   - Parsing brut
   - Suggestion de mapping automatique
   - Retour preview (10 lignes) + headers
3. Mapping colonnes (UI)
   - Ajustement manuel si besoin
4. Traitement → POST /api/imports/process
   - Parsing complet
   - Application du mapping
   - Insertion UsageMetric en base
   - Création ReportImport (historique)
5. Résultat
   - Lignes importées / ignorées
   - Erreurs éventuelles
   - Lien vers historique
```

## Flux Dashboard

```
1. GET /api/dashboard/filters → Options de filtres
2. GET /api/dashboard/stats?year=...&providerId=...
   → KPI agrégés
3. GET /api/dashboard/charts?year=...
   → Données séries temporelles, par fournisseur, top plateformes, etc.
4. Rendu graphiques ECharts
5. Export CSV → GET /api/exports/csv avec mêmes params
```

## Flux API SUSHI (futur)

```
1. Configuration fournisseur (URL, credentials dans .env)
2. SushiService.buildUrl(reportType, {beginDate, endDate})
3. SushiService.fetchReport()
   - Appel HTTP avec timeout
   - Gestion réponse JSON / HTML / erreur
   - Parsing Report_Items[]
4. Normalisation → UsageMetric[]
5. Insertion en base
6. Log → ApiSyncLog
```

## Tests

### Unitaires (Vitest)
- `parsers.test.ts` — CSV, TSV, XLSX, détection délimiteur
- `mapping.test.ts` — applyMapping, guessMapping
- `sushi.test.ts` — SushiService (fetch mocké)
- `format.test.ts` — formatNumber, statusBadge, etc.

### Futurs
- Tests d'intégration avec vraie base PostgreSQL
- Tests E2E avec Playwright

## Critères d'acceptation MVP

- [ ] Application Nuxt démarre sans erreur
- [ ] PostgreSQL démarre avec Docker Compose
- [ ] Prisma migre correctement
- [ ] Seed remplit la base (6 fournisseurs, 2 ans de métriques)
- [ ] Dashboard affiche des données
- [ ] CRUD fournisseurs fonctionne
- [ ] Import CSV fonctionne
- [ ] Import TSV fonctionne
- [ ] Import XLSX fonctionne
- [ ] Mapping colonnes fonctionne
- [ ] Données sauvegardées en base
- [ ] Historique fonctionne
- [ ] Export CSV fonctionne
- [ ] Tests unitaires passent
- [ ] TypeScript compile
- [ ] Build Nuxt réussit
- [ ] Aucun secret commité
