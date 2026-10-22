import React, { useEffect, useState } from 'react'
import { Image, Platform, Pressable, Text, View } from 'react-native'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

WebBrowser.maybeCompleteAuthSession()

const googleClientIds = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
}

function GoogleLoginButton({ repositories, go, onFeedback, onLoading }) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({ ...googleClientIds, selectAccount: true })

  useEffect(() => {
    if (response?.type !== 'success') return
    const idToken = response.params?.id_token
    if (!idToken) {
      onFeedback({ status: 'error', message: 'O Google não retornou um token de identificação. Confira a configuração OAuth.' })
      onLoading(false)
      return
    }
    repositories.authentication.entrarComGoogle(idToken)
      .then((result) => {
        if (!result.ok) return onFeedback({ status: 'error', message: result.mensagem || 'Não foi possível entrar com Google.' })
        if (result.data.cadastroPendente) {
          go('choice', { googleSignup: true, email: result.data.email, nome: result.data.nome })
          return
        }
        onFeedback({ status: 'success', message: 'Login com Google realizado.' })
      })
      .catch(() => onFeedback({ status: 'error', message: 'Não foi possível concluir o login com Google.' }))
      .finally(() => onLoading(false))
  }, [response, repositories, go, onFeedback, onLoading])

  return <Pressable accessibilityRole="button" disabled={!request} onPress={() => { onLoading(true); promptAsync() }} style={{ minHeight: 46, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#d0d5dd', borderRadius: 8 }}><Text style={{ color: '#183126', fontFamily: 'Poppins_600SemiBold' }}>Continuar com Google</Text></Pressable>
}

function Feedback({ status, children }) {
  const color = status === 'error' ? '#b42318' : '#126b35'
  return (
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color, fontFamily: 'Poppins_400Regular', marginVertical: 8 }}>
      {children}
    </Text>
  )
}

export function LoginScreen({ go, back, repositories }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const googleConfigured = Boolean(Platform.select({
    ios: googleClientIds.iosClientId,
    android: googleClientIds.androidClientId,
    default: googleClientIds.webClientId,
  }))

  const signIn = async () => {
    if (loading) return

    const normalizedEmail = email.trim()
    if (!normalizedEmail || !password) {
      setFeedback({ status: 'error', message: 'Informe seu e-mail e sua senha.' })
      return
    }

    setFeedback(null)
    setLoading(true)

    try {
      const result = await repositories.authentication.entrar(normalizedEmail, password)
      if (!result.ok) {
        setFeedback({ status: 'error', message: result.mensagem })
        return
      }

      if (result.data?.tipo === 'responsavel') {
        setFeedback({
          status: 'success',
          message: 'Login realizado. Abrindo a área do responsável.',
        })
      }
    } catch (error) {
      if (!(error instanceof Error)) throw error
      setFeedback({ status: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell background={assets.court} back={back}>
      <Image source={assets.logo} style={styles.loginLogo} resizeMode="contain" />
      <View style={[styles.card, styles.loginCard]}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.helper}>Não possui conta? <Text style={styles.semibold} onPress={() => go('choice')}>Clique Aqui</Text></Text>
        <View style={styles.formGap} />
        <Field
          placeholder="Seu@gmail.com"
          value={email}
          onChangeText={value => {
            setEmail(value)
            setFeedback(null)
          }}
          keyboardType="email-address"
        />
        <Field
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={value => {
            setPassword(value)
            setFeedback(null)
          }}
        />
        <Pressable onPress={() => go('recovery1')}><Text style={styles.link}>Esqueci minha senha</Text></Pressable>
        {feedback && <Feedback status={feedback.status}>{feedback.message}</Feedback>}
        <Button onPress={signIn} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
        {googleConfigured ? <GoogleLoginButton repositories={repositories} go={go} onFeedback={setFeedback} onLoading={setLoading} /> : <Text style={{ color: '#667085', fontFamily: 'Poppins_400Regular', fontSize: 12, textAlign: 'center' }}>Login com Google será habilitado após configurar os IDs OAuth.</Text>}
        <Text style={styles.remember}>□  Me mantenha conectado</Text>
      </View>
    </Shell>
  )
}
