# Encaje CRM

CRM de indagación guiada (pipeline ICP A/B/C) — SPA React + Vite + Firebase (Auth email/password + Firestore) + Netlify.

## Demo

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| gerente@encaje.demo | Encaje2026! | Gerente |
| ana@encaje.demo | Encaje2026! | Vendedor |
| diego@encaje.demo | Encaje2026! | Vendedor |
| lucia@encaje.demo | Encaje2026! | Vendedor |

## Local

```bash
npm install
cp .env.example .env   # completar VITE_FIREBASE_*
npm run dev
```

## Seed

```bash
npx tsx scripts/seed.mts
```

## Firebase

Proyecto: `sebacrm` (Spark). Auth solo email/password. Adjuntos pequeños en Firestore (Storage requiere Blaze en proyectos nuevos).

## Netlify

`netlify.toml` publica `dist` con redirect SPA. Variables: todas las `VITE_FIREBASE_*`.
