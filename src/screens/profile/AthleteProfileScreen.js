import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BackButton } from '../../components/ui/BackButton'
import { BottomNav } from '../../components/navigation/BottomNav'
import { Button } from '../../components/ui/Button'
import { BLUE } from '../../theme/colors'

const fields = [
  { key: 'modalidade', label: 'Modalidade', required: true },
  { key: 'categoria', label: 'Categoria' },
  { key: 'posicao', label: 'Posição' },
  { key: 'maoDominante', label: 'Mão dominante' },
  { key: 'equipeAtual', label: 'Equipe atual' },
  { key: 'tempoDePratica', label: 'Tempo de prática' },
  { key: 'localizacao', label: 'Localização' },
  { key: 'biografia', label: 'Sobre você', multiline: true },
  { key: 'ranking', label: 'Ranking' },
  { key: 'torneiosDisputados', label: 'Torneios disputados' },
  { key: 'titulos', label: 'Títulos' },
]

function emptyValues() {
  return Object.fromEntries(fields.map(({ key }) => [key, '']))
}

function profileValues(profile) {
  return Object.fromEntries(fields.map(({ key }) => [key, String(profile?.[key] ?? '')]))
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= new Date()
}

function formatDate(value) {
  if (!value || !isValidIsoDate(value)) return 'Não informada'
  return value.split('-').reverse().join('/')
}

export function AthleteProfileScreen(props) {
  const { back, go, repositories, session } = props
  const [profile, setProfile] = useState(null)
  const [values, setValues] = useState(emptyValues)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      setLoading(true)
      setError('')
      setNotice('')

      if (!session?.id) {
        setError('Não foi possível identificar a sessão do atleta.')
        setLoading(false)
        return
      }

      try {
        const result = await repositories.users.obterPerfilAtletaPorUsuario(session.id)
        if (!active) return

        if (!result.ok && result.codigo === 'NAO_ENCONTRADO') {
          setProfile(null)
          setValues(emptyValues())
          setBirthDate('')
          setEditing(true)
          return
        }

        if (!result.ok) {
          setError(result.mensagem || 'Não foi possível carregar seu perfil esportivo.')
          return
        }

        setProfile(result.data)
        setValues(profileValues(result.data))
        setBirthDate(result.data.dataNascimento ?? '')
        setEditing(false)
      } catch {
        if (active) setError('Não foi possível carregar seu perfil esportivo. Tente novamente.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()
    return () => { active = false }
  }, [repositories, session?.id, retryToken])

  const updateField = (key, value) => {
    setValues(current => ({ ...current, [key]: value }))
    setError('')
    setNotice('')
  }

  const saveProfile = async () => {
    if (saving) return

    const normalizedValues = Object.fromEntries(
      fields.map(({ key }) => [key, values[key].trim()]),
    )
    const dateOfBirth = profile?.dataNascimento ?? birthDate.trim()

    if (!dateOfBirth || !isValidIsoDate(dateOfBirth)) {
      setError('Informe uma data de nascimento válida no formato AAAA-MM-DD.')
      return
    }
    if (!normalizedValues.modalidade) {
      setError('Informe a modalidade esportiva.')
      return
    }

    const data = {
      ...normalizedValues,
      dataNascimento: dateOfBirth,
      perfilCompleto: Boolean(dateOfBirth && normalizedValues.modalidade),
      atualizadoEm: new Date().toISOString(),
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      const result = profile
        ? await repositories.users.atualizarPerfilAtleta(profile.id, data)
        : await repositories.users.criarPerfilAtleta(session.id, data)

      if (!result.ok) {
        setError(result.mensagem || 'Não foi possível salvar seu perfil esportivo.')
        return
      }

      setProfile(result.data)
      setValues(profileValues(result.data))
      setBirthDate(result.data.dataNascimento ?? dateOfBirth)
      setEditing(false)
      setNotice('Perfil esportivo salvo.')
    } catch {
      setError('Não foi possível salvar seu perfil esportivo. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const cancelEditing = () => {
    setValues(profileValues(profile))
    setBirthDate(profile?.dataNascimento ?? '')
    setError('')
    setNotice('')
    setEditing(false)
  }

  return (
    <View style={localStyles.screen}>
      <View style={localStyles.header}>
        <BackButton onPress={back} />
        <View style={localStyles.headerCopy}>
          <Text style={localStyles.title}>Perfil esportivo</Text>
          <Text style={localStyles.name}>{session?.nome || 'Atleta'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={localStyles.centerState}>
          <Text style={localStyles.stateText}>Carregando perfil...</Text>
        </View>
      ) : error && !editing ? (
        <View style={localStyles.centerState}>
          <Text accessibilityRole="alert" style={localStyles.errorText}>{error}</Text>
          <Button wide onPress={() => setRetryToken(value => value + 1)}>Tentar novamente</Button>
        </View>
      ) : editing ? (
        <ScrollView contentContainerStyle={localStyles.content} keyboardShouldPersistTaps="handled">
          {!profile && (
            <View style={localStyles.fieldGroup}>
              <Text style={localStyles.fieldLabel}>Data de nascimento</Text>
              <TextInput
                accessibilityLabel="Data de nascimento"
                autoCapitalize="none"
                onChangeText={setBirthDate}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#6a7d86"
                style={localStyles.input}
                value={birthDate}
              />
            </View>
          )}

          {fields.map(({ key, label, multiline, required }) => (
            <View key={key} style={localStyles.fieldGroup}>
              <Text style={localStyles.fieldLabel}>{label}{required ? ' *' : ''}</Text>
              <TextInput
                accessibilityLabel={label}
                autoCapitalize="sentences"
                multiline={multiline}
                onChangeText={value => updateField(key, value)}
                placeholder={label}
                placeholderTextColor="#6a7d86"
                style={[localStyles.input, multiline && localStyles.multilineInput]}
                value={values[key]}
              />
            </View>
          ))}

          {!!error && <Text accessibilityRole="alert" style={localStyles.errorText}>{error}</Text>}
          {!!notice && <Text accessibilityRole="alert" style={localStyles.successText}>{notice}</Text>}
          <Button wide disabled={saving} onPress={saveProfile}>
            {saving ? 'Salvando...' : 'Salvar perfil'}
          </Button>
          {!!profile && (
            <Pressable accessibilityRole="button" onPress={cancelEditing} style={localStyles.secondaryAction}>
              <Text style={localStyles.secondaryActionText}>Cancelar edição</Text>
            </Pressable>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={localStyles.content}>
          <View style={localStyles.summary}>
            <Text style={localStyles.summaryLabel}>Data de nascimento</Text>
            <Text style={localStyles.summaryValue}>{formatDate(profile?.dataNascimento)}</Text>
          </View>
          {fields.map(({ key, label }) => (
            <View key={key} style={localStyles.summary}>
              <Text style={localStyles.summaryLabel}>{label}</Text>
              <Text style={localStyles.summaryValue}>{profile?.[key] || 'Não informado'}</Text>
            </View>
          ))}

          {!!notice && <Text accessibilityRole="alert" style={localStyles.successText}>{notice}</Text>}
          <Button wide onPress={() => setEditing(true)}>Editar perfil</Button>
        </ScrollView>
      )}

      <BottomNav go={go} role="athlete" active="profile" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f8f7' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, backgroundColor: '#ffffff' },
  headerCopy: { marginTop: 12, gap: 2 },
  title: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 20 },
  name: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 14 },
  content: { gap: 10, padding: 20, paddingBottom: 28 },
  fieldGroup: { gap: 5 },
  fieldLabel: { color: '#344b55', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  input: {
    minHeight: 46,
    borderColor: '#c8d5d8',
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    color: '#17313c',
    fontFamily: 'Poppins_400Regular',
    paddingHorizontal: 12,
  },
  multilineInput: { minHeight: 96, paddingTop: 10, textAlignVertical: 'top' },
  summary: { borderBottomColor: '#d8e1e3', borderBottomWidth: 1, gap: 3, paddingVertical: 9 },
  summaryLabel: { color: '#65777e', fontFamily: 'Poppins_400Regular', fontSize: 12 },
  summaryValue: { color: '#17313c', fontFamily: 'Poppins_500Medium', fontSize: 15 },
  centerState: { flex: 1, justifyContent: 'center', gap: 16, padding: 24 },
  stateText: { color: '#526770', fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  errorText: { color: '#b42318', fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  successText: { color: '#126b35', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  secondaryAction: { alignItems: 'center', padding: 12 },
  secondaryActionText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 14 },
})
