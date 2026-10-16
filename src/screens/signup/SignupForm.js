import React, { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Button } from '../../components/ui/Button'
import { Shell } from '../../components/ui/Shell'
import { BLUE } from '../../theme/colors'
import { USER_TYPES, calculateAge, isMinor } from '../../domain/contracts.js'
import { styles } from '../../theme/styles'

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

function Feedback({ status, children }) {
  const color = status === 'error' ? '#b42318' : '#126b35'

  return (
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color, fontFamily: 'Poppins_400Regular', marginVertical: 8 }}>
      {children}
    </Text>
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
  const birthDateField = fields.find(field => field === 'Data de nascimento')
  const birthDateInput = birthDateField ? values[birthDateField] ?? '' : ''
  const birthDate = isAthlete ? parseBirthDate(birthDateInput) : null
  const age = birthDate ? calculateAge(birthDate) : null
  const minor = birthDate ? isMinor(birthDate) : false

  const updateValue = (field, value) => {
    setValues(current => ({ ...current, [field]: field === birthDateField ? formatBirthDate(value) : value }))
    setFeedback(null)
  }

  const register = async () => {
    if (loading) return

    const emailField = fields.find(field => field.toLowerCase().includes('email'))
    const passwordField = fields.find(field => field.toLowerCase().includes('senha') && !field.toLowerCase().includes('confirme'))
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
            documento: values[documentField]?.trim() || undefined,
            telefone: values[phoneField]?.trim() || undefined,
          }
        : {
            tipo: userType,
            nomeExibicao: values[nameField]?.trim() ?? '',
            documento: values[documentField]?.trim() || undefined,
            localizacao: values[locationField]?.trim() || undefined,
            verificado: false,
          }

    try {
      const result = await repositories.authentication.cadastrar(email, password, userType, {
        nome: values[nameField]?.trim() ?? '',
        telefone: values[phoneField]?.trim() ?? undefined,
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

              return (
                <React.Fragment key={field}>
                  <TextInput
                    placeholder={isBirthDate ? 'Data de nascimento (DD/MM/AAAA)' : field}
                    placeholderTextColor={BLUE}
                    secureTextEntry={isPassword}
                    style={styles.signupInput}
                    value={values[field] ?? ''}
                    onChangeText={value => updateValue(field, value)}
                    keyboardType={isBirthDate ? 'numeric' : normalizedField.includes('email') ? 'email-address' : 'default'}
                    autoCapitalize={isPassword || normalizedField.includes('email') ? 'none' : 'sentences'}
                    maxLength={isBirthDate ? 10 : undefined}
                  />
                  {isBirthDate && birthDate && age !== null && (
                    <Text style={{ color: BLUE, fontFamily: 'Poppins_400Regular' }}>
                      Idade calculada: {age} anos.
                    </Text>
                  )}
                  {isBirthDate && minor && (
                    <Text style={{ color: '#126b35', fontFamily: 'Poppins_500Medium' }}>
                      Atleta menor de 18 anos: será necessário vincular um responsável legal.
                    </Text>
                  )}
                  {isBirthDate && birthDateInput.length > 0 && !birthDate && (
                    <Text style={{ color: '#b42318', fontFamily: 'Poppins_400Regular' }}>
                      Informe uma data válida no formato DD/MM/AAAA.
                    </Text>
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
