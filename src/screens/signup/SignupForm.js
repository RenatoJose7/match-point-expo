import React, { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Button } from '../../components/ui/Button'
import { Shell } from '../../components/ui/Shell'
import { BLUE } from '../../theme/colors'
import { styles } from '../../theme/styles'
import { calculateAge, isMinor } from '../../domain/contracts.js'

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

export function SignupForm({ config, go, back }) {
  const { accent, background, fields, isAthlete = false, next } = config
  const [birthDateInput, setBirthDateInput] = useState('')
  const [attemptedContinue, setAttemptedContinue] = useState(false)
  const birthDate = isAthlete ? parseBirthDate(birthDateInput) : null
  const age = birthDate ? calculateAge(birthDate) : null
  const minor = birthDate ? isMinor(birthDate) : false

  const continueSignup = () => {
    if (isAthlete && age === null) {
      setAttemptedContinue(true)
      return
    }

    go(next)
  }

  return (
    <Shell background={background} back={back} logo>
      <View style={styles.signupWrap}>
        <Text style={styles.signupTitle}>Cadastro<Text style={styles.signupAccent}>{accent}</Text></Text>
        <View style={styles.signupFields}>
          {fields.map(field => {
            const isBirthDate = isAthlete && field === 'Data de nascimento'

            return (
              <React.Fragment key={field}>
                <TextInput
                  placeholder={isBirthDate ? 'Data de nascimento (DD/MM/AAAA)' : field}
                  placeholderTextColor={BLUE}
                  secureTextEntry={field.toLowerCase().includes('senha')}
                  style={styles.signupInput}
                  value={isBirthDate ? birthDateInput : undefined}
                  onChangeText={isBirthDate ? value => setBirthDateInput(formatBirthDate(value)) : undefined}
                  keyboardType={isBirthDate ? 'numeric' : 'default'}
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
                {isBirthDate && attemptedContinue && !birthDateInput && (
                  <Text style={{ color: '#b42318', fontFamily: 'Poppins_400Regular' }}>
                    Informe sua data de nascimento para continuar.
                  </Text>
                )}
              </React.Fragment>
            )
          })}
        </View>
        <Pressable onPress={() => isAthlete && go('signupResponsible')}>
          <Text style={styles.privacy}>□  Aceito as políticas de Privacidade</Text>
        </Pressable>
        <Button onPress={continueSignup}>Entrar</Button>
        {isAthlete && (
          <Pressable onPress={() => go('signupResponsible')}>
            <Text style={styles.minorLink}>Cadastro de responsável</Text>
          </Pressable>
        )}
      </View>
    </Shell>
  )
}
