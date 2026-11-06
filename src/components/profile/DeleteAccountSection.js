import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { GoogleReauthenticationButton, isGoogleLoginConfigured } from '../auth/GoogleLoginButton'

export function DeleteAccountSection({ repositories }) {
  const [confirming, setConfirming] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')

  const deleteAccount = async (credentials = {}) => {
    if (confirmation !== 'EXCLUIR' || deleting) return
    setDeleting(true)
    setError('')
    const result = await repositories.authentication.excluirConta(credentials)
    if (!result.ok) {
      setError(result.mensagem || 'Não foi possível excluir a conta.')
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <Pressable accessibilityRole="button" onPress={() => setConfirming(true)} style={styles.openButton}>
        <Text style={styles.openText}>Excluir minha conta</Text>
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Excluir conta permanentemente</Text>
      <Text style={styles.copy}>
        Esta ação remove seu acesso e seu perfil. Digite EXCLUIR e confirme novamente sua identidade.
      </Text>
      <TextInput
        accessibilityLabel="Confirmação de exclusão da conta"
        autoCapitalize="characters"
        onChangeText={(value) => { setConfirmation(value.toUpperCase()); setError('') }}
        placeholder="EXCLUIR"
        placeholderTextColor="#9b7777"
        style={styles.input}
        value={confirmation}
      />
      <TextInput
        accessibilityLabel="Senha atual para excluir a conta"
        autoCapitalize="none"
        onChangeText={(value) => { setPassword(value); setError('') }}
        placeholder="Senha atual (contas com e-mail)"
        placeholderTextColor="#9b7777"
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: confirmation !== 'EXCLUIR' || deleting }}
        disabled={confirmation !== 'EXCLUIR' || deleting}
        onPress={() => deleteAccount(password ? { password } : {})}
        style={[styles.deleteButton, (confirmation !== 'EXCLUIR' || deleting) && styles.disabled]}
      >
        <Text style={styles.deleteText}>{deleting ? 'Excluindo...' : 'Confirmar exclusão'}</Text>
      </Pressable>
      {isGoogleLoginConfigured() ? (
        <GoogleReauthenticationButton
          disabled={confirmation !== 'EXCLUIR' || deleting}
          label="Confirmar com Google e excluir"
          onFeedback={setError}
          onToken={(idToken) => deleteAccount({ idToken })}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => { setConfirming(false); setConfirmation(''); setPassword(''); setError('') }}
        disabled={deleting}
        style={styles.cancelButton}
      >
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  openButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  openText: { color: '#b42318', fontFamily: 'Poppins_500Medium', fontSize: 13, textDecorationLine: 'underline' },
  container: { borderColor: '#efb8b4', borderRadius: 10, borderWidth: 1, backgroundColor: '#fff6f5', gap: 9, marginTop: 12, padding: 14 },
  title: { color: '#8f1d16', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  copy: { color: '#704845', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 22 },
  input: { minHeight: 42, borderColor: '#d9a5a1', borderRadius: 7, borderWidth: 1, backgroundColor: '#fff', color: '#8f1d16', fontFamily: 'Poppins_600SemiBold', fontSize: 13, paddingHorizontal: 11 },
  error: { color: '#b42318', fontFamily: 'Poppins_400Regular', fontSize: 13 },
  deleteButton: { minHeight: 42, borderRadius: 7, backgroundColor: '#b42318', alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
  deleteText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  cancelButton: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#526770', fontFamily: 'Poppins_500Medium', fontSize: 13 },
})
