# CLAUDE.md — stack GitHub + Netlify + Firestore (capa free)

Documento para **cualquier proyecto web** que quieras construir o alinear con un asistente (Claude, Cursor, etc.).  
Encaje CRM / `sebacrm` es solo un **ejemplo** de cómo quedó armado un caso real; no copies IDs ni secretos de otro proyecto.

Idioma de trabajo con el humano: **español**, claro, sin jerga innecesaria.

---

## Cómo usar este archivo

1. Pegalo o adjuntá este `CLAUDE.md` en el proyecto (raíz del repo).
2. Decile a la IA, por ejemplo:

> Leé `CLAUDE.md` y seguilo. Soy no técnico. Primero explicame cuentas y herramientas; después preguntame lo mínimo y dejame el stack listo (GitHub privado + Netlify + Firebase/Firestore + auth por formulario).

3. Si el proyecto **ya existe** en la sesión:

> Revisá el proyecto actual contra `CLAUDE.md`. Si falta la trilogía o se desvía (Storage pago, Google Auth, sin Netlify, etc.), alinealo y pedime confirmación solo donde haga falta.

---

# Parte A — Onboarding (persona no técnica)

La IA debe **explicar en orden** y **esperar confirmación** en cada bloque antes de crear recursos en la nube. No asumir que ya tenés cuentas.

## A1. Cuentas que necesitás (gratis para empezar)

| Cuenta | Para qué | Dónde |
|--------|----------|--------|
| **GitHub** | Código privado + historial | https://github.com/signup |
| **Netlify** | Publicar la web con cada `git push` | https://app.netlify.com/signup (podés entrar con GitHub) |
| **Google** → **Firebase** | Base de datos (Firestore) + login email/contraseña | https://console.firebase.google.com/ (mismo Google que usás día a día) |

**Importante — costos:**

- Quedate en plan **Spark (free)** de Firebase.
- Usá **Firestore** para datos **y** para archivos pequeños (adjuntos como data URL / docs livianos).
- **No** actives **Firebase Storage** ni planes Blaze “porque sí”: en proyectos nuevos Storage suele exigir facturación.
- Auth solo **email + contraseña** (formulario). **No** Google Sign-In / Apple / etc. (más setup y más cosas que romper).

## A2. Herramientas en la máquina / en el IDE

La IA debe chequear e instalar/guiar según el entorno (Claude Code, Cursor, terminal):

1. **Node.js LTS** (para `npm` y builds).
2. **Git** instalado y logueado (`git config` nombre/email; login a GitHub vía HTTPS o SSH).
3. **Firebase CLI** vía `npx -y firebase-tools@latest` (no hace falta instalar global).
4. **Netlify CLI** (`npx -y netlify-cli` o instalación global).
5. **MCP / plugin Firebase** si el IDE lo soporta (Cursor: plugin Firebase; Claude: MCP de Firebase si está disponible).
6. Login:
   - `npx -y firebase-tools@latest login`
   - `netlify login`

Si algo pide abrir el navegador, **decile al humano exactamente qué clickear** y esperá el “listo”.

### MCP / plugin (resumen para la IA)

- Preferí **MCP/plugin oficial de Firebase** para crear proyecto, app web, Auth email/password, Firestore.
- Si no hay MCP: usá **CLI** (`firebase-tools`, `netlify`, `git`).
- No inventes que “hay que pagar” para Firestore Spark; sí aclará límites free.

## A3. Flujo que la IA debe ejecutar (después de las cuentas)

Cuando el humano diga que ya tiene GitHub + Netlify + Firebase logueados:

1. **Repo GitHub privado**
   - Crear repo vacío privado (nombre acordado).
   - `git init` / remote / primer commit / `push` a `main`.
2. **Proyecto Firebase (Spark)**
   - Crear proyecto + app **Web**.
   - Auth: solo **emailPassword**.
   - Firestore **Standard** (no Enterprise).
   - Región preferida si aplica LatAm: `southamerica-east1` (preguntar si hay duda).
   - Reglas de seguridad: autenticado; roles según el producto.
   - Archivos: **en Firestore** (límite práctico ~700 KB por archivo). Documentar el límite.
3. **Sitio Netlify**
   - Crear sitio, **vincular el repo GitHub** (no solo deploy manual de carpetas).
   - `netlify.toml`: build + `publish` + redirect SPA `/* → /index.html` 200.
   - Variables `VITE_*` / `NEXT_PUBLIC_*` según el framework (Firebase config).
   - Confirmar que un `git push` dispara deploy.
4. **Auth de la app**
   - Login por formulario (email/password).
   - Sin registro público abierto a menos que el humano lo pida; preferir invite / bootstrap del primer admin.
5. **Entregar**
   - URL de Netlify, cómo entrar, usuarios demo si los hay, y qué queda pendiente (si algo).

## A4. Checklist de “listo”

- [ ] Repo **privado** en GitHub con código
- [ ] Firebase Spark: Auth email/password + Firestore Standard
- [ ] Sin dependencia de Firebase Storage de pago
- [ ] Netlify **conectado al repo** (continuous deploy)
- [ ] Login por form funciona en producción
- [ ] Dominio Netlify autorizado en Firebase Auth (Authorized domains)
- [ ] README corto con cómo correr en local

---

# Parte B — Reglas de sesión (cualquier proyecto en curso)

Aplicá estas reglas **siempre** que este archivo esté en el proyecto o el humano lo cite.

## B1. Detectar la trilogía

Al empezar (o cuando pidan “alineá el proyecto”), inspeccioná:

| Pieza | Señales |
|-------|---------|
| **GitHub** | `.git`, `origin` → github.com, historial de commits |
| **Netlify** | `netlify.toml`, sitio linkeado, deploys por push |
| **Firestore** | `firebase.json`, `firestore.rules`, SDK Firestore |

Si falta alguna, **proponé el plan corto** y ejecutá con el mínimo de preguntas.

## B2. Alinear si se desvía

Corregí / evitá:

| Mal | Bien |
|-----|------|
| Firebase Storage / Blaze “porque archivos” | Archivos chicos en **Firestore** |
| Google Auth por defecto | **Form** email + password |
| Deploy solo con `netlify deploy` sin repo | Repo linkeado + push → deploy |
| Secretos en el repo | `.env` en `.gitignore`; en Netlify, env vars |
| Firestore Enterprise / SQL Connect de pago sin pedirlo | Spark + Firestore Standard |

## B3. Git: commit y push como hábito

- Después de un bloque de trabajo **útil y estable**: `commit` con mensaje claro (por qué, no solo qué).
- **`push` a `main`** (o la rama acordada) para que Netlify deploitee.
- No force-push a `main` salvo pedido explícito.
- No commitear `.env`, claves, ni passwords en scripts.

## B4. Netlify

- Mantener `netlify.toml` coherente con el build real.
- Env de Firebase en el panel Netlify + rebuild si cambian.
- Si el sitio no está linkeado al repo: linkear (API/CLI/UI) — no dejar solo uploads manuales.

## B5. Datos y auth

- Fuente de verdad: **Firestore**.
- Archivos: metadata + contenido liviano en Firestore; avisar límite de tamaño.
- Usuarios de la app vía Auth email/password + perfil en `users/{uid}`.
- Roles simples (ej. admin / gerente / vendedor) según el producto; preguntar antes de inventar permisos complejos.

## B6. Forma de trabajar con el humano (crítico)

1. **Asumí lo menos posible.** Si falta un dato que cambia arquitectura, costos o cuentas: **preguntá**.
2. Aunque no te lo pidan: preferí una pregunta corta a un supuesto peligroso.
3. **Backlogs o features grandes:**
   - Primero sugerí: *“Armemos un plan con un modelo de alta capacidad”* (reglas claras, definiciones, criterios de aceptación, fuera de alcance).
   - Cuando el plan esté aprobado: *“Para ejecutar, bajá a un modelo más económico / rápido”*.
4. En el plan exigí:
   - Objetivo en 1–2 frases
   - Alcance / no-alcance
   - Decisiones abiertas (con opciones)
   - Criterios de aceptación chequeables
   - Riesgos (cuotas free, Auth domains, link Netlify↔GitHub)
5. Ejecución: pasos pequeños, commit/push frecuentes, no reescribir el producto entero sin plan.

## B7. Comunicación

- Español directo.
- No abrumes con 10 alternativas: 1 recomendación + 1 alternativa si importa.
- Al cerrar un setup: URL, cómo login, y el próximo paso único.

---

# Parte C — Plantilla mínima de archivos

La IA puede generar/adaptar esto (nombres según stack):

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"   # o "build", según el framework

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

```json
// firebase.json (ejemplo)
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "auth": {
    "providers": {
      "emailPassword": true,
      "anonymous": false
    }
  }
}
```

`.env.example` con placeholders `VITE_FIREBASE_*` (o el prefijo del framework), **sin valores secretos reales en git**.

---

# Parte D — Prompt corto para pegar

```
Leé CLAUDE.md de punta a punta.

Contexto: soy no técnico / quiero alinear este proyecto.
Stack obligatorio: GitHub privado + Netlify (CD por push) + Firebase Spark
(Firestore Standard + Auth email/password). Archivos en Firestore, no Storage pago.
No uses Google Auth.

1) Decime qué cuentas/CLI/MCP faltan y cómo activarlos.
2) Preguntá solo lo bloqueante.
3) Si el trabajo es grande: proponé plan (alta capacidad) con criterios de aceptación;
   después ejecutá con modelo económico.
4) Dejá repo, Firestore, Netlify y login form listos; commit + push al terminar cada bloque.
```

---

# Parte E — Ejemplo de referencia (opcional)

Un proyecto ya montado con esta filosofía: CRM con pipeline, Auth form, Firestore, Netlify linkeado a GitHub.  
Sirve de **inspiración de estructura**, no de copia ciega de project IDs, API keys ni usuarios.

Si estás en **ese** repo y te piden “igual que producción”, mirá `netlify.toml`, `firebase.json`, `firestore.rules` y el flujo de login existentes antes de reinventar.
