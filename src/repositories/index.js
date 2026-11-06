import { createMemoryRepositories } from './memory/index.js'
import { createFirebaseRepositories } from './firebase/index.js'

export function createRepositories(options = {}) {
  const provider = options.provider ?? process.env.EXPO_PUBLIC_DATA_PROVIDER ?? 'memory'

  if (provider === 'memory') {
    return createMemoryRepositories(options.seed)
  }

  if (provider === 'firebase') {
    const memoryRepositories = createMemoryRepositories(options.seed)
    const firebaseRepositories = createFirebaseRepositories()

    return {
      ...memoryRepositories,
      ...firebaseRepositories,
      users: {
        ...memoryRepositories.users,
        ...firebaseRepositories.users,
      },
      demo: memoryRepositories,
    }
  }

  throw new Error(`Provedor de dados ainda não configurado: ${provider}`)
}
