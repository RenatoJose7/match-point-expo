import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

function Feedback({ status, children }) {
  const appearance = status === 'error'
    ? { color: '#7a271a', backgroundColor: '#fef3f2', borderColor: '#fda29b', title: 'Atenção' }
    : { color: '#05603a', backgroundColor: '#ecfdf3', borderColor: '#6ce9a6', title: 'Solicitação enviada' }

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: appearance.backgroundColor,
        borderColor: appearance.borderColor,
        borderLeftWidth: 5,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 12,
        padding: 10,
      }}
    >
      <Text style={{ color: appearance.color, fontFamily: 'Poppins_500Medium', marginBottom: 2 }}>
        {appearance.title}
      </Text>
      <Text style={{ color: appearance.color, fontFamily: 'Poppins_400Regular' }}>
        {children}
      </Text>
    </View>
  )
}

export function RecoveryEmailScreen({ go, back, repositories }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const requestRecovery = async () => {
    if (loading) return
    if (feedback?.status === 'success') {
      go('recovery2')
      return
    }

    const normalizedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFeedback({ status: 'error', message: 'Informe um endereço de e-mail válido.' })
      return
    }

    setLoading(true)
    setFeedback(null)

    try {
      const result = await repositories.authentication.recuperarSenha(normalizedEmail)
      if (!result.ok) {
        setFeedback({ status: 'error', message: result.mensagem })
        return
      }

      setFeedback({
        status: 'success',
        message: 'Se houver uma conta associada a este e-mail, enviaremos instruções para redefinir sua senha.',
      })
    } catch (error) {
      if (!(error instanceof Error)) throw error
      setFeedback({ status: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell background={assets.recovery1} back={back} logo>
      <View style={[styles.card, styles.recoveryCard, styles.recoveryOne, feedback && { height: 320 }]}>
        <Text style={styles.title}>Recuperar <Text style={styles.greenTitle}>senha</Text></Text>
        <Text style={styles.recoveryCopy}>Insira o endereço de e-mail usado ao{`\n`}registrar a conta. Você receberá um link{`\n`}de redefinição.</Text>
        <View style={styles.fieldTop} />
        <Field
          placeholder="Seu@gmail.com"
          value={email}
          onChangeText={value => {
            setEmail(value)
            setFeedback(null)
          }}
          keyboardType="email-address"
        />
        {feedback && <Feedback status={feedback.status}>{feedback.message}</Feedback>}
        <Button onPress={requestRecovery} disabled={loading}>
          {loading ? 'Enviando solicitação...' : feedback?.status === 'success' ? 'Ver instruções' : 'Confirmar'}
        </Button>
      </View>
    </Shell>
  )
}
