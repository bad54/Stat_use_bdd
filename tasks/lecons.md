# Leçons apprises — ICN Database Usage Dashboard

## Règle générale

Après chaque erreur ou correction importante, documenter ici :
- Cause racine
- Correction appliquée
- Règle pour éviter la régression

---

## Décisions d'architecture

### 2025-04-28 — Choix de la stack UI

**Contexte :** Besoin d'une UI professionnelle sans sur-ingénierie.

**Décision :** Tailwind CSS (`@nuxtjs/tailwindcss`) avec composants Vue personnalisés.
Pas de librairie de composants lourde (Vuetify, PrimeVue) pour rester léger.

**Raison :** Tailwind est bien intégré à Nuxt 3, large communauté, pas de conflit de versions.

---

### 2025-04-28 — Graphiques ECharts via import direct

**Contexte :** `vue-echarts` peut avoir des problèmes de SSR avec Nuxt 3.

**Décision :** Utiliser `echarts` directement dans les composants `.vue` avec `onMounted`
pour éviter les erreurs de rendu côté serveur.

**Règle :** Toujours vérifier `if (!chartEl.value) return` avant d'initialiser ECharts.

---

### 2025-04-28 — Singleton Prisma en développement

**Contexte :** Le hot-reload Nuxt en développement crée de multiples instances Prisma.

**Décision :** Utiliser `globalThis` pour stocker l'instance Prisma et la réutiliser.

**Fichier :** `server/utils/prisma.ts`

**Règle :** Ne jamais instancier `new PrismaClient()` en dehors de `server/utils/prisma.ts`.

---

### 2025-04-28 — Import fichiers : fichier sur serveur vs base64

**Contexte :** Le traitement XLSX et CSV côté serveur nécessite le contenu brut du fichier.

**Décision :** Pour l'étape de prévisualisation (upload), utiliser `readMultipartFormData` de H3.
Pour l'étape de traitement (process), envoyer le fichier en base64 dans le body JSON.

**Avantage :** Évite de stocker temporairement les fichiers sur le serveur.

---

## Pièges à éviter

1. **`xlsx` version** : Utiliser 0.18.5 (dernière version gratuite). v0.19+ est commercial.

2. **Délimiteur CSV** : Toujours détecter automatiquement (`,`, `;`, `\t`) avant de parser.

3. **Période COUNTER** : Format `YYYY-MM`. Ne pas confondre avec `MM/YYYY` ou `YYYY/MM`.

4. **Erreurs SUSHI** : L'API peut retourner HTTP 200 avec des erreurs dans `Exceptions[]`.
   Toujours vérifier `Severity === 'Fatal'` dans la réponse JSON.

5. **Variables d'environnement** : `DATABASE_URL` doit être définie avant `prisma generate`.
   Le `.env` est chargé automatiquement par Nuxt et Prisma.

---

## À investiguer (dette technique)

- [ ] Ajouter des tests d'intégration avec vraie base de données
- [ ] Implémenter les vrais appels SUSHI quand les clés API sont disponibles
- [ ] Ajouter la pagination infinie ou virtuelle pour les grands tableaux
- [ ] Implémenter l'export Excel (xlsx) et PDF
- [ ] Ajouter la gestion des fichiers de correspondance (mapping) par fournisseur persistant
