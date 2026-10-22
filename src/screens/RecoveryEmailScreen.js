import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

export function RecoveryEmailScreen({ go, back, repositories }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const requestReset = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Informe um endereço de e-mail válido.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await repositories.authentication.recuperarSenha(normalizedEmail)
      if (!result.ok) throw new Error(result.mensagem || 'Não foi possível solicitar a redefinição.')
      go('recovery2', { email: normalizedEmail })
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível solicitar a redefinição. Tente novamente.')
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
        <Field placeholder="Seu@gmail.com" value={email} onChangeText={(value) => { setEmail(value); setError('') }} keyboardType="email-address" />
        {error ? <Text accessibilityRole="alert" style={{ color: '#7a271a', fontFamily: 'Poppins_500Medium', fontSize: 12, textAlign: 'center' }}>{error}</Text> : null}
        <Button disabled={loading} onPress={requestReset}>{loading ? 'Enviando...' : 'Confirmar'}</Button>
      </View>
    </Shell>
  )
}
