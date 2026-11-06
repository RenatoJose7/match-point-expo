import React, { useEffect, useState } from 'react'
import { Image, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native'
import { GoogleLoginButton, isGoogleLoginConfigured } from '../../components/auth/GoogleLoginButton'
import { Button } from '../../components/ui/Button'
import { BackButton } from '../../components/ui/BackButton'
import { SelectField, SELECT_OPTIONS } from '../../components/ui/SelectField'
import { BLUE } from '../../theme/colors'
import { assets } from '../../theme/assets'
import { USER_TYPES, calculateAge, isMinor } from '../../domain/contracts.js'

const BRAZIL_DDDS = [
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
]

const GOOGLE_SIGNUP_ROUTES = {
  [USER_TYPES.ATHLETE]: 'signupAthlete',
  [USER_TYPES.TRAINER]: 'signupTrainer',
  [USER_TYPES.INSTITUTION]: 'signupInstitution',
  [USER_TYPES.GUARDIAN]: 'signupResponsible',
}

function parseBirthDate(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, day, month, year] = match
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day))
  if (
    parsedDate.getFullYear() !== Number(year)
    || parsedDate.getMonth() !== Number(month) - 1
    || parsedDate.getDate() !== Number(day)
  ) {
    return null
  }

  const isoDate = `${year}-${month}-${day}`
  return calculateAge(isoDate) === null ? null : isoDate
}

function formatBirthDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function formatDocument(field, value) {
  const isCnpj = field.toLowerCase().includes('cnpj')
  const digits = value.replace(/\D/g, '').slice(0, isCnpj ? 14 : 11)

  if (isCnpj) {
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, digits.length - 4)}-${digits.slice(-4)}`
}

function formatPhone(ddd, number) {
  return `+55 (${ddd}) ${number}`
}

function DddPicker({ visible, selectedDdd, onSelect, onClose }) {
  const { width, height } = useWindowDimensions()
  const appFrameWidth = width <= 430 ? width : Math.min(height * (402 / 874), 430)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, width: appFrameWidth, alignSelf: 'flex-start', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.55)', padding: 24 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar seleção de DDD"
          onPress={onClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View style={{ maxHeight: '78%', borderRadius: 12, backgroundColor: '#fff', padding: 18 }}>
          <Text style={{ color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, marginBottom: 10 }}>
            Selecione o DDD
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {BRAZIL_DDDS.map(ddd => (
              <Pressable
                key={ddd}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedDdd === ddd }}
                onPress={() => onSelect(ddd)}
                style={{
                  minHeight: 44,
                  justifyContent: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: '#e4e7ec',
                  paddingHorizontal: 8,
                  backgroundColor: selectedDdd === ddd ? '#eff8ff' : '#fff',
                }}
              >
                <Text style={{ color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 }}>
                  +55 ({ddd})
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={onClose} style={{ padding: 12, alignItems: 'center' }}>
            <Text style={{ color: BLUE, fontFamily: 'Poppins_500Medium' }}>Fechar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function Feedback({ status, children }) {
  const appearance = status === 'error'
    ? { color: '#7a271a', backgroundColor: '#fef3f2', borderColor: '#fda29b', title: 'Atenção' }
    : status === 'success'
      ? { color: '#05603a', backgroundColor: '#ecfdf3', borderColor: '#6ce9a6', title: 'Sucesso' }
      : { color: '#1849a9', backgroundColor: '#eff8ff', borderColor: '#84caff', title: 'Informação' }

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
        marginVertical: 8,
        padding: 12,
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

function isOptionalField(field) {
  const normalized = field.toLowerCase()
  return normalized.includes('(opcional)') || normalized.includes('(apenas menores)')
}

export function SignupForm({ config, go, back, repositories, routeParams = {} }) {
  const { height } = useWindowDimensions()
  const { accent, background, fields, isAthlete = false, titleBreak = false, userType } = config
  const googleSignup = Boolean(routeParams.googleSignup)
  const nameField = fields.find(field => field.toLowerCase().includes('nome'))
  const [values, setValues] = useState(() => (
    googleSignup && nameField && routeParams.nome ? { [nameField]: routeParams.nome } : {}
  ))
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [selectedDdd, setSelectedDdd] = useState('')
  const [dddPickerVisible, setDddPickerVisible] = useState(false)
  const emailField = fields.find(field => field.toLowerCase().includes('email'))
  const confirmationField = fields.find(field => field.toLowerCase().includes('confirme'))
  const passwordField = fields.find(field => field.toLowerCase().includes('senha') && !field.toLowerCase().includes('confirme'))
  const guardianCodeField = fields.find(field => field.toLowerCase().includes('respons'))

  useEffect(() => {
    if (googleSignup && nameField && routeParams.nome) {
      setValues(current => ({ ...current, [nameField]: routeParams.nome }))
    }
  }, [googleSignup, nameField, routeParams.nome])
  const birthDateField = fields.find(field => field === 'Data de nascimento')
  const birthDateInput = birthDateField ? values[birthDateField] ?? '' : ''
  const birthDate = isAthlete ? parseBirthDate(birthDateInput) : null
  const age = birthDate ? calculateAge(birthDate) : null
  const minor = birthDate ? isMinor(birthDate) : false
  const visibleFields = fields.filter((field) => (
    !(googleSignup && (field === emailField || field === passwordField || field === confirmationField))
    && !(isAthlete && field.toLowerCase().includes('respons') && !minor)
  ))
  const compactForm = visibleFields.length >= 7
  const passwordValue = values[passwordField] ?? ''
  const hasStrongPassword = passwordValue.length >= 8
    && /[a-z]/.test(passwordValue)
    && /[A-Z]/.test(passwordValue)
    && /\d/.test(passwordValue)
    && /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/.test(passwordValue)

  const updateValue = (field, value) => {
    const lowerField = field.toLowerCase()
    const formattedValue = field === birthDateField
      ? formatBirthDate(value)
      : /cpf|cnpj/i.test(field)
        ? formatDocument(field, value)
        : lowerField.includes('telefone')
          ? formatPhoneNumber(value)
          : value
    setValues(current => ({ ...current, [field]: formattedValue }))
    setFeedback(null)
  }

  const register = async () => {
    if (loading) return

    const phoneField = fields.find(field => field.toLowerCase().includes('telefone'))
    const documentField = fields.find(field => /cpf|cnpj/i.test(field))
    const locationField = fields.find(field => field.toLowerCase().includes('localiza'))
    const relationshipField = fields.find(field => field.toLowerCase().includes('parentesco'))
    const email = googleSignup ? routeParams.email ?? '' : values[emailField]?.trim() ?? ''
    const password = values[passwordField] ?? ''
    const passwordConfirmation = values[confirmationField] ?? ''

    const missingField = fields.find((field) => {
      if (googleSignup && (field === emailField || field === passwordField || field === confirmationField)) return false
      if (isOptionalField(field) || field === confirmationField) return false
      return !String(values[field] ?? '').trim()
    })

    if (missingField) {
      setFeedback({ status: 'error', message: `Preencha o campo ${missingField}.` })
      return
    }

    if (!emailField || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFeedback({ status: 'error', message: 'Informe um endereço de e-mail válido.' })
      return
    }

    if (!googleSignup && (!password || password !== passwordConfirmation)) {
      setFeedback({ status: 'error', message: 'As senhas são obrigatórias e precisam ser iguais.' })
      return
    }

    if (!googleSignup && !hasStrongPassword) {
      setFeedback({
        status: 'error',
        message: 'Use pelo menos 8 caracteres e inclua uma letra maiúscula, uma minúscula, um número e um símbolo (como !).',
      })
      return
    }

    const documentValue = documentField ? values[documentField] ?? '' : ''
    const documentDigits = documentValue.replace(/\D/g, '')
    if (documentField && (documentDigits || !isOptionalField(documentField))
      && documentDigits.length !== (documentField.toLowerCase().includes('cnpj') ? 14 : 11)) {
      setFeedback({
        status: 'error',
        message: `${documentField.toUpperCase()} incompleto. Confira o número informado.`,
      })
      return
    }

    const phoneValue = phoneField ? values[phoneField] ?? '' : ''
    const phoneDigits = phoneValue.replace(/\D/g, '')
    const phoneRequired = phoneField && !isOptionalField(phoneField)
    if (phoneField && (phoneDigits || phoneRequired)) {
      if (!selectedDdd) {
        setFeedback({ status: 'error', message: 'Selecione o DDD do telefone.' })
        return
      }
      if (phoneDigits.length !== 8 && phoneDigits.length !== 9) {
        setFeedback({ status: 'error', message: 'Informe um telefone com 8 ou 9 dígitos, sem o DDD.' })
        return
      }
    }

    if (isAthlete && age === null) {
      setFeedback({ status: 'error', message: 'Informe uma data de nascimento válida para continuar.' })
      return
    }

    if (isAthlete && minor && !values[guardianCodeField]?.trim()) {
      setFeedback({
        status: 'error',
        message: 'Informe o código ativo gerado pelo responsável legal para concluir o cadastro.',
      })
      return
    }

    if (!acceptedPrivacy) {
      setFeedback({ status: 'error', message: 'Aceite a política de privacidade para criar sua conta.' })
      return
    }

    setFeedback(null)
    setLoading(true)

    const profile = userType === USER_TYPES.ATHLETE
      ? {
          dataNascimento: birthDate,
          modalidade: '',
          ...(minor ? { codigoResponsavel: values[guardianCodeField]?.trim() } : {}),
        }
      : userType === USER_TYPES.GUARDIAN
        ? {
            parentesco: values[relationshipField]?.trim() ?? '',
            documento: documentValue.trim() || undefined,
            telefone: phoneDigits ? formatPhone(selectedDdd, phoneValue) : undefined,
          }
        : {
            tipo: userType,
            nomeExibicao: values[nameField]?.trim() ?? '',
            documento: documentValue.trim() || undefined,
            localizacao: values[locationField]?.trim() || undefined,
            verificado: false,
          }

    try {
      const registrationData = {
        nome: values[nameField]?.trim() || routeParams.nome || '',
        telefone: phoneDigits ? formatPhone(selectedDdd, phoneValue) : undefined,
        perfil: profile,
      }
      const result = googleSignup
        ? await repositories.authentication.concluirCadastroGoogle(userType, registrationData)
        : await repositories.authentication.cadastrar(email, password, userType, registrationData)

      if (!result.ok) {
        setFeedback({ status: 'error', message: result.mensagem })
        return
      }

      const message = userType === USER_TYPES.GUARDIAN
        ? 'Conta de responsável criada. Gere um código para vincular o atleta menor de idade.'
        : 'Conta criada com sucesso. Abrindo seu espaço...'
      setFeedback({ status: 'success', message })
    } catch (error) {
      if (!(error instanceof Error)) throw error
      setFeedback({ status: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[localStyles.screen, { height }]}>
      <Image source={background} resizeMode="cover" style={[localStyles.background, { height }]} />
      <View pointerEvents="none" style={localStyles.dim} />
      <SafeAreaView style={localStyles.safe}>
        {back ? <BackButton onPress={back} /> : null}
        <Image source={assets.monogram} resizeMode="contain" style={localStyles.monogram} />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={localStyles.scroll}
          contentContainerStyle={[localStyles.scrollContent, { minHeight: height }]}
        >
          <View style={[localStyles.signupWrap, compactForm && localStyles.signupWrapCompact]}>
          <Text style={[localStyles.title, compactForm && localStyles.titleCompact, titleBreak && localStyles.titleTwoLine]}>
            Cadastro{titleBreak ? '\n' : ' '}<Text style={localStyles.accent}>{accent}</Text>
          </Text>
          {googleSignup && (
            <Text style={{ color: '#fff', fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 18 }}>
              Conta Google conectada. Complete os dados abaixo.
            </Text>
          )}
          <View style={[localStyles.fields, compactForm && localStyles.fieldsCompact]}>
            {visibleFields.map(field => {
              const isBirthDate = field === birthDateField
              const normalizedField = field.toLowerCase()
              const isPassword = normalizedField.includes('senha')
              const isPasswordConfirmation = normalizedField.includes('confirme')
              const isPhone = normalizedField.includes('telefone')
              const isDocument = /cpf|cnpj/i.test(field)
              const isEmail = normalizedField.includes('email')
              const isGuardianCode = field === guardianCodeField
              const selectOptions = optionsForField(field)

              return (
                <React.Fragment key={field}>
                  {selectOptions ? (
                    <SelectField
                      accessibilityLabel={field}
                      options={selectOptions}
                      value={values[field] ?? ''}
                      onChange={value => updateValue(field, value)}
                      placeholder={field}
                      triggerStyle={localStyles.select}
                    />
                  ) : isPhone ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={selectedDdd ? `DDD ${selectedDdd}, alterar` : 'Selecionar DDD'}
                        accessibilityState={{ expanded: dddPickerVisible }}
                        onPress={() => setDddPickerVisible(true)}
                        style={{
                          height: 50,
                          minWidth: 96,
                          borderRadius: 8,
                          backgroundColor: '#fff',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 10,
                        }}
                      >
                        <Text style={{ color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 }}>
                          {selectedDdd ? `+55 (${selectedDdd})` : 'DDD'}
                        </Text>
                      </Pressable>
                      <TextInput
                        accessibilityLabel="Telefone sem DDD"
                        placeholder="Número"
                        placeholderTextColor={BLUE}
                        style={[localStyles.input, { flex: 1, minWidth: 0, paddingHorizontal: 8 }]}
                        value={values[field] ?? ''}
                        onChangeText={value => updateValue(field, value)}
                        keyboardType="phone-pad"
                        autoComplete="off"
                        maxLength={10}
                      />
                    </View>
                  ) : (
                    <TextInput
                      placeholder={isBirthDate ? 'DD/MM/AAAA' : isGuardianCode ? 'Código do responsável' : field}
                      placeholderTextColor={BLUE}
                      secureTextEntry={isPassword}
                      style={localStyles.input}
                      value={values[field] ?? ''}
                      onChangeText={value => updateValue(field, value)}
                      keyboardType={isBirthDate || isDocument ? 'numeric' : normalizedField.includes('email') ? 'email-address' : 'default'}
                      autoCapitalize={isPassword || isEmail ? 'none' : 'sentences'}
                      autoCorrect={false}
                      autoComplete={isPassword ? 'new-password' : isEmail ? 'email' : 'off'}
                      textContentType={isPassword ? 'newPassword' : undefined}
                      maxLength={isBirthDate ? 10 : isDocument ? (normalizedField.includes('cnpj') ? 18 : 14) : undefined}
                    />
                  )}
                  {isPassword && !isPasswordConfirmation && passwordValue.length > 0 && !hasStrongPassword && (
                    <View style={{ borderRadius: 8, backgroundColor: '#fff', padding: 12 }}>
                      <Text style={{ color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 }}>
                        Use pelo menos 8 caracteres, com maiúscula, minúscula, número e um símbolo (como !).
                      </Text>
                    </View>
                  )}
                  {isPhone && (
                    <DddPicker
                      visible={dddPickerVisible}
                      selectedDdd={selectedDdd}
                      onSelect={ddd => {
                        setSelectedDdd(ddd)
                        setDddPickerVisible(false)
                      }}
                      onClose={() => setDddPickerVisible(false)}
                    />
                  )}
                  {isBirthDate && minor && (
                    <Feedback status="info">
                      Atleta menor de 18 anos: será necessário vincular um responsável legal.
                    </Feedback>
                  )}
                  {isBirthDate && birthDateInput.length > 0 && !birthDate && (
                    <Feedback status="error">
                      Informe uma data válida no formato DD/MM/AAAA.
                    </Feedback>
                  )}
                </React.Fragment>
              )
            })}
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedPrivacy }}
            onPress={() => {
              setAcceptedPrivacy(value => !value)
              setFeedback(null)
            }}
            style={localStyles.privacyRow}
          >
            <View style={[localStyles.checkbox, acceptedPrivacy && localStyles.checkboxChecked]}>
              {acceptedPrivacy ? <Text style={localStyles.checkMark}>✓</Text> : null}
            </View>
            <Text style={localStyles.privacyText}>Aceito as políticas de Privacidade</Text>
          </Pressable>
          {feedback && <Feedback status={feedback.status}>{feedback.message}</Feedback>}
          <View style={localStyles.actions}>
            <Button onPress={register} disabled={loading || googleLoading}>
              {googleLoading ? 'Conectando...' : loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          {!googleSignup && isGoogleLoginConfigured() && (
            <View>
              <GoogleLoginButton
                repositories={repositories}
                variant="signup"
                label="Cadastrar com Google"
                onPendingSignup={(params) => go(GOOGLE_SIGNUP_ROUTES[userType], { googleSignup: true, ...params })}
                onFeedback={setFeedback}
                onLoading={setGoogleLoading}
              />
            </View>
          )}
          {isAthlete && (
          <Pressable onPress={() => go('signupResponsible')}>
            <Text style={localStyles.minorLink}>Cadastro de responsável</Text>
          </Pressable>
          )}
          </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function optionsForField(field) {
  const normalized = field.toLowerCase()
  if (normalized.includes('tipo:')) return SELECT_OPTIONS.tipoInstituicao
  if (normalized.includes('localiza')) return SELECT_OPTIONS.locais
  if (normalized.includes('parentesco')) return SELECT_OPTIONS.parentescos
  return null
}

const localStyles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: BLUE,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 30, 5, .08)',
  },
  safe: {
    flex: 1,
    minHeight: 0,
  },
  monogram: {
    position: 'absolute',
    zIndex: 2,
    width: 51,
    height: 56,
    top: 36,
    alignSelf: 'center',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  signupWrap: {
    flexGrow: 1,
    flexShrink: 0,
    paddingHorizontal: 30,
    paddingTop: 112,
    paddingBottom: 110,
  },
  signupWrapCompact: {
    paddingTop: 104,
    paddingBottom: 92,
  },
  title: {
    color: '#ffffff',
    fontFamily: 'Griffiths',
    fontSize: 40,
    lineHeight: 54,
    fontWeight: '400',
    marginBottom: 50,
    textAlign: 'center',
  },
  titleCompact: {
    marginBottom: 24,
  },
  titleTwoLine: {
    lineHeight: 42,
    marginBottom: 12,
  },
  accent: {
    color: '#b6ff38',
  },
  fields: {
    gap: 20,
  },
  fieldsCompact: {
    gap: 11,
  },
  input: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  select: {
    minHeight: 50,
    height: 50,
    borderWidth: 0,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 11,
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
  privacyText: {
    color: '#ffffff',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    gap: 7,
  },
  minorLink: {
    color: '#ffffff',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
})
