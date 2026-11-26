import { useState } from 'react'
import { Alert, Platform, Pressable } from 'react-native'
import { Text } from '../accessibility/AppText'
import { Ionicons } from '@expo/vector-icons'
import { isGoogleIdTokenConfigured, useGoogleIdToken } from './googleIdToken'

// No Android/iOS o token vem do Google Sign-In nativo (googleIdToken.native.js);
// na web, do fluxo OAuth do navegador (googleIdToken.web.js).
export function isGoogleLoginConfigured() {
  return isGoogleIdTokenConfigured()
}

const UNAVAILABLE_MESSAGE = 'O login com Google ainda não está ativo nesta versão do app. Entre com seu e-mail e senha.'

function GoogleButtonFrame({ label, busy, disabled, onPress, variant, style }) {
  const isSignup = variant === 'signup'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          // Altura e largura mínimas: com texto maior (acessibilidade) o botão cresce em vez de cortar.
          minHeight: isSignup ? 40 : 44,
          minWidth: isSignup ? 240 : undefined,
          maxWidth: '100%',
          width: isSignup ? undefined : '100%',
          paddingVertical: 6,
          alignSelf: isSignup ? 'center' : undefined,
          paddingHorizontal: 16,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          borderWidth: 1,
          borderColor: '#d0d5dd',
          borderRadius: 22,
          backgroundColor: '#fff',
          opacity: disabled && !busy ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Ionicons name="logo-google" size={18} color="#4285F4" />
      <Text
        numberOfLines={1}
        style={{
          color: '#344054',
          fontFamily: 'Poppins_500Medium',
          fontSize: 14,
          ...Platform.select({ web: { whiteSpace: 'nowrap' } }),
        }}
      >
        {busy ? 'Conectando…' : label}
      </Text>
    </Pressable>
  )
}

export function GoogleReauthenticationButton(props) {
  if (!isGoogleLoginConfigured()) {
    return <GoogleButtonFrame label={props.label ?? 'Confirmar com Google'} onPress={() => props.onFeedback?.(UNAVAILABLE_MESSAGE)} />
  }
  return <ConfiguredReauthenticationButton {...props} />
}

function ConfiguredReauthenticationButton({ disabled, label = 'Confirmar com Google', onFeedback, onToken }) {
  const { ready, getIdToken } = useGoogleIdToken()
  const [busy, setBusy] = useState(false)

  return (
    <GoogleButtonFrame
      label={label}
      busy={busy}
      disabled={disabled || !ready || busy}
      onPress={async () => {
        setBusy(true)
        const result = await getIdToken()
        setBusy(false)
        if (result.type === 'success') onToken(result.idToken)
        else if (result.type === 'error') onFeedback?.(result.message)
      }}
    />
  )
}

// O botão aparece sempre. Sem o ID do cliente Google no build, ele explica o motivo
// em vez de sumir; com o ID configurado, faz o login de verdade.
export function GoogleLoginButton(props) {
  if (!isGoogleLoginConfigured()) {
    const label = props.label ?? 'Continuar com Google'
    return (
      <GoogleButtonFrame
        label={label}
        variant={props.variant}
        style={props.style}
        onPress={() => {
          if (props.onFeedback) props.onFeedback({ status: 'error', message: UNAVAILABLE_MESSAGE })
          else Alert.alert('Login com Google', UNAVAILABLE_MESSAGE)
        }}
      />
    )
  }
  return <ConfiguredGoogleLoginButton {...props} />
}

function ConfiguredGoogleLoginButton({ repositories, onPendingSignup, onFeedback, onLoading, variant = 'outline', label = 'Continuar com Google', style }) {
  const { ready, getIdToken } = useGoogleIdToken()
  const [busy, setBusy] = useState(false)
  const isSignup = variant === 'signup'

  const handlePress = async () => {
    setBusy(true)
    onLoading(true)
    try {
      const result = await getIdToken()
      if (result.type === 'cancel') return
      if (result.type === 'error') {
        onFeedback({ status: 'error', message: result.message })
        return
      }

      const signIn = await repositories.authentication.entrarComGoogle(result.idToken)
      if (!signIn.ok) {
        onFeedback({ status: 'error', message: signIn.mensagem || 'Não foi possível entrar com Google.' })
        return
      }
      if (isSignup && signIn.data.cadastroExistente) {
        Alert.alert(
          'Cadastro já existente',
          `Esta conta Google já está registrada como ${signIn.data.tipo}. Você será direcionado para o perfil existente.`,
        )
      }
      if (signIn.data.cadastroPendente) {
        onPendingSignup({ email: signIn.data.email, nome: signIn.data.nome })
        return
      }
      onFeedback({ status: 'success', message: 'Login com Google realizado.' })
    } catch {
      onFeedback({ status: 'error', message: 'Não foi possível concluir o login com Google.' })
    } finally {
      setBusy(false)
      onLoading(false)
    }
  }

  return <GoogleButtonFrame label={label} busy={busy} disabled={!ready || busy} onPress={handlePress} variant={variant} style={style} />
}
