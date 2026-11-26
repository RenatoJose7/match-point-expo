import { useCallback } from 'react'
import * as Google from 'expo-auth-session/providers/google'

// Na web o login continua pelo fluxo OAuth do navegador (expo-auth-session).
const googleClientIds = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
}

export function isGoogleIdTokenConfigured() {
  return Boolean(googleClientIds.webClientId)
}

export function useGoogleIdToken() {
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({ ...googleClientIds, selectAccount: true })

  const getIdToken = useCallback(async () => {
    try {
      const result = await promptAsync()
      if (result.type === 'success') {
        const idToken = result.params?.id_token
        if (!idToken) return { type: 'error', message: 'O Google não retornou um token de identificação. Confira a configuração OAuth.' }
        return { type: 'success', idToken }
      }
      if (result.type === 'error') {
        return { type: 'error', message: result.error?.message || 'Não foi possível abrir o login do Google. Tente novamente.' }
      }
      return { type: 'cancel' }
    } catch (error) {
      return { type: 'error', message: error instanceof Error ? error.message : 'Não foi possível abrir o login do Google. Tente novamente.' }
    }
  }, [promptAsync])

  return { ready: Boolean(request), getIdToken }
}
