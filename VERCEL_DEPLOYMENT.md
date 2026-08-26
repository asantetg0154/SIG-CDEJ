# Déploiement SIG-CDEJ sur Vercel

## Pourquoi cette configuration est nécessaire

SIG-CDEJ est une application full-stack. Le build produit **deux sorties distinctes** : le client React/Vite dans `dist/public` et le serveur Express/tRPC dans `dist/index.js`. Vercel doit donc servir `dist/public` comme contenu statique et faire correspondre chaque requête `/api/*` à la fonction catch-all `api/[...path].ts`, qui délègue au point d’entrée Express `api/index.ts` tout en préservant le chemin original.

Le fichier `vercel.json` inclus dans le dépôt met en œuvre cette séparation et préserve les routes côté client avec une réécriture SPA vers `index.html`.

## Réglages du projet Vercel

| Réglage | Valeur |
|---|---|
| **Framework Preset** | Other |
| **Root Directory** | Laisser vide (racine du dépôt) |
| **Build Command** | `pnpm build` |
| **Output Directory** | Laisser vide : `vercel.json` utilise `dist/public` |
| **Install Command** | `pnpm install --frozen-lockfile` |
| **Node.js** | 22.x |

> Supprimez toute ancienne valeur Vercel qui pointe l’Output Directory vers `dist` ou `dist/index.js`. C’est cette configuration qui provoque l’affichage du code serveur comme texte dans le navigateur.

## Variables d’environnement de production

Ajoutez ces variables dans **Vercel → Project Settings → Environment Variables** pour les environnements Production et Preview. N’ajoutez jamais de valeurs réelles dans ce dépôt.

| Variable | Requise | Usage |
|---|---:|---|
| `DATABASE_URL` | Oui | Connexion MySQL/TiDB de l’application. |
| `JWT_SECRET` | Oui | Signature sécurisée des sessions. Utiliser une valeur forte et aléatoire. |
| `CRON_SECRET` | Oui pour les rappels internes | Secret long et aléatoire vérifiant les appels quotidiens de Vercel Cron vers `/api/scheduled/activity-reminders`. |
| `VITE_APP_ID` | Oui | Identifiant de l’application OAuth Manus. |
| `OAUTH_SERVER_URL` | Oui | Service OAuth utilisé par les routes de connexion. |
| `VITE_OAUTH_PORTAL_URL` | Oui | Portail OAuth utilisé côté navigateur. |
| `BUILT_IN_FORGE_API_URL` | Si stockage/fonctions intégrées | API serveur pour stockage et intégrations. |
| `BUILT_IN_FORGE_API_KEY` | Si stockage/fonctions intégrées | Jeton serveur associé à Forge. |
| `VITE_FRONTEND_FORGE_API_URL` | Si fonctions Forge côté client | URL Forge exposée au client. |
| `VITE_FRONTEND_FORGE_API_KEY` | Si fonctions Forge côté client | Jeton Forge côté client. |
| `OWNER_OPEN_ID` | Recommandée | Attribution du rôle administrateur propriétaire. |
| `OWNER_NAME` | Recommandée | Nom affiché du propriétaire. |
| `VITE_ANALYTICS_ENDPOINT` | Optionnelle | Endpoint de mesures d’audience. |
| `VITE_ANALYTICS_WEBSITE_ID` | Optionnelle | Identifiant du site de mesures. |

Après le premier déploiement, ajoutez `https://sig-cdej.vercel.app/api/oauth/callback` aux URL de redirection autorisées du fournisseur OAuth. Configurez également les redirections correspondantes pour chaque domaine Preview si vous activez l’authentification sur les aperçus.

## Redéploiement

Après avoir enregistré les réglages et variables, utilisez **Redeploy** sur le dernier déploiement Vercel. La page d’accueil doit alors charger le client React. Les requêtes `/api/trpc/*`, `/api/oauth/*` et `/api/scheduled/activity-reminders` doivent être traitées par la fonction catch-all de l’API.

Le fichier `vercel.json` programme un appel quotidien à **07:00 UTC**. Le rappel reste désactivé tant qu’un administrateur ne l’active pas dans **Affectations d’activités** après le déploiement publié. Vercel transmet automatiquement `CRON_SECRET` en en-tête d’autorisation pour protéger cet appel.
