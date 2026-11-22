import React, { useState } from 'react'
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { BLUE } from '../theme/colors'
import { styles } from '../theme/styles'

export function RecoveryEmailScreen({ go, back, repositories }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const requestReset = async () => {
    if (loading) return
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
      <View style={[styles.card, styles.recoveryCard, localStyles.card]}>
        <Text style={[styles.title, localStyles.title]}>Recuperar <Text style={styles.greenTitle}>senha</Text></Text>
        <Text style={styles.recoveryCopy}>Insira o endereço de e-mail usado ao registrar a conta. Você receberá um link de redefinição.</Text>
        <TextInput
          accessibilityLabel="E-mail da conta"
          placeholder="Seu@gmail.com"
          placeholderTextColor="#6c8ea4"
          value={email}
          onChangeText={(value) => { setEmail(value); setError('') }}
          onSubmitEditing={requestReset}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="send"
          style={localStyles.input}
        />
        {error ? <Text accessibilityRole="alert" style={localStyles.error}>{error}</Text> : null}
        <Button disabled={loading} onPress={requestReset}>{loading ? 'Enviando...' : 'Confirmar'}</Button>
      </View>
    </Shell>
  )
}

const localStyles = StyleSheet.create({
  card: { top: '37.2%', paddingTop: 20, paddingBottom: 22, gap: 12 },
  title: { fontSize: 40, lineHeight: 46, marginBottom: -6 },
  input: {
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BLUE,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginTop: 6,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  error: { color: '#b42318', fontFamily: 'Poppins_500Medium', fontSize: 13, textAlign: 'center' },
})
