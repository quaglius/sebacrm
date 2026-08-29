import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  getAuth,
  signOut,
} from 'firebase/auth'
import { db, createSecondaryApp } from '../firebase'
import { calcCompletitud, calcFit, suggestNextAction } from './heuristics'
import {
  SEED_CONTACTOS,
  SEED_EMPRESAS,
  SEED_ICP,
  SEED_OPORTUNIDADES,
  SEED_USERS,
} from './seedData'
import type { Role } from '../types'

/** Lectura pública vía meta/bootstrap — no depende de rules de users. */
export async function isAppBootstrapped(): Promise<boolean> {
  const snap = await getDoc(doc(db, 'meta', 'bootstrap'))
  if (snap.exists() && snap.data()?.seeded === true) return true
  return false
}

/** @deprecated usar isAppBootstrapped */
export async function hasAnyUsers(): Promise<boolean> {
  return isAppBootstrapped()
}

export async function hasSeedData(): Promise<boolean> {
  const snap = await getDocs(query(collection(db, 'empresas'), limit(1)))
  return !snap.empty
}

export async function createUserProfile(
  uid: string,
  data: { email: string; displayName: string; role: Role; active?: boolean },
) {
  await setDoc(doc(db, 'users', uid), {
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    active: data.active ?? true,
  })
}

/** Crea usuarios demo con app secundaria (no afecta la sesión actual). */
export async function ensureSeedUsers(): Promise<Record<string, { uid: string; displayName: string }>> {
  const map: Record<string, { uid: string; displayName: string }> = {}

  for (const u of SEED_USERS) {
    const secondary = createSecondaryApp()
    const secondaryAuth = getAuth(secondary)
    try {
      let uid: string
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, u.email, u.password)
        uid = cred.user.uid
        await updateProfile(cred.user, { displayName: u.displayName })
      } catch (err: unknown) {
        const code = (err as { code?: string }).code
        if (code === 'auth/email-already-in-use') {
          const cred = await signInWithEmailAndPassword(secondaryAuth, u.email, u.password)
          uid = cred.user.uid
        } else {
          throw err
        }
      }
      await createUserProfile(uid, {
        email: u.email,
        displayName: u.displayName,
        role: u.role,
      })
      map[u.email] = { uid, displayName: u.displayName }
    } finally {
      await signOut(secondaryAuth).catch(() => undefined)
    }
  }
  return map
}

export async function seedDemoData(userMap?: Record<string, { uid: string; displayName: string }>) {
  const users = userMap ?? (await ensureSeedUsers())
  const existing = await hasSeedData()
  if (existing) return { alreadySeeded: true as const }

  await setDoc(doc(db, 'icp', 'current'), {
    ...SEED_ICP,
    updatedAt: new Date().toISOString(),
  })

  const empresaIds: Record<string, string> = {}
  const batch1 = writeBatch(db)
  for (const e of SEED_EMPRESAS) {
    const ref = doc(collection(db, 'empresas'))
    empresaIds[e.key] = ref.id
    const fit = calcFit(e, SEED_ICP)
    batch1.set(ref, {
      nombre: e.nombre,
      rubro: e.rubro,
      tamano: e.tamano,
      ubicacion: e.ubicacion,
      fit: fit.fit,
      fitReason: fit.reason,
      createdAt: new Date().toISOString(),
    })
  }
  await batch1.commit()

  const contactoIds: Record<string, string> = {}
  const batch2 = writeBatch(db)
  for (const c of SEED_CONTACTOS) {
    const ref = doc(collection(db, 'contactos'))
    const key = `${c.empresaKey}:${c.nombre}`
    contactoIds[key] = ref.id
    batch2.set(ref, {
      empresaId: empresaIds[c.empresaKey],
      nombre: c.nombre,
      cargo: c.cargo,
      email: c.email || '',
      telefono: '',
    })
  }
  await batch2.commit()

  const batch3 = writeBatch(db)
  for (const o of SEED_OPORTUNIDADES) {
    const ref = doc(collection(db, 'oportunidades'))
    const vendedor = users[o.vendedorEmail]
    if (!vendedor) continue
    const contactoId = o.contactoNombre
      ? contactoIds[`${o.empresaKey}:${o.contactoNombre}`]
      : undefined
    const completitud = calcCompletitud(o.checklist)
    batch3.set(ref, {
      empresaId: empresaIds[o.empresaKey],
      contactoId: contactoId || null,
      vendedorId: vendedor.uid,
      vendedorNombre: vendedor.displayName,
      etapa: o.etapa,
      completitud,
      checklist: o.checklist,
      sugerencia: suggestNextAction(o.etapa, o.checklist),
      historial: o.historial,
      minuta: o.minuta || null,
      updatedAt: new Date().toISOString(),
    })
  }
  await batch3.commit()

  await setDoc(doc(db, 'meta', 'bootstrap'), {
    seededAt: new Date().toISOString(),
    seeded: true,
  })

  return { alreadySeeded: false as const, users }
}

export async function inviteUser(params: {
  email: string
  password: string
  displayName: string
  role: Role
}) {
  const secondary = createSecondaryApp()
  const secondaryAuth = getAuth(secondary)
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, params.email, params.password)
    await updateProfile(cred.user, { displayName: params.displayName })
    await createUserProfile(cred.user.uid, {
      email: params.email,
      displayName: params.displayName,
      role: params.role,
    })
    return cred.user.uid
  } finally {
    await signOut(secondaryAuth).catch(() => undefined)
  }
}
