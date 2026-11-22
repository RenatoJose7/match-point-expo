import { useCallback, useEffect, useState } from 'react'
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin'

// No APK o login usa o Google Sign-In nativo do Android em vez do navegador.
// O token de identificação precisa ser emitido para o cliente Web do mesmo projeto
// do Firebase; o cliente Android (pacote + SHA-1) só autoriza o aplicativo.
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID

let configured = false

function configureOnce() {
  if (configured || !webClientId) return
  GoogleSignin.configure({ webClientId, ...(iosClientId ? { iosClientId } : {}) })
  configured = true
}

export function isGoogleIdTokenConfigured() {
  return Boolean(webClientId)
}

function describeError(error) {
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) return null
    if (error.code === statusCodes.IN_PROGRESS) return 'O login com Google já está em andamento.'
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return 'Atualize o Google Play Services para entrar com Google.'
    if (String(error.code) === '10' || error.code === 'DEVELOPER_ERROR') {
      return 'Login com Google não configurado para este APK. Cadastre o pacote e o SHA-1 do build no Google Cloud.'
    }
  }
  return error instanceof Error ? error.message : 'Não foi possível entrar com Google. Tente novamente.'
}

export function useGoogleIdToken() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    configureOnce()
    setReady(Boolean(webClientId))
  }, [])

  const getIdToken = useCallback(async () => {
    try {
      configureOnce()
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      // Encerra a escolha anterior para o usuário sempre poder selecionar a conta.
      await GoogleSignin.signOut().catch(() => undefined)
      const response = await GoogleSignin.signIn()
      if (!isSuccessResponse(response)) return { type: 'cancel' }
      const idToken = response.data?.idToken
      if (!idToken) return { type: 'error', message: 'O Google não retornou um token de identificação. Confira o cliente Web OAuth.' }
      return { type: 'success', idToken }
    } catch (error) {
      const message = describeError(error)
      return message ? { type: 'error', message } : { type: 'cancel' }
    }
  }, [])

  return { ready, getIdToken }
}
