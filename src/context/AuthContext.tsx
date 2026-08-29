import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase'
import type { AppUser, Role } from '../types'
import { createUserProfile, isAppBootstrapped, seedDemoData } from '../lib/seed'

const IMPERSONATE_KEY = 'encaje_impersonate_uid'

interface AuthState {
  firebaseUser: User | null
  /** Perfil real de la sesión (Auth). */
  profile: AppUser | null
  /** Perfil efectivo (impersonado si aplica). */
  effectiveProfile: AppUser | null
  loading: boolean
  needsBootstrap: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  bootstrapGerente: (email: string, password: string, displayName: string) => Promise<void>
  loadSeed: () => Promise<void>
  isAdmin: boolean
  isGerente: boolean
  impersonating: boolean
  impersonatedUser: AppUser | null
  setImpersonation: (uid: string | null) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsBootstrap, setNeedsBootstrap] = useState(false)
  const [impersonateUid, setImpersonateUid] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(IMPERSONATE_KEY)
    } catch {
      return null
    }
  })
  const [impersonatedUser, setImpersonatedUser] = useState<AppUser | null>(null)

  useEffect(() => {
    let unsubProfile: (() => void) | undefined
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsubProfile?.()
      setFirebaseUser(user)
      if (!user) {
        setProfile(null)
        setImpersonatedUser(null)
        setImpersonateUid(null)
        try {
          sessionStorage.removeItem(IMPERSONATE_KEY)
        } catch {
          /* ignore */
        }
        const bootstrapped = await isAppBootstrapped().catch(() => false)
        setNeedsBootstrap(!bootstrapped)
        setLoading(false)
        return
      }
      const ref = doc(db, 'users', user.uid)
      unsubProfile = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const d = snap.data()
          setProfile({
            uid: user.uid,
            email: d.email,
            displayName: d.displayName,
            role: d.role as Role,
            active: d.active,
          })
        } else {
          setProfile(null)
        }
        setLoading(false)
      })
    })
    return () => {
      unsub()
      unsubProfile?.()
    }
  }, [])

  useEffect(() => {
    if (!impersonateUid || !profile || profile.role !== 'admin') {
      setImpersonatedUser(null)
      return
    }
    return onSnapshot(doc(db, 'users', impersonateUid), (snap) => {
      if (!snap.exists()) {
        setImpersonatedUser(null)
        return
      }
      const d = snap.data()
      setImpersonatedUser({
        uid: snap.id,
        email: d.email,
        displayName: d.displayName,
        role: d.role as Role,
        active: d.active,
      })
    })
  }, [impersonateUid, profile])

  const setImpersonation = useCallback((uid: string | null) => {
    setImpersonateUid(uid)
    try {
      if (uid) sessionStorage.setItem(IMPERSONATE_KEY, uid)
      else sessionStorage.removeItem(IMPERSONATE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const logout = useCallback(async () => {
    setImpersonation(null)
    await signOut(auth)
  }, [setImpersonation])

  const bootstrapGerente = useCallback(async (email: string, password: string, displayName: string) => {
    const bootstrapped = await isAppBootstrapped()
    if (bootstrapped) throw new Error('La app ya tiene usuarios. Usá el login normal.')
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await createUserProfile(cred.user.uid, {
      email,
      displayName,
      role: 'gerente',
    })
    setNeedsBootstrap(false)
  }, [])

  const loadSeed = useCallback(async () => {
    if (!profile || (profile.role !== 'gerente' && profile.role !== 'admin')) {
      throw new Error('Solo admin/gerente puede cargar datos demo.')
    }
    await seedDemoData()
  }, [profile])

  const isAdmin = profile?.role === 'admin'
  const impersonating = !!(isAdmin && impersonatedUser)
  const effectiveProfile = impersonating ? impersonatedUser : profile
  const isGerente =
    effectiveProfile?.role === 'gerente' ||
    effectiveProfile?.role === 'admin' ||
    (!impersonating && isAdmin)

  const value = useMemo<AuthState>(
    () => ({
      firebaseUser,
      profile,
      effectiveProfile,
      loading,
      needsBootstrap,
      login,
      logout,
      bootstrapGerente,
      loadSeed,
      isAdmin: !!isAdmin,
      isGerente: !!isGerente,
      impersonating,
      impersonatedUser,
      setImpersonation,
    }),
    [
      firebaseUser,
      profile,
      effectiveProfile,
      loading,
      needsBootstrap,
      login,
      logout,
      bootstrapGerente,
      loadSeed,
      isAdmin,
      isGerente,
      impersonating,
      impersonatedUser,
      setImpersonation,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fuera de AuthProvider')
  return ctx
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as Omit<AppUser, 'uid'>) : null
}
