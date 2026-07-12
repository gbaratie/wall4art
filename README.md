# Wall4Art

Plateforme de mise en relation entre **particuliers**, **maires** et **artistes muralistes** pour proposer des lieux à décorer, soumettre des œuvres et échanger avant validation.

## Stack

| Composant | Technologie | Déploiement |
|-----------|-------------|-------------|
| Frontend | React 18, Vite, TypeScript, Tailwind | GitHub Pages |
| Backend | Fastify, Better Auth, Prisma | Render |
| Base de données | PostgreSQL + PostGIS | Neon (prod) / Postgres local (dev) |
| Images | Cloudinary | — |

## Fonctionnalités MVP

- **Particuliers** : proposer un lieu (privé ou public) avec photo, description, géolocalisation
- **Maires** : valider ou rejeter les lieux publics nécessitant une approbation
- **Artistes** : explorer les lieux dans leur zone, soumettre une proposition (croquis, financement, délais)
- **Messagerie** : échanges hôte ↔ artiste (polling REST)
- **Profils** : bio, zone de recherche, liens portfolio (Instagram, Behance, site web)
- **Auth** : email/mot de passe + Google OAuth

## Prérequis

- Node.js 20+
- pnpm 9+
- PostgreSQL + PostGIS en local via Homebrew **ou** un projet [Neon](https://neon.tech) (Docker optionnel, voir ci-dessous)

## Démarrage local

### 1. Base de données (Homebrew)

```bash
brew install postgresql@18 postgis
brew services start postgresql@18
createdb wall4art
```

Dans `.env`, adapte `DATABASE_URL` à ton utilisateur macOS :

```env
DATABASE_URL=postgresql://VOTRE_USER@localhost:5432/wall4art?schema=public
```

> L'extension PostGIS est créée automatiquement par les migrations Prisma.

**Sans Postgres local ?** Utilise [Neon](https://neon.tech) : crée un projet, active PostGIS (`CREATE EXTENSION IF NOT EXISTS postgis;`), puis mets l'URL de connexion dans `DATABASE_URL`.

### 2. Variables d'environnement

```bash
cp .env.example .env
# Adapter DATABASE_URL (voir étape 1)
```

### 3. Installation

```bash
pnpm install
```

### 4. Migrations + données de démo

Le fichier `.env` est à la racine du monorepo ; Prisma s'exécute depuis `apps/api`. Charge les variables avant les commandes DB :

```bash
export $(grep -v '^#' .env | xargs)
pnpm db:migrate
pnpm db:seed
```

### 5. Lancer front + API

```bash
pnpm dev
```

- Frontend : http://localhost:5173
- API : http://localhost:3002
- Health check : http://localhost:3002/health

### Comptes de démo (après seed)

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| maire@wall4art.local | password123 | Maire |
| marie@wall4art.local | password123 | Particulier |
| pierre@wall4art.local | password123 | Particulier |
| lea@wall4art.local | password123 | Artiste |
| tom@wall4art.local | password123 | Artiste |

### Alternative : Postgres via Docker

Si tu préfères Docker, un `docker-compose.yml` est fourni à la racine :

```bash
docker compose up -d
```

Puis dans `.env` :

```env
DATABASE_URL=postgresql://wall4art:wall4art@localhost:5432/wall4art?schema=public
```

## Structure du monorepo

```
apps/
  api/     # API Fastify + Prisma
  web/     # SPA React
packages/
  shared/  # Schémas Zod et enums partagés
```

## Déploiement

### Neon (base de données)

1. Créer un projet sur [Neon](https://neon.tech)
2. Activer l'extension PostGIS : `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Copier l'URL de connexion (pooler recommandé) dans `DATABASE_URL`

### Render (API)

1. Connecter le dépôt GitHub à Render
2. Utiliser le Blueprint [`render.yaml`](render.yaml) ou créer un Web Service manuellement
3. Configurer les variables d'environnement :
   - `DATABASE_URL` — URL Neon
   - `BETTER_AUTH_SECRET` — chaîne aléatoire longue
   - `BETTER_AUTH_URL` — URL publique de l'API (ex. `https://wall4art-api.onrender.com`)
   - `CORS_ORIGIN` — URL GitHub Pages (ex. `https://votre-user.github.io`)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - `CLOUDINARY_*`

### GitHub Pages (frontend)

1. Activer GitHub Pages (source : GitHub Actions) dans les paramètres du dépôt
2. Définir la variable de repository `VITE_API_URL` = URL de l'API Render
3. Push sur `main` déclenche le workflow [`.github/workflows/deploy-web.yml`](.github/workflows/deploy-web.yml)

Le front est servi sous `/wall4art/` (nom du dépôt).

### Comptes et contenu de démo en production

Les mêmes comptes que le seed local sont disponibles sur [https://gbaratie.github.io/wall4art/](https://gbaratie.github.io/wall4art/) (mot de passe `password123` pour tous) :

| Email | Rôle | Scénario de démo |
|-------|------|------------------|
| `marie@wall4art.local` | Particulier | Lieu privé « Mur de cour intérieure », messagerie avec Léa |
| `pierre@wall4art.local` | Particulier | Lieu public en attente « Sous-passage place du marché » |
| `maire@wall4art.local` | Maire | File de validation, lieu approuvé « Mur bibliothèque municipale » |
| `lea@wall4art.local` | Artiste | Exploration, proposition « Jardin vertical peint » |
| `tom@wall4art.local` | Artiste | Profil Lyon (zone élargie) |

Pour (re)peupler la production via l'API :

```bash
pnpm seed:production:demo
# API_URL=https://wall4art-api.onrender.com par défaut
```

Le script est idempotent : il ignore les comptes et lieux déjà existants.

## Scripts utiles

```bash
pnpm dev              # Front + API en parallèle
pnpm build            # Build complet
export $(grep -v '^#' .env | xargs)  # requis avant les commandes DB ci-dessous
pnpm db:migrate       # Migrations Prisma (dev)
pnpm db:migrate:deploy # Migrations (prod)
pnpm db:seed          # Données de démo
pnpm db:studio        # Prisma Studio
pnpm lint             # ESLint
```

## Hors scope (prochaines étapes)

- Notifications email/push
- Paiement réel (Stripe)
- WebSocket temps réel
- Modération avancée
- Tests E2E

## Licence

MIT
