import React, { useState } from 'react'
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { GoogleLoginButton, isGoogleLoginConfigured } from '../components/auth/GoogleLoginButton'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { BLUE, GREEN } from '../theme/colors'
import { styles } from '../theme/styles'

WebBrowser.maybeCompleteAuthSession()

function Feedback({ status, children }) {
  const color = status === 'error' ? '#b42318' : '#126b35'
  return (
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={localStyles.feedbackText}>
      <Text style={{ color }}>{children}</Text>
    </Text>
  )
}

export function LoginScreen({ go, back, repositories }) {
  const { height } = useWindowDimensions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const googleConfigured = isGoogleLoginConfigured()

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
      <Image source={assets.logo} style={[styles.loginLogo, localStyles.loginLogo]} resizeMode="contain" />
      <ScrollView
        style={localStyles.scroll}
        contentContainerStyle={[localStyles.scrollContent, { paddingTop: Math.max(220, Math.round(height * 0.36)) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={[styles.card, localStyles.loginCard]}>
        <Text style={[styles.title, localStyles.title]}>Login</Text>
        <Text style={styles.helper}>
          Não possui conta?{' '}
          <Text style={styles.semibold} onPress={() => go('choice')}>
            Clique Aqui
          </Text>
        </Text>

        <View style={localStyles.formGap} />

        {/* Campo de e-mail com fundo branco e borda azul arredondada */}
        <View style={localStyles.inputField}>
          <TextInput
            placeholder="Seu@gmail.com"
            placeholderTextColor="#6c8ea4"
            style={localStyles.textInput}
            value={email}
            onChangeText={(value) => {
              setEmail(value)
              setFeedback(null)
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Campo de senha com fundo branco, borda azul e alternância de visualização */}
        <View style={localStyles.inputField}>
          <TextInput
            placeholder="Senha"
            placeholderTextColor="#6c8ea4"
            secureTextEntry={!showPassword}
            style={localStyles.textInput}
            value={password}
            onChangeText={(value) => {
              setPassword(value)
              setFeedback(null)
            }}
            autoCapitalize="none"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={12}
            style={localStyles.eyeButton}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={BLUE} />
          </Pressable>
        </View>

        <Pressable onPress={() => go('recovery1')}>
          <Text style={localStyles.forgotPassword}>Esqueci minha senha</Text>
        </Pressable>

        {feedback && <Feedback status={feedback.status}>{feedback.message}</Feedback>}

        {/* Botão Entrar */}
        <Pressable
          accessibilityRole="button"
          onPress={signIn}
          disabled={loading}
          style={({ pressed }) => [
            localStyles.submitButton,
            pressed && localStyles.submitButtonPressed,
            loading && { opacity: 0.7 },
          ]}
        >
          <Text style={localStyles.submitButtonText}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </Pressable>

        {/* Divisor "ou" organizado */}
        <View style={localStyles.dividerRow}>
          <View style={localStyles.dividerLine} />
          <Text style={localStyles.dividerText}>ou</Text>
          <View style={localStyles.dividerLine} />
        </View>

        {/* Botão Google integrado e alinhado */}
        {googleConfigured ? (
          <GoogleLoginButton
            repositories={repositories}
            variant="login"
            onPendingSignup={(params) => go('choice', { googleSignup: true, ...params })}
            onFeedback={setFeedback}
            onLoading={setLoading}
          />
        ) : (
          <Text style={localStyles.googleNotice}>
            Login com Google será habilitado após configurar os IDs OAuth.
          </Text>
        )}

        {/* Me mantenha conectado com checkbox interativo e espaçamento inferior */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberMe }}
          onPress={() => setRememberMe((v) => !v)}
          style={localStyles.rememberRow}
        >
          <View style={[localStyles.checkbox, rememberMe && localStyles.checkboxChecked]}>
            {rememberMe ? <Text style={localStyles.checkMark}>✓</Text> : null}
          </View>
          <Text style={localStyles.rememberText}>Me mantenha conectado</Text>
        </Pressable>
      </View>
      </ScrollView>
    </Shell>
  )
}

const localStyles = StyleSheet.create({
  title: {
    fontSize: 40,
    lineHeight: 46,
  },
  loginCard: {
    marginHorizontal: 17,
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 26,
    borderRadius: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  loginLogo: {
    top: 48,
  },
  formGap: {
    height: 16,
  },
  inputField: {
    height: 40,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: BLUE,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  eyeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPassword: {
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    textDecorationLine: 'underline',
    fontSize: 13,
    marginTop: -4,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  feedbackText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    marginVertical: 6,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: GREEN,
    height: 38,
    width: 145,
    borderRadius: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  submitButtonText: {
    fontFamily: 'Poppins_500Medium',
    color: '#155326',
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e1e7ec',
  },
  dividerText: {
    color: '#7b8f9e',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  googleNotice: {
    color: '#667085',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: BLUE,
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: 'bold',
  },
  rememberText: {
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
})
