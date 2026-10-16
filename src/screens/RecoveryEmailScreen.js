import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { OperationFeedback } from '../components/ui/OperationFeedback'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

export function RecoveryEmailScreen({ go, back, repositories }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const requestPasswordReset = async () => {
    if (loading) return

    const normalizedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage('Informe um endereço de e-mail válido.')
      return
    }

    setErrorMessage('')
    setLoading(true)

    try {
      const result = await repositories.authentication.recuperarSenha(normalizedEmail)

      if (!result.ok) {
        setErrorMessage(result.mensagem)
        return
      }

      go('recovery2')
    } catch (error) {
      if (!(error instanceof Error)) throw error
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell background={assets.recovery1} back={back} logo>
      <View style={[styles.card, styles.recoveryCard, styles.recoveryOne]}>
        <Text style={styles.title}>Recuperar <Text style={styles.greenTitle}>senha</Text></Text>
        <Text style={styles.recoveryCopy}>Insira o endereço de e-mail usado ao{`\n`}registrar a conta. Você receberá um link{`\n`}de redefinição.</Text>
        <View style={styles.fieldTop} />
        <Field
          placeholder="Seu@gmail.com"
          value={email}
          onChangeText={value => {
            setEmail(value)
            setErrorMessage('')
          }}
          keyboardType="email-address"
        />
        {loading && <OperationFeedback status="loading" message="Enviando solicitação..." />}
        {errorMessage ? <OperationFeedback status="error" message={errorMessage} /> : null}
        <Button onPress={requestPasswordReset} disabled={loading}>
          {loading ? 'Enviando...' : 'Confirmar'}
        </Button>
      </View>
    </Shell>
  )
}
