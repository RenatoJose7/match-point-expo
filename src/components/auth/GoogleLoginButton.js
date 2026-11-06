import { useEffect, useRef } from 'react'
import { Alert, Platform, Pressable, Text } from 'react-native'
import * as Google from 'expo-auth-session/providers/google'
import { Ionicons } from '@expo/vector-icons'

const googleClientIds = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
}

export function isGoogleLoginConfigured() {
  return Boolean(Platform.select({
    ios: googleClientIds.iosClientId,
    android: googleClientIds.androidClientId,
    default: googleClientIds.webClientId,
  }))
}

export function GoogleReauthenticationButton({ disabled, label = 'Confirmar com Google', onFeedback, onToken }) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({ ...googleClientIds, selectAccount: true })
  const handledResponse = useRef(null)

  useEffect(() => {
    if (response?.type !== 'success' || handledResponse.current === response) return
    handledResponse.current = response

    const idToken = response.params?.id_token
    if (!idToken) {
      onFeedback?.('O Google não retornou a confirmação da conta.')
      return
    }
    onToken(idToken)
  }, [response, onFeedback, onToken])

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || !request}
      onPress={() => promptAsync()}
      style={{
        minHeight: 42,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d0d5dd',
        borderRadius: 7,
        backgroundColor: '#fff',
        opacity: disabled || !request ? 0.45 : 1,
      }}
    >
      <Text style={{ color: '#183126', fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>{label}</Text>
    </Pressable>
  )
}

export function GoogleLoginButton({ repositories, onPendingSignup, onFeedback, onLoading, variant = 'outline', label = 'Continuar com Google', style }) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({ ...googleClientIds, selectAccount: true })
  const handledResponse = useRef(null)

  useEffect(() => {
    if (!response || handledResponse.current === response) return
    handledResponse.current = response

    if (response.type !== 'success') {
      if (response.type === 'error') {
        onFeedback({
          status: 'error',
          message: response.error?.message || 'Não foi possível abrir o login do Google. Tente novamente.',
        })
      }
      onLoading(false)
      return
    }

    const idToken = response.params?.id_token
    if (!idToken) {
      onFeedback({ status: 'error', message: 'O Google não retornou um token de identificação. Confira a configuração OAuth.' })
      onLoading(false)
      return
    }

    repositories.authentication.entrarComGoogle(idToken)
      .then((result) => {
        if (!result.ok) return onFeedback({ status: 'error', message: result.mensagem || 'Não foi possível entrar com Google.' })
        if (variant === 'signup' && result.data.cadastroExistente) {
          Alert.alert(
            'Cadastro já existente',
            `Esta conta Google já está registrada como ${result.data.tipo}. Você será direcionado para o perfil existente.`,
          )
        }
        if (result.data.cadastroPendente) {
          onPendingSignup({ email: result.data.email, nome: result.data.nome })
          return
        }
        onFeedback({ status: 'success', message: 'Login com Google realizado.' })
      })
      .catch(() => onFeedback({ status: 'error', message: 'Não foi possível concluir o login com Google.' }))
      .finally(() => onLoading(false))
  }, [response, repositories, onPendingSignup, onFeedback, onLoading, variant])

  const isLogin = variant === 'login'
  const isSignup = variant === 'signup'

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!request}
      onPress={async () => {
        onLoading(true)
        try {
          const result = await promptAsync()
          if (result.type !== 'success') onLoading(false)
        } catch (error) {
          onFeedback({
            status: 'error',
            message: error instanceof Error ? error.message : 'Não foi possível abrir o login do Google. Tente novamente.',
          })
          onLoading(false)
        }
      }}
      style={[
        {
          minHeight: isSignup ? 35 : (isLogin ? 42 : 46),
          height: isSignup ? 35 : (isLogin ? 42 : undefined),
          width: isSignup ? 190 : '100%',
          alignSelf: isSignup ? 'center' : undefined,
          paddingHorizontal: isSignup ? 16 : 16,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          borderWidth: 1,
          borderColor: '#d0d5dd',
          borderRadius: isSignup || isLogin ? 22 : 8,
          backgroundColor: '#fff',
        },
        style,
      ]}
    >
      {isLogin ? <Ionicons name="logo-google" size={17} color="#4285F4" /> : null}
      <Text
        numberOfLines={1}
        style={{
          color: isLogin ? '#344054' : '#183126',
          fontFamily: isLogin ? 'Poppins_500Medium' : 'Poppins_600SemiBold',
          fontSize: 13,
          letterSpacing: isSignup ? -0.15 : undefined,
          ...Platform.select({ web: { whiteSpace: 'nowrap' } }),
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}
