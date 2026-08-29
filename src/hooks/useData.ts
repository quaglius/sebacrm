import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import type { Empresa, Contacto, Oportunidad, IcpProfile, AppUser, ArchivoMeta } from '../types'

export function useEmpresas() {
  const [data, setData] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    return onSnapshot(
      collection(db, 'empresas'),
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Empresa))
        setLoading(false)
      },
      () => setLoading(false),
    )
  }, [])
  return { data, loading }
}

export function useContactos() {
  const [data, setData] = useState<Contacto[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    return onSnapshot(
      collection(db, 'contactos'),
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Contacto))
        setLoading(false)
      },
      () => setLoading(false),
    )
  }, [])
  return { data, loading }
}

export function useOportunidades() {
  const { effectiveProfile, isAdmin, impersonating } = useAuth()
  const [data, setData] = useState<Oportunidad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!effectiveProfile) {
      setData([])
      setLoading(false)
      return
    }
    const seeAll =
      effectiveProfile.role === 'gerente' ||
      effectiveProfile.role === 'admin' ||
      (isAdmin && !impersonating)

    const q = seeAll
      ? collection(db, 'oportunidades')
      : query(collection(db, 'oportunidades'), where('vendedorId', '==', effectiveProfile.uid))

    return onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Oportunidad))
        setLoading(false)
      },
      () => setLoading(false),
    )
  }, [effectiveProfile?.uid, effectiveProfile?.role, isAdmin, impersonating])

  return { data, loading }
}

export function useIcp() {
  const [icp, setIcp] = useState<IcpProfile | null>(null)
  useEffect(() => {
    return onSnapshot(collection(db, 'icp'), (snap) => {
      const cur = snap.docs.find((d) => d.id === 'current')
      setIcp(cur ? (cur.data() as IcpProfile) : null)
    })
  }, [])
  return icp
}

export function useTeamUsers() {
  const [data, setData] = useState<(AppUser & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    return onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setData(
          snap.docs.map((d) => {
            const raw = d.data()
            return {
              id: d.id,
              uid: d.id,
              email: raw.email,
              displayName: raw.displayName,
              role: raw.role,
              active: raw.active,
            }
          }),
        )
        setLoading(false)
      },
      () => setLoading(false),
    )
  }, [])
  return { data, loading }
}

export function useArchivos(opts: { empresaId?: string; oportunidadId?: string }) {
  const [data, setData] = useState<ArchivoMeta[]>([])
  const enabled = !!(opts.empresaId || opts.oportunidadId)
  useEffect(() => {
    if (!enabled) {
      setData([])
      return
    }
    const q = opts.oportunidadId
      ? query(collection(db, 'archivos'), where('oportunidadId', '==', opts.oportunidadId))
      : query(collection(db, 'archivos'), where('empresaId', '==', opts.empresaId))
    return onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ArchivoMeta))
      },
      () => undefined,
    )
  }, [opts.empresaId, opts.oportunidadId, enabled])
  return { data }
}
