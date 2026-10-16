import React, { useState } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

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
          message: 'Login realizado. A área do responsável será disponibilizada com o fluxo de vínculo.',
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
        <Text style={styles.remember}>□  Me mantenha conectado</Text>
      </View>
    </Shell>
  )
}
