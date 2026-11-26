import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore, initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

const requiredConfigKeys = Object.keys(firebaseConfig)

function assertFirebaseConfig() {
  const missingKeys = requiredConfigKeys.filter((key) => !firebaseConfig[key])

  if (missingKeys.length > 0) {
    throw new Error(`Configuração do Firebase incompleta: ${missingKeys.join(', ')}`)
  }
}

export function getFirebaseApp() {
  assertFirebaseConfig()
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
}

// Campos opcionais vazios chegam como undefined (ex.: benefício, início das inscrições).
// Sem esta opção o Firestore recusa a gravação inteira e o app mostrava um erro genérico.
let database = null
export function getFirebaseDatabase() {
  if (database) return database
  const app = getFirebaseApp()
  try {
    database = initializeFirestore(app, { ignoreUndefinedProperties: true })
  } catch {
    database = getFirestore(app)
  }
  return database
}

export function getFirebaseStorage() {
  return getStorage(getFirebaseApp())
}
