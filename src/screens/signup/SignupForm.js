import React, { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Button } from '../../components/ui/Button'
import { Shell } from '../../components/ui/Shell'
import { BLUE } from '../../theme/colors'
import { USER_TYPES, calculateAge, isMinor } from '../../domain/contracts.js'
import { styles } from '../../theme/styles'

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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.55)', padding: 24 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar seleção de DDD"
          onPress={onClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View style={{ maxHeight: '78%', borderRadius: 12, backgroundColor: '#fff', padding: 18 }}>
          <Text style={{ color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 18, marginBottom: 10 }}>
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
                <Text style={{ color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 16 }}>
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
  return field.toLowerCase().includes('(opcional)')
}

export function SignupForm({ config, go, back, repositories }) {
  const { accent, background, fields, isAthlete = false, userType } = config
  const [values, setValues] = useState({})
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [selectedDdd, setSelectedDdd] = useState('')
  const [dddPickerVisible, setDddPickerVisible] = useState(false)
  const birthDateField = fields.find(field => field === 'Data de nascimento')
  const birthDateInput = birthDateField ? values[birthDateField] ?? '' : ''
  const birthDate = isAthlete ? parseBirthDate(birthDateInput) : null
  const age = birthDate ? calculateAge(birthDate) : null
  const minor = birthDate ? isMinor(birthDate) : false
  const passwordField = fields.find(field => field.toLowerCase().includes('senha') && !field.toLowerCase().includes('confirme'))
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

    const emailField = fields.find(field => field.toLowerCase().includes('email'))
    const confirmationField = fields.find(field => field.toLowerCase().includes('confirme'))
    const nameField = fields.find(field => field.toLowerCase().includes('nome'))
    const phoneField = fields.find(field => field.toLowerCase().includes('telefone'))
    const documentField = fields.find(field => /cpf|cnpj/i.test(field))
    const locationField = fields.find(field => field.toLowerCase().includes('localiza'))
    const relationshipField = fields.find(field => field.toLowerCase().includes('parentesco'))
    const email = values[emailField]?.trim() ?? ''
    const password = values[passwordField] ?? ''
    const passwordConfirmation = values[confirmationField] ?? ''

    const missingField = fields.find((field) => {
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

    if (!password || password !== passwordConfirmation) {
      setFeedback({ status: 'error', message: 'As senhas são obrigatórias e precisam ser iguais.' })
      return
    }

    if (!hasStrongPassword) {
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

    if (isAthlete && minor) {
      setFeedback({
        status: 'error',
        message: 'Para proteger atletas menores, a criação da conta aguarda o vínculo confirmado do responsável legal.',
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
      ? { dataNascimento: birthDate, modalidade: '' }
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
      const result = await repositories.authentication.cadastrar(email, password, userType, {
        nome: values[nameField]?.trim() ?? '',
        telefone: phoneDigits ? formatPhone(selectedDdd, phoneValue) : undefined,
        perfil: profile,
      })

      if (!result.ok) {
        setFeedback({ status: 'error', message: result.mensagem })
        return
      }

      const message = userType === USER_TYPES.GUARDIAN
        ? 'Conta de responsável criada. O vínculo com o atleta será concluído quando o fluxo estiver disponível.'
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
    <Shell background={background} back={back} logo>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={[styles.signupWrap, { flexShrink: 0 }]}>
          <Text style={styles.signupTitle}>Cadastro<Text style={styles.signupAccent}>{accent}</Text></Text>
          <View style={styles.signupFields}>
            {fields.map(field => {
              const isBirthDate = field === birthDateField
              const normalizedField = field.toLowerCase()
              const isPassword = normalizedField.includes('senha')
              const isPasswordConfirmation = normalizedField.includes('confirme')
              const isPhone = normalizedField.includes('telefone')
              const isDocument = /cpf|cnpj/i.test(field)
              const isEmail = normalizedField.includes('email')

              return (
                <React.Fragment key={field}>
                  {isPhone ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={selectedDdd ? `DDD ${selectedDdd}, alterar` : 'Selecionar DDD'}
                        accessibilityState={{ expanded: dddPickerVisible }}
                        onPress={() => setDddPickerVisible(true)}
                        style={{
                          height: 53,
                          minWidth: 96,
                          borderRadius: 8,
                          backgroundColor: '#fff',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 10,
                        }}
                      >
                        <Text style={{ color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 14 }}>
                          {selectedDdd ? `+55 (${selectedDdd})` : 'DDD'}
                        </Text>
                      </Pressable>
                      <TextInput
                        accessibilityLabel="Telefone sem DDD"
                        placeholder="Número"
                        placeholderTextColor={BLUE}
                        style={[styles.signupInput, { flex: 1, minWidth: 0, paddingHorizontal: 8, fontSize: 14 }]}
                        value={values[field] ?? ''}
                        onChangeText={value => updateValue(field, value)}
                        keyboardType="phone-pad"
                        autoComplete="off"
                        maxLength={10}
                      />
                    </View>
                  ) : (
                    <TextInput
                      placeholder={isBirthDate ? 'Data de nascimento (DD/MM/AAAA)' : field}
                      placeholderTextColor={BLUE}
                      secureTextEntry={isPassword}
                      style={styles.signupInput}
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
                      <Text style={{ color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 12 }}>
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
          >
            <Text style={styles.privacy}>{acceptedPrivacy ? '☑' : '□'}  Aceito as políticas de Privacidade</Text>
          </Pressable>
          {feedback && <Feedback status={feedback.status}>{feedback.message}</Feedback>}
          <Button onPress={register} disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>
          {isAthlete && (
          <Pressable onPress={() => go('signupResponsible')}>
            <Text style={styles.minorLink}>Cadastro de responsável</Text>
          </Pressable>
          )}
        </View>
      </ScrollView>
    </Shell>
  )
}
