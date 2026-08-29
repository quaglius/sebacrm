/**
 * Crea/actualiza el usuario admin.
 * Uso: ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... npx tsx scripts/create-admin.mts
 */
import { initializeApp, deleteApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDhlkYel5xKNCD8bKG0NK-hmCWhoEIubSw',
  authDomain: 'sebacrm.firebaseapp.com',
  projectId: 'sebacrm',
  storageBucket: 'sebacrm.firebasestorage.app',
  messagingSenderId: '1076552885497',
  appId: '1:1076552885497:web:6c578df7394e5f05676e28',
}

const ADMIN = {
  email: process.env.ADMIN_EMAIL || '',
  password: process.env.ADMIN_PASSWORD || '',
  displayName: process.env.ADMIN_NAME || 'Admin',
}

async function main() {
  if (!ADMIN.email || !ADMIN.password) {
    throw new Error('Definí ADMIN_EMAIL y ADMIN_PASSWORD')
  }
  const app = initializeApp(firebaseConfig, 'create-admin')
  const auth = getAuth(app)
  const db = getFirestore(app)

  let uid: string
  try {
    const cred = await createUserWithEmailAndPassword(auth, ADMIN.email, ADMIN.password)
    uid = cred.user.uid
    await updateProfile(cred.user, { displayName: ADMIN.displayName })
    console.log('Auth creado', uid)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, ADMIN.email, ADMIN.password)
      uid = cred.user.uid
      console.log('Auth ya existía', uid)
    } else {
      throw e
    }
  }

  await setDoc(doc(db, 'users', uid), {
    email: ADMIN.email,
    displayName: ADMIN.displayName,
    role: 'admin',
    active: true,
  })
  await setDoc(
    doc(db, 'meta', 'bootstrap'),
    { seeded: true, seededAt: new Date().toISOString(), hasAdmin: true },
    { merge: true },
  )
  console.log('Perfil admin OK')
  await signOut(auth)
  await deleteApp(app)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
