# CLAUDE.md — stack GitHub + Netlify + Firestore (capa free)

Documento para **cualquier proyecto web** que quieras construir o alinear con un asistente (Claude, Cursor, etc.).

Idioma de trabajo con el humano: **español**, claro, sin jerga innecesaria.

---

## Aviso crítico — este código lo armó otra persona

Si el humano llegó con una carpeta o repo que **ya tiene** `firebase.json`, `.firebaserc`, `.env`, Netlify linkeado o un `origin` de GitHub ajeno:

1. **Eso es el trabajo de quien lo construyó** (cuentas, base de datos, sitio y deploy de *esa* persona).
2. **Tu trabajo como IA es ayudarlo a él** a quedar dueño del stack: **su** GitHub, **su** Netlify y **su** Firebase/Firestore.
3. **Prohibido** reutilizar, “seguir usando” o redeployar sobre el proyecto Firebase / sitio Netlify / remote GitHub del autor original, salvo que el humano diga explícitamente *“quiero seguir en las cuentas de X”*.
4. Tratá el código local como **plantilla / base de producto**. El resultado esperado es:
   - repo **privado nuevo** (o fork bajo **su** usuario GitHub),
   - proyecto Firebase **nuevo** (Spark) con app web + Auth form + Firestore,
   - sitio Netlify **nuevo** linkeado a **su** repo,
   - `.env` / env vars de Netlify con **su** config de Firebase,
   - `.firebaserc` y remotos apuntando a **sus** recursos.
5. Si encontrás API keys, project IDs (`sebacrm`, etc.), URLs `*.netlify.app` o usuarios demo del autor: **reemplazalos**; no los presentes como “ya está listo para producción suya”.
6. Guía paso a paso a alguien **no técnico**: explicá el porqué en una frase, qué clickear, y no avances de bloque hasta que confirme “listo”.

Objetivo de éxito: *“Cuando termine, yo entro a GitHub / Netlify / Firebase con **mi** usuario y veo **mi** repo, **mi** sitio y **mi** base.”*

---

## Cómo usar este archivo

1. Pegalo o adjuntá este `CLAUDE.md` en el proyecto (raíz del repo).
2. Decile a la IA, por ejemplo:

> Leé `CLAUDE.md` y seguilo. Este proyecto lo armó otra persona; yo necesito **mis propias** cuentas. Soy no técnico. Primero explicame GitHub, Netlify y Firebase; después ayudame a crear **mi** repo privado, **mi** base Firestore y **mi** sitio Netlify, y conectá el código a eso (sin usar los recursos del autor).

3. Si el proyecto **ya existe** en la sesión y solo hay que alinear stack:

> Revisá el proyecto contra `CLAUDE.md`. Si la trilogía apunta a cuentas ajenas o falta algo, migrá a **mis** GitHub + Netlify + Firestore. No asumas: preguntá.

---

# Parte A — Onboarding (persona no técnica)

La IA debe **explicar en orden** y **esperar confirmación** en cada bloque antes de crear recursos en la nube. No asumir que ya tenés cuentas. **Todas las cuentas deben ser del humano que está en la sesión**, no del autor del código.

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

Primero verificá con el humano: *“¿Estás logueado en GitHub / Netlify / Firebase con **tu** usuario (no el del autor)?”*  
Si el repo local apunta a un remote ajeno o Firebase a un `projectId` ajeno: **desvinculá y recreá** bajo su cuenta.

Cuando confirme que las tres cuentas son suyas:

1. **Repo GitHub privado (suyo)**
   - Crear repo vacío privado bajo **su** usuario (nombre acordado).
   - Si ya había `origin` del autor: cambiar remote a **su** repo (o empezar git limpio + push).
   - Primer commit / `push` a `main` con **su** remote.
2. **Proyecto Firebase nuevo (Spark, suyo)**
   - Crear proyecto + app **Web** en **su** consola Firebase.
   - Auth: solo **emailPassword**.
   - Firestore **Standard** (no Enterprise).
   - Región preferida LatAm: `southamerica-east1` (preguntar si hay duda).
   - Actualizar `.firebaserc`, `.env` / `.env.example` y env de Netlify con **su** config.
   - Desplegar reglas; crear su primer usuario admin (email que él elija).
   - Archivos: **en Firestore** (límite práctico ~700 KB). Documentar el límite.
3. **Sitio Netlify nuevo (suyo)**
   - Crear sitio en **su** cuenta Netlify.
   - **Vincular su repo GitHub** (no deploy suelto de carpetas; no reusar el sitio del autor).
   - `netlify.toml`: build + `publish` + redirect SPA `/* → /index.html` 200.
   - Variables `VITE_*` (o equivalentes) = **su** Firebase.
   - Autorizar el dominio `*.netlify.app` **nuevo** en Firebase Auth.
   - Confirmar que un `git push` a **su** `main` dispara deploy.
4. **Auth de la app**
   - Login por formulario (email/password).
   - Sin registro público abierto a menos que lo pida; preferir invite / bootstrap del primer admin **suyo**.
5. **Entregar (criterio de éxito)**
   - URL de **su** Netlify.
   - Cómo entrar con **su** usuario.
   - Confirmación explícita: “GitHub / Netlify / Firebase están bajo tu cuenta.”
   - Qué quedó pendiente, si hay algo.

## A3b. Si el humano se traba

La IA no abandona el bloque: ofrece la vía UI (clicks en consola) **y** la vía CLI, una a la vez.  
Ejemplos de bloqueos típicos: Firebase login en el browser, Netlify “Link repository”, GitHub auth al hacer push.  
No digas “listo” hasta que él pueda abrir **su** URL y loguearse.

## A4. Checklist de “listo” (cuentas del humano)

- [ ] Repo **privado** en **su** GitHub (remote no es del autor)
- [ ] Firebase Spark **nuevo**: Auth email/password + Firestore Standard
- [ ] Sin dependencia de Firebase Storage de pago
- [ ] Netlify **nuevo** conectado a **su** repo (continuous deploy)
- [ ] Login por form funciona en **su** URL de producción
- [ ] Dominio Netlify **suyo** en Authorized domains de Firebase
- [ ] No quedan project IDs / sitios del autor como destino activo
- [ ] README corto con cómo correr en local

---

# Parte B — Reglas de sesión (cualquier proyecto en curso)

Aplicá estas reglas **siempre** que este archivo esté en el proyecto o el humano lo cite.

## B0. ¿De quién es la infra?

Antes de deploy o de tocar Firebase/Netlify, preguntate (y si hace falta, preguntale):

- ¿`.firebaserc` / `projectId` son de **esta** persona?
- ¿`git remote -v` apunta a **su** GitHub?
- ¿Netlify está linkeado a **su** sitio?

Si la respuesta es no o “no sé”: **parar y migrar a sus cuentas** (Parte A), no seguir empujando al entorno del autor.

## B1. Detectar la trilogía

Al empezar (o cuando pidan “alineá el proyecto”), inspeccioná:

| Pieza | Señales |
|-------|---------|
| **GitHub** | `.git`, `origin` → github.com **del humano** |
| **Netlify** | `netlify.toml`, sitio linkeado a **ese** repo, CD por push |
| **Firestore** | `firebase.json`, `firestore.rules`, SDK; proyecto Firebase **suyo** |

Si falta alguna **o** apunta a cuentas ajenas, proponé plan corto de migración y ejecutá con el mínimo de preguntas.

## B2. Alinear si se desvía

Corregí / evitá:

| Mal | Bien |
|-----|------|
| Seguir usando Firebase/Netlify/GitHub del autor | Crear y usar **cuentas del humano** |
| Firebase Storage / Blaze “porque archivos” | Archivos chicos en **Firestore** |
| Google Auth por defecto | **Form** email + password |
| Deploy solo con `netlify deploy` sin repo | Repo linkeado + push → deploy |
| Secretos / `.env` del autor en el repo | `.env` propio en `.gitignore`; env en **su** Netlify |
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

Contexto: este proyecto lo armó otra persona. Soy no técnico.
Necesito que me ayudes a configurar MY propia trilogía:
GitHub privado (mío) + Netlify (mío, CD por push) + Firebase Spark (mío:
Firestore Standard + Auth email/password). Archivos en Firestore, no Storage pago.
No uses Google Auth. No reutilices el Firebase/Netlify/repo del autor.

1) Explicame qué cuentas crear y qué CLI/MCP activar; esperá a que confirme.
2) Preguntá solo lo bloqueante.
3) Creá/migrá a MI repo, MI Firestore y MI Netlify; actualizá env y remotes.
4) Si el trabajo es grande: plan con modelo de alta capacidad (criterios de
   aceptación); después ejecutá con modelo económico.
5) Commit + push a MI main al cerrar cada bloque. Al final confirmá que
   todo queda bajo MI usuario.
```

---

# Parte E — Este repo como plantilla (no como “tu producción”)

El código que acompaña este archivo puede ser un CRM u otra app **ya escrita por alguien más**.

- Usalo como **base de producto** (UI, reglas de ejemplo, estructura).
- **No** asumas que `sebacrm`, un `*.netlify.app` existente o usuarios demo son “tuyos”.
- Tu meta al seguir este doc: **clonar la forma de trabajo**, no heredar la infra.

Si el humano pide “dejarlo igual pero en mis cuentas”, el camino correcto es migración (Parte A3), no un push más al remote original.
