/**
 * Semilla desatendida: usuarios demo + ICP + empresas/contactos/oportunidades.
 * Uso: npx tsx scripts/seed.mts
 */
import { initializeApp, deleteApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  limit,
  query,
  writeBatch,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDhlkYel5xKNCD8bKG0NK-hmCWhoEIubSw',
  authDomain: 'sebacrm.firebaseapp.com',
  projectId: 'sebacrm',
  storageBucket: 'sebacrm.firebasestorage.app',
  messagingSenderId: '1076552885497',
  appId: '1:1076552885497:web:6c578df7394e5f05676e28',
}

const USERS = [
  { email: 'gerente@encaje.demo', password: 'Encaje2026!', displayName: 'Gerente Demo', role: 'gerente' as const },
  { email: 'ana@encaje.demo', password: 'Encaje2026!', displayName: 'Ana Gómez', role: 'vendedor' as const },
  { email: 'diego@encaje.demo', password: 'Encaje2026!', displayName: 'Diego Paz', role: 'vendedor' as const },
  { email: 'lucia@encaje.demo', password: 'Encaje2026!', displayName: 'Lucía Reyes', role: 'vendedor' as const },
]

const ICP = {
  problema: 'Fabricamos e instalamos sistemas de refrigeración industrial para plantas de alimentos y bebidas medianas.',
  clientesEjemplo: 'Frigorífico del Sur, Envases Patagonia — ambos con más de 50 empleados y producción propia.',
  rubroObjetivo: 'Industria alimenticia / bebidas, metalmecánica, packaging',
  facturacion: 'USD 500.000 – 5.000.000 anuales',
  empleados: '40 – 100',
  volumen: 'Media–alta demanda de refrigeración continua',
  senalFuerte: 'Producción propia + expansión reciente de planta',
  updatedAt: new Date().toISOString(),
}

type Fit = 'A' | 'B' | 'C'

function calcFit(rubro: string, tamano: string): { fit: Fit; reason: string } {
  const r = rubro.toLowerCase()
  const n = Number((tamano.match(/\d+/) || [])[0] || 0)
  const rubroOk = /aliment|bebida|metal|packaging|envase|manufactura/.test(r)
  const sizeOk = n >= 28 && n <= 130
  if (rubroOk && sizeOk) return { fit: 'A', reason: 'Rubro y tamaño coinciden con el ICP.' }
  if (rubroOk || sizeOk) return { fit: 'B', reason: 'Encaje parcial con el ICP.' }
  return { fit: 'C', reason: 'Fuera del ICP objetivo.' }
}

const EMPRESAS = [
  { key: 'metalurgica', nombre: 'Metalúrgica Andina S.A.', rubro: 'Metalmecánica', tamano: '45 empleados', ubicacion: 'Rosario, Santa Fe' },
  { key: 'distribuidora', nombre: 'Distribuidora Centro', rubro: 'Distribución mayorista', tamano: '12 empleados', ubicacion: 'Córdoba' },
  { key: 'frigorifico', nombre: 'Frigorífico del Sur', rubro: 'Alimenticia', tamano: '80 empleados', ubicacion: 'Bahía Blanca' },
  { key: 'textil', nombre: 'Textil Norte', rubro: 'Textil', tamano: '30 empleados', ubicacion: 'Tucumán' },
  { key: 'envases', nombre: 'Envases Patagonia', rubro: 'Packaging', tamano: '60 empleados', ubicacion: 'Neuquén' },
  { key: 'agro', nombre: 'AgroInsumos Litoral', rubro: 'Agroindustria', tamano: '25 empleados', ubicacion: 'Santa Fe' },
  { key: 'vallejo', nombre: 'Construcciones Vallejo', rubro: 'Construcción', tamano: '38 empleados', ubicacion: 'Mendoza' },
  { key: 'ceramica', nombre: 'Cerámica Bellavista', rubro: 'Manufactura', tamano: '55 empleados', ubicacion: 'San Juan' },
  { key: 'herrajes', nombre: 'Herrajes del Plata', rubro: 'Metalmecánica', tamano: '40 empleados', ubicacion: 'La Plata' },
]

async function ensureAuthUser(email: string, password: string, displayName: string) {
  const app = initializeApp(firebaseConfig, `auth-${email}`)
  const auth = getAuth(app)
  try {
    let uid: string
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      uid = cred.user.uid
      await updateProfile(cred.user, { displayName })
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'auth/email-already-in-use') {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        uid = cred.user.uid
      } else throw e
    }
    await signOut(auth)
    await deleteApp(app)
    return uid
  } catch (err) {
    await deleteApp(app).catch(() => undefined)
    throw err
  }
}

async function main() {
  console.log('Creando cuentas Auth…')
  const userMap: Record<string, { uid: string; displayName: string; role: string; email: string }> = {}
  for (const u of USERS) {
    const uid = await ensureAuthUser(u.email, u.password, u.displayName)
    userMap[u.email] = { uid, displayName: u.displayName, role: u.role, email: u.email }
    console.log(' Auth OK', u.email, uid)
  }

  const app = initializeApp(firebaseConfig, 'seed-main')
  const auth = getAuth(app)
  const db = getFirestore(app)
  await signInWithEmailAndPassword(auth, 'gerente@encaje.demo', 'Encaje2026!')

  // Perfiles: primero el propio gerente (bootstrap), luego el resto
  for (const u of Object.values(userMap)) {
    await setDoc(doc(db, 'users', u.uid), {
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      active: true,
    })
    console.log(' Perfil OK', u.email)
  }

  const existing = await getDocs(query(collection(db, 'empresas'), limit(1)))
  if (!existing.empty) {
    console.log('Empresas ya existen — skip pipeline')
    await signOut(auth)
    await deleteApp(app)
    return
  }

  await setDoc(doc(db, 'icp', 'current'), ICP)

  const empresaIds: Record<string, string> = {}
  let batch = writeBatch(db)
  for (const e of EMPRESAS) {
    const ref = doc(collection(db, 'empresas'))
    empresaIds[e.key] = ref.id
    const fit = calcFit(e.rubro, e.tamano)
    batch.set(ref, {
      nombre: e.nombre,
      rubro: e.rubro,
      tamano: e.tamano,
      ubicacion: e.ubicacion,
      fit: fit.fit,
      fitReason: fit.reason,
      createdAt: new Date().toISOString(),
    })
  }
  await batch.commit()

  const contactos = [
    { empresaKey: 'frigorifico', nombre: 'Marcela Ibáñez', cargo: 'Jefa de Compras', email: 'marcela@frigosur.demo' },
    { empresaKey: 'textil', nombre: 'Roberto Salas', cargo: 'Gerente General', email: '' },
    { empresaKey: 'envases', nombre: 'Julián Ferreira', cargo: 'Gerente de Operaciones', email: 'julian@envases.demo' },
    { empresaKey: 'agro', nombre: 'Diego Correa', cargo: 'Encargado de Compras', email: '' },
    { empresaKey: 'vallejo', nombre: 'Laura Peña', cargo: 'Administradora', email: '' },
    { empresaKey: 'ceramica', nombre: 'Martín Ocampo', cargo: 'Director Comercial', email: '' },
    { empresaKey: 'herrajes', nombre: 'Sandra Molina', cargo: 'Jefa de Compras', email: '' },
  ]
  const contactoIds: Record<string, string> = {}
  batch = writeBatch(db)
  for (const c of contactos) {
    const ref = doc(collection(db, 'contactos'))
    contactoIds[`${c.empresaKey}:${c.nombre}`] = ref.id
    batch.set(ref, {
      empresaId: empresaIds[c.empresaKey],
      nombre: c.nombre,
      cargo: c.cargo,
      email: c.email,
      telefono: '',
    })
  }
  await batch.commit()

  const ops = [
    { empresaKey: 'metalurgica', vendedorEmail: 'ana@encaje.demo', etapa: 'fase0', completitud: 20 },
    { empresaKey: 'distribuidora', vendedorEmail: 'ana@encaje.demo', etapa: 'fase0', completitud: 15 },
    { empresaKey: 'frigorifico', vendedorEmail: 'diego@encaje.demo', etapa: 'prospeccion', completitud: 45, contacto: 'Marcela Ibáñez' },
    { empresaKey: 'textil', vendedorEmail: 'diego@encaje.demo', etapa: 'prospeccion', completitud: 40, contacto: 'Roberto Salas' },
    { empresaKey: 'envases', vendedorEmail: 'ana@encaje.demo', etapa: 'oportunidad', completitud: 65, contacto: 'Julián Ferreira' },
    { empresaKey: 'agro', vendedorEmail: 'lucia@encaje.demo', etapa: 'oportunidad', completitud: 55, contacto: 'Diego Correa' },
    { empresaKey: 'vallejo', vendedorEmail: 'diego@encaje.demo', etapa: 'cotizacion', completitud: 80, contacto: 'Laura Peña' },
    { empresaKey: 'ceramica', vendedorEmail: 'lucia@encaje.demo', etapa: 'definicion', completitud: 90, contacto: 'Martín Ocampo' },
    { empresaKey: 'herrajes', vendedorEmail: 'ana@encaje.demo', etapa: 'postventa', completitud: 60, contacto: 'Sandra Molina' },
  ]

  batch = writeBatch(db)
  for (const o of ops) {
    const v = userMap[o.vendedorEmail]!
    const ref = doc(collection(db, 'oportunidades'))
    batch.set(ref, {
      empresaId: empresaIds[o.empresaKey],
      contactoId: o.contacto ? contactoIds[`${o.empresaKey}:${o.contacto}`] : null,
      vendedorId: v.uid,
      vendedorNombre: v.displayName,
      etapa: o.etapa,
      completitud: o.completitud,
      checklist: [
        { label: 'Dato clave de la etapa', done: o.completitud >= 40, source: 'manual', verified: true },
        { label: 'Próximo paso confirmado', done: o.completitud >= 70, source: 'manual', verified: o.completitud >= 70 },
        { label: 'Riesgo / objeción revisada', done: false },
      ],
      sugerencia: 'Revisá el checklist pendiente y confirmá el próximo contacto.',
      historial: [{ fecha: 'ago', nota: 'Cargado desde semilla demo.' }],
      minuta: null,
      updatedAt: new Date().toISOString(),
    })
  }
  await batch.commit()
  await setDoc(doc(db, 'meta', 'bootstrap'), { seeded: true, seededAt: new Date().toISOString() })

  console.log('Semilla completa.')
  await signOut(auth)
  await deleteApp(app)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
