# Frontend — Core Banking SFD Lite

SPA Angular 22 du projet **Core Banking SFD Lite**. Elle consomme l'API Spring Boot via `/api` et implémente les écrans clients, caisse, crédits, approbations, comptabilité et administration.

## Démarrage

```bash
npm ci
npm start
```

L'application est servie sur <http://localhost:4200>. Le proxy de développement (`proxy.conf.json`) redirige `/api` vers `http://127.0.0.1:8080`.

## Build de production

```bash
npm run build
```

Le résultat est généré dans `dist/frontend/browser`. En Docker, il est copié dans l'image nginx (voir `Dockerfile` et `nginx.conf`).

## Organisation

- `src/app/core` : modèles, services API, authentification, interceptor JWT, guards, pipe FCFA.
- `src/app/layout` : shell et menu filtré par rôle.
- `src/app/pages` : écrans lazy-loaded.
- `src/app/shared` : modules Material et dialogues réutilisables.

## Documentation

La documentation complète (démarrage, comptes de démonstration, API, règles métier) se trouve dans le [`README.md`](../README.md) à la racine du dépôt.
