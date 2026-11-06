import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BackButton } from '../../components/ui/BackButton'
import { BottomNav } from '../../components/navigation/BottomNav'
import { ProfilePhotoPicker } from '../../components/profile/ProfilePhotoPicker'
import { DeleteAccountSection } from '../../components/profile/DeleteAccountSection'
import { Button } from '../../components/ui/Button'
import { SelectField, SELECT_OPTIONS } from '../../components/ui/SelectField'
import { BLUE } from '../../theme/colors'
import { assets } from '../../theme/assets'

const fields = [
  { key: 'modalidade', label: 'Modalidade', options: SELECT_OPTIONS.modalidades, required: true },
  { key: 'categoria', label: 'Categoria', options: SELECT_OPTIONS.categorias },
  { key: 'posicao', label: 'Posição', options: SELECT_OPTIONS.posicoes },
  { key: 'maoDominante', label: 'Mão dominante', options: SELECT_OPTIONS.maoDominante },
  { key: 'equipeAtual', label: 'Equipe atual' },
  { key: 'tempoDePratica', label: 'Tempo de prática', options: SELECT_OPTIONS.tempoDePratica },
  { key: 'localizacao', label: 'Localização', options: SELECT_OPTIONS.locais },
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

function calculateAge(value) {
  if (!value || !isValidIsoDate(value)) return null

  const [year, month, day] = value.split('-').map(Number)
  const today = new Date()
  const birthdayHasPassed = today.getMonth() + 1 > month
    || (today.getMonth() + 1 === month && today.getDate() >= day)

  return today.getFullYear() - year - (birthdayHasPassed ? 0 : 1)
}

function displayValue(value, suffix = '') {
  if (value === null || value === undefined || String(value).trim() === '') return 'Não informado'
  return `${value}${suffix}`
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
        <Image source={assets.monogram} style={localStyles.headerMark} resizeMode="contain" />
        <View style={localStyles.identity}>
          <View style={localStyles.identityCopy}>
            <Text numberOfLines={2} style={localStyles.name}>{session?.nome || 'Atleta'}</Text>
            <Text style={localStyles.role}>Atleta</Text>
          </View>
          {!editing && !loading ? <Pressable accessibilityRole="button" accessibilityLabel="Editar perfil" onPress={() => setEditing(true)} style={localStyles.headerEditButton}><Text style={localStyles.headerEditText}>Editar perfil</Text></Pressable> : null}
        </View>
      </View>

      <View style={localStyles.body}>
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
            <ProfilePhotoPicker repositories={repositories} session={session} size={78} />
            <Text style={localStyles.sectionTitle}>Informações esportivas</Text>
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

            {fields.map(({ key, label, multiline, options, required }) => (
              <View key={key} style={localStyles.fieldGroup}>
                <Text style={localStyles.fieldLabel}>{label}{required ? ' *' : ''}</Text>
                {options ? (
                  <SelectField accessibilityLabel={label} options={options} value={values[key]} onChange={value => updateField(key, value)} placeholder={`Selecione ${label.toLowerCase()}`} />
                ) : (
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
                )}
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
            <DeleteAccountSection repositories={repositories} />
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={localStyles.content}>
            <ProfilePhotoPicker repositories={repositories} session={session} size={78} />
            <Text style={localStyles.sectionTitle}>Informações esportivas</Text>
            <View style={localStyles.infoGrid}>
            <View style={localStyles.infoCard}>
              <Text style={localStyles.infoLabel}>Categoria</Text>
              <Text style={localStyles.infoValue}>{displayValue(profile?.categoria)}</Text>
            </View>
            <View style={localStyles.infoCard}>
              <Text style={localStyles.infoLabel}>Idade</Text>
              <Text style={localStyles.infoValue}>{displayValue(calculateAge(profile?.dataNascimento), ' anos')}</Text>
            </View>
            <View style={localStyles.infoCard}>
              <Text style={localStyles.infoLabel}>Localização</Text>
              <Text style={localStyles.infoValue}>{displayValue(profile?.localizacao)}</Text>
            </View>
            <View style={localStyles.infoCard}>
              <Text style={localStyles.infoLabel}>Torneios disputados</Text>
              <Text style={localStyles.infoValue}>{displayValue(profile?.torneiosDisputados, ' torneios')}</Text>
            </View>
            </View>

            <View style={localStyles.aboutCard}>
            <Text style={localStyles.aboutTitle}>Sobre mim</Text>
            <Text style={localStyles.aboutText}>{displayValue(profile?.biografia)}</Text>
            </View>

            <View style={localStyles.statsGrid}>
            <View style={localStyles.statCard}>
              <Text style={localStyles.statLabel}>Ranking MatchPoint</Text>
              <Text style={localStyles.statValue}>{displayValue(profile?.ranking, 'º')}</Text>
            </View>
            <View style={localStyles.statCard}>
              <Text style={localStyles.statLabel}>Torneios disputados</Text>
              <Text style={localStyles.statValue}>{displayValue(profile?.torneiosDisputados)}</Text>
            </View>
            <View style={localStyles.statCard}>
              <Text style={localStyles.statLabel}>Títulos</Text>
              <Text style={localStyles.statValue}>{displayValue(profile?.titulos)}</Text>
            </View>
            </View>

            <View style={localStyles.additionalInfo}>
            <Text style={localStyles.additionalInfoText}>Modalidade: {displayValue(profile?.modalidade)}</Text>
            <Text style={localStyles.additionalInfoText}>Posição: {displayValue(profile?.posicao)}</Text>
            <Text style={localStyles.additionalInfoText}>Mão dominante: {displayValue(profile?.maoDominante)}</Text>
            <Text style={localStyles.additionalInfoText}>Equipe atual: {displayValue(profile?.equipeAtual)}</Text>
            <Text style={localStyles.additionalInfoText}>Tempo de prática: {displayValue(profile?.tempoDePratica)}</Text>
            <Text style={localStyles.additionalInfoText}>Nascimento: {formatDate(profile?.dataNascimento)}</Text>
            </View>

            {!!notice && <Text accessibilityRole="alert" style={localStyles.successText}>{notice}</Text>}
            <Pressable accessibilityRole="button" onPress={() => go('operations')} style={localStyles.secondaryAction}>
              <Text style={localStyles.secondaryActionText}>Enviar relato ou sugestão</Text>
            </Pressable>
            <DeleteAccountSection repositories={repositories} />
          </ScrollView>
        )}
      </View>

      <BottomNav go={go} role="athlete" active="profile" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },
  header: { height: 159, backgroundColor: BLUE },
  headerMark: { position: 'absolute', top: 7, alignSelf: 'center', width: 56, height: 61 },
  identity: { position: 'absolute', left: 20, right: 18, bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  identityCopy: { flex: 1 },
  name: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 22 },
  role: { color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 22 },
  headerEditButton: { minHeight: 34, borderRadius: 18, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#c4ff32' },
  headerEditText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  body: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  content: { gap: 10, paddingHorizontal: 20, paddingTop: 27, paddingBottom: 116 },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginTop: 8, marginBottom: 4 },
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
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  multilineInput: { minHeight: 96, paddingTop: 10, textAlignVertical: 'top' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoCard: { backgroundColor: '#ffffff', borderColor: '#dfe5e7', borderRadius: 7, borderWidth: 1, elevation: 1, flexGrow: 1, flexBasis: '47%', gap: 6, minHeight: 74, padding: 13, shadowColor: '#17313c', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  infoLabel: { color: '#6f747a', fontFamily: 'Poppins_400Regular', fontSize: 13 },
  infoValue: { color: '#0f4c8f', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  aboutCard: { backgroundColor: '#ffffff', borderColor: '#e1e5e5', borderRadius: 7, borderWidth: 1, gap: 10, padding: 15 },
  aboutTitle: { color: '#174b8c', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  aboutText: { color: '#59626b', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  statCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1e5e5', borderRadius: 6, borderWidth: 1, flexBasis: '47%', flexGrow: 1, gap: 3, minHeight: 76, justifyContent: 'center', padding: 10 },
  statLabel: { color: '#174b8c', fontFamily: 'Poppins_600SemiBold', fontSize: 13, textAlign: 'center' },
  statValue: { color: '#174b8c', fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 31 },
  additionalInfo: { backgroundColor: '#ffffff', borderColor: '#e1e5e5', borderRadius: 7, borderWidth: 1, gap: 5, padding: 14 },
  additionalInfoText: { color: '#59626b', fontFamily: 'Poppins_400Regular', fontSize: 13 },
  centerState: { flex: 1, justifyContent: 'center', gap: 16, padding: 24 },
  stateText: { color: '#526770', fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  errorText: { color: '#b42318', fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  successText: { color: '#126b35', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  secondaryAction: { alignItems: 'center', padding: 12 },
  secondaryActionText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13 },
})
