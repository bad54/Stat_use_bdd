# ICN Database Usage Dashboard

Tableau de bord web pour centraliser, harmoniser et analyser les statistiques de consultation des bases de données et plateformes documentaires d'ICN Business School.

Remplace le projet initialement prévu dans Power BI.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Nuxt 3 (Vue 3 + Nitro) |
| Langage | TypeScript strict |
| Base de données | PostgreSQL 16 |
| ORM | Prisma 5 |
| Graphiques | Apache ECharts (via vue-echarts) |
| Styles | Tailwind CSS |
| Tests | Vitest |
| CI | GitHub Actions |

## Prérequis

- Node.js ≥ 20
- Docker + Docker Compose
- npm ≥ 10

## Installation

```bash
# 1. Cloner le dépôt
git clone git@github.com:bad54/icn-database-usage-dashboard.git
cd icn-database-usage-dashboard

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Modifier .env si nécessaire (par défaut compatible avec Docker Compose)

# 4. Démarrer PostgreSQL
docker compose up -d

# 5. Initialiser la base de données
npx prisma migrate dev --name init
npx prisma db seed

# 6. Lancer l'application
npm run dev
# → http://localhost:3000
```

## Variables d'environnement

Copier `.env.example` vers `.env` et ajuster :

```env
DATABASE_URL=postgresql://icn_user:icn_password@localhost:5432/icn_dashboard
NODE_ENV=development
APP_URL=http://localhost:3000
```

Pour les API SUSHI (non requis pour le MVP) :
```env
ELSEVIER_API_KEY=
ELSEVIER_INST_TOKEN=
SAGE_CUSTOMER_ID=
# ...
```

**Ne jamais commiter le fichier `.env` réel.**

## Commandes

```bash
npm run dev          # Développement
npm run build        # Build production
npm run preview      # Prévisualiser le build
npm test             # Tests unitaires
npm run typecheck    # Vérification TypeScript
npm run lint         # ESLint

npx prisma studio    # Explorer la base de données
npx prisma migrate dev   # Nouvelle migration
npx prisma db seed   # Recharger les données de démo
```

## Structure du projet

```
├── components/          # Composants Vue (auto-importés)
│   ├── charts/          # Graphiques ECharts
│   ├── dashboard/       # Composants dashboard
│   ├── layout/          # Sidebar, Header
│   └── shared/          # KpiCard, EmptyState, etc.
├── composables/         # Logique Vue réutilisable
├── pages/               # Pages (routing automatique)
│   ├── dashboard.vue
│   ├── providers/
│   ├── imports/
│   ├── history.vue
│   ├── provider-analysis.vue
│   └── settings.vue
├── server/
│   ├── api/             # Routes API Nitro
│   ├── services/        # Logique métier (SUSHI, etc.)
│   └── utils/           # Prisma, parsers, mapping
├── types/               # Types TypeScript partagés
├── prisma/
│   ├── schema.prisma    # Schéma de base de données
│   └── seed.ts          # Données de démonstration
├── tests/unit/          # Tests Vitest
└── docs/SPEC.md         # Spécifications techniques
```

## Fonctionnalités MVP

### Dashboard
- KPI : consultations, recherches, téléchargements, fournisseurs actifs
- Graphiques : évolution mensuelle, top plateformes, par fournisseur, par métrique COUNTER
- Comparaison année N vs N-1
- Filtres : année, fournisseur, type de métrique, type de rapport
- Export CSV

### Fournisseurs
- CRUD complet des fournisseurs
- Fournisseurs préconfigurés : Elsevier, Sage, Statista, Cairn, EBSCO, ProQuest
- Activation/désactivation
- Types : API SUSHI, Import fichier, Manuel

### Import de fichiers
- Formats : CSV, TSV, XLSX
- Prévisualisation des données
- Mapping de colonnes (automatique + manuel)
- Historique des imports

### Analyse par fournisseur
- KPI spécifiques
- Évolution mensuelle
- Top plateformes
- Comparaison N vs N-1

### Historique / Logs
- Import de fichiers
- Logs de synchronisation API

## Import de données

1. Aller sur la page **Import fichiers**
2. Sélectionner le fournisseur
3. Choisir le type de rapport (DR, PR, TR, TR_J1)
4. Glisser le fichier ou cliquer pour parcourir
5. Vérifier/ajuster le mapping des colonnes
6. Valider l'import

Le système détecte automatiquement :
- Le délimiteur CSV (`,`, `;`, `\t`)
- Les colonnes COUNTER standard
- Les colonnes françaises et anglaises

## Connecteurs SUSHI (en préparation)

Les connecteurs API SUSHI COUNTER R5/R5.1 sont structurés mais nécessitent les clés API :

| Fournisseur | URL API | Configuration |
|-------------|---------|---------------|
| Elsevier | api.elsevier.com | `ELSEVIER_API_KEY`, `ELSEVIER_INST_TOKEN` |
| Sage | sage.counter5.atypon-insights.com | `SAGE_CUSTOMER_ID` |
| EBSCO | cloud.ebsco.com | `EBSCO_API_KEY` |
| ProQuest | sushi.proquest.com | `PROQUEST_API_KEY` |

## Authentification (future)

L'application MVP fonctionne sans authentification.
L'architecture prévoit une intégration future avec :
- Microsoft Entra ID / Azure AD
- OpenID Connect (OIDC)
- SAML
- CAS institutionnel

Les champs `createdBy` et `updatedBy` sont déjà en place dans les modèles de données.

## GitHub Actions

Le workflow CI (`.github/workflows/ci.yml`) exécute :
1. Installation des dépendances
2. Génération du client Prisma
3. Migrations base de données
4. Tests unitaires
5. Vérification TypeScript
6. Build Nuxt

## Contribution

Voir `CLAUDE.md` pour les conventions de développement et les règles avant commit.
