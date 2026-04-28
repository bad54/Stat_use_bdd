# CLAUDE.md — ICN Database Usage Dashboard

## Commandes de développement

```bash
# Lancement
docker compose up -d               # PostgreSQL
npm run dev                        # Dev server (http://localhost:3000)

# Base de données
npx prisma generate                # Générer le client Prisma
npx prisma migrate dev             # Appliquer les migrations
npx prisma db seed                 # Seeder les données de démo
npx prisma studio                  # Explorer la base

# Qualité
npm run lint                       # ESLint
npm run typecheck                  # TypeScript
npm test                           # Vitest
npm run build                      # Build production
```

## Contraintes de sécurité

- **Jamais de secrets dans le code** : clés API, tokens, mots de passe
- Utiliser `.env` (jamais commité) et `.env.example` (commité)
- Pas d'authentification dans le MVP — prévoir les hooks pour SSO futur
- Valider tous les inputs utilisateur côté serveur avec `zod`

## Architecture

- `server/api/` — Routes Nitro (handlers HTTP)
- `server/services/` — Logique métier (SUSHI, etc.)
- `server/utils/` — Prisma singleton, parsers, mapping
- `pages/` — Pages Vue 3 (routing automatique Nuxt)
- `components/` — Composants réutilisables (auto-importés)
- `composables/` — Logique Vue réutilisable
- `types/` — Types TypeScript partagés
- `prisma/` — Schema et seed

## Conventions

- TypeScript strict dans tout le code
- Zod pour valider les corps de requêtes API
- Prisma pour tous les accès DB (pas de SQL brut)
- `useNotification()` pour les messages utilisateur
- Les routes API retournent directement les données (pas d'enveloppe `{data: ...}`)

## Règles avant commit

1. `npm test` doit passer
2. Pas de secret dans les fichiers suivis par git
3. Mettre à jour `tasks/a-faire.md` si tâche complétée
4. Documenter les erreurs importantes dans `tasks/lecons.md`

## Authentification future

L'app est conçue pour accueillir un SSO institutionnel (Microsoft Entra ID / OIDC).
Les champs `createdBy` et `updatedBy` dans les modèles Prisma sont prévus pour ça.
Ne pas ajouter d'auth sans discussion préalable.
