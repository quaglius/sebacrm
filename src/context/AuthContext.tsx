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
import { createUserProfile, hasAnyUsers, seedDemoData } from '../lib/seed'

interface AuthState {
  firebaseUser: User | null
  profile: AppUser | null
  loading: boolean
  needsBootstrap: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  bootstrapGerente: (email: string, password: string, displayName: string) => Promise<void>
  loadSeed: () => Promise<void>
  isGerente: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsBootstrap, setNeedsBootstrap] = useState(false)

  useEffect(() => {
    let unsubProfile: (() => void) | undefined
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsubProfile?.()
      setFirebaseUser(user)
      if (!user) {
        setProfile(null)
        const any = await hasAnyUsers().catch(() => false)
        setNeedsBootstrap(!any)
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

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const bootstrapGerente = useCallback(async (email: string, password: string, displayName: string) => {
    const any = await hasAnyUsers()
    if (any) throw new Error('Ya existe un usuario. Pedile acceso a un gerente.')
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
    if (!profile || profile.role !== 'gerente') throw new Error('Solo el gerente puede cargar datos demo.')
    await seedDemoData()
  }, [profile])

  const value = useMemo<AuthState>(
    () => ({
      firebaseUser,
      profile,
      loading,
      needsBootstrap,
      login,
      logout,
      bootstrapGerente,
      loadSeed,
      isGerente: profile?.role === 'gerente',
    }),
    [firebaseUser, profile, loading, needsBootstrap, login, logout, bootstrapGerente, loadSeed],
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
