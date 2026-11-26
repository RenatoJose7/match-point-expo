import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text, TextInput } from '../../components/accessibility/AppText'
import { BackButton } from '../../components/ui/BackButton'
import { ACCESSIBILITY_CORNER, AccessibilityButton } from '../../components/accessibility/AccessibilityButton'
import { BottomNav } from '../../components/navigation/BottomNav'
import { ProfilePhotoPicker } from '../../components/profile/ProfilePhotoPicker'
import { DeleteAccountSection } from '../../components/profile/DeleteAccountSection'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/SelectField'
import { ChoiceChips } from '../../components/ui/ChoiceChips'
import { NumberStepper } from '../../components/ui/NumberStepper'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { BLUE } from '../../theme/colors'
import { dateInputValue, formatDateInput, toIsoDate } from '../partner/partnerOpportunityUi'
import { ATHLETE_SECTIONS, athleteCompletion, athleteFormValues, athleteSaveData, displayText } from './athleteProfileFields'

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

// Um campo do formulário, conforme o tipo (lista, múltipla escolha, número ou texto curto).
function ProfileField({ field, value, onChange }) {
  if (field.type === 'select') {
    return <SelectField accessibilityLabel={field.label} options={field.options} value={value} onChange={onChange} placeholder={`Selecione ${field.label.toLowerCase()}`} allowCustom={field.allowCustom} />
  }
  if (field.type === 'chips') return <ChoiceChips label={field.label} options={field.options} value={value} onChange={onChange} />
  if (field.type === 'number') return <NumberStepper label={field.label} value={value} onChange={onChange} />
  const length = String(value ?? '').length
  return (
    <>
      <TextInput
        accessibilityLabel={field.label}
        autoCapitalize="sentences"
        multiline={field.multiline}
        maxLength={field.maxLength}
        onChangeText={onChange}
        placeholder={field.placeholder || field.label}
        placeholderTextColor="#6a7d86"
        style={[localStyles.input, field.multiline && localStyles.multilineInput]}
        value={value}
      />
      {field.maxLength ? <Text style={localStyles.counter}>{length}/{field.maxLength}</Text> : null}
    </>
  )
}

function InfoRow({ label, value }) {
  return (
    <View style={localStyles.infoRow}>
      <Text style={localStyles.infoRowLabel}>{label}</Text>
      <Text style={localStyles.infoRowValue}>{value}</Text>
    </View>
  )
}

export function AthleteProfileScreen(props) {
  const { back, go, repositories, session } = props
  const [profile, setProfile] = useState(null)
  const [values, setValues] = useState(() => athleteFormValues({}))
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
          setValues(athleteFormValues({}))
          setBirthDate('')
          setEditing(true)
          return
        }

        if (!result.ok) {
          setError(result.mensagem || 'Não foi possível carregar seu perfil esportivo.')
          return
        }

        setProfile(result.data)
        setValues(athleteFormValues(result.data))
        setBirthDate(dateInputValue(result.data.dataNascimento))
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

    const dateOfBirth = profile?.dataNascimento ?? (toIsoDate(birthDate) ?? '').slice(0, 10)
    if (!dateOfBirth || !isValidIsoDate(dateOfBirth)) {
      setError('Informe uma data de nascimento válida no formato DD/MM/AAAA.')
      return
    }
    const fieldsData = athleteSaveData(values)
    if (!fieldsData.modalidade) {
      setError('Escolha a modalidade esportiva.')
      return
    }

    const data = {
      ...fieldsData,
      // Mantém o nome no perfil esportivo (é o que o responsável vê na lista de vinculados).
      ...(session?.nome ? { nome: session.nome } : {}),
      dataNascimento: dateOfBirth,
      perfilCompleto: Boolean(dateOfBirth && fieldsData.modalidade),
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
      setValues(athleteFormValues(result.data))
      setBirthDate(dateInputValue(result.data.dataNascimento ?? dateOfBirth))
      setEditing(false)
      setNotice('Perfil esportivo salvo.')
    } catch {
      setError('Não foi possível salvar seu perfil esportivo. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const cancelEditing = () => {
    setValues(athleteFormValues(profile))
    setBirthDate(dateInputValue(profile?.dataNascimento))
    setError('')
    setNotice('')
    setEditing(false)
  }

  // Sair da edição com alterações não salvas pede confirmação, para ninguém perder o que preencheu.
  const hasUnsavedChanges = editing && Boolean(profile) && JSON.stringify(values) !== JSON.stringify(athleteFormValues(profile))
  const leave = () => {
    if (!hasUnsavedChanges) { back(); return }
    Alert.alert('Descartar alterações?', 'Você mudou o perfil e ainda não salvou.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: back },
    ])
  }

  const completion = athleteCompletion(profile) ?? 0
  const level = profile?.nivelCompetitivo || profile?.ranking

  return (
    <View style={localStyles.screen}>
      <View style={localStyles.header}>
        <View style={localStyles.headerStripe} />
        <BackButton onPress={leave} />
        <AccessibilityButton style={ACCESSIBILITY_CORNER} />
        <View style={localStyles.identity}>
          <ProfilePhotoPicker compact repositories={repositories} session={session} size={58} />
          <View style={localStyles.identityCopy}>
            <Text numberOfLines={2} style={localStyles.name}>{session?.nome || 'Atleta'}</Text>
            <Text style={localStyles.role}>Atleta</Text>
          </View>
        </View>
        {!editing && !loading ? <Pressable accessibilityRole="button" accessibilityLabel="Editar perfil" onPress={() => setEditing(true)} style={localStyles.headerEditButton}><Text style={localStyles.headerEditText}>Editar perfil</Text></Pressable> : null}
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={localStyles.content} keyboardShouldPersistTaps="handled">
            {!profile && (
              <View style={localStyles.fieldGroup}>
                <Text style={localStyles.fieldLabel}>Data de nascimento *</Text>
                <TextInput
                  accessibilityLabel="Data de nascimento"
                  autoCapitalize="none"
                  onChangeText={(value) => setBirthDate(formatDateInput(value))}
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#6a7d86"
                  style={localStyles.input}
                  value={birthDate}
                />
              </View>
            )}

            {ATHLETE_SECTIONS.map((section) => (
              <View key={section.title} style={localStyles.formSection}>
                <Text accessibilityRole="header" style={localStyles.sectionTitle}>{section.title}</Text>
                {section.fields.map((field) => (
                  <View key={field.key} style={localStyles.fieldGroup}>
                    <Text style={localStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
                    <ProfileField field={field} value={values[field.key]} onChange={(value) => updateField(field.key, value)} />
                  </View>
                ))}
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={localStyles.content}>
            {!!notice && <Text accessibilityRole="alert" style={localStyles.successText}>{notice}</Text>}

            {/* Perfil completo: o anel enche de acordo com a porcentagem real. */}
            <View style={localStyles.completionCard}>
              <ProgressRing percent={completion} size={74} stroke={7} color={completion === 100 ? '#2e9e4f' : BLUE}>
                <Text style={localStyles.completionValue}>{completion}%</Text>
              </ProgressRing>
              <View style={localStyles.completionCopy}>
                <Text style={localStyles.completionTitle}>{completion === 100 ? 'Perfil completo' : 'Complete seu perfil'}</Text>
                <Text style={localStyles.completionText}>{completion === 100 ? 'As instituições veem todas as suas informações.' : 'Perfis completos têm Match Score mais preciso.'}</Text>
              </View>
            </View>

            <View style={localStyles.statsGrid}>
              {/* Perfil recém-criado (números nunca salvos) mostra exemplos coerentes; depois, o real. */}
              {[
                ['Torneios', profile?.torneiosDisputados, 4],
                ['Vitórias', profile?.vitorias, 3],
                ['Derrotas', profile?.derrotas, 1],
                ['Títulos', profile?.titulos, 1],
              ].map(([label, value, example]) => {
                const saved = value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value))
                return (
                  <View key={label} style={localStyles.statCard}>
                    <Text style={localStyles.statValue}>{saved ? Number(value) : example}</Text>
                    <Text style={localStyles.statLabel}>{label}</Text>
                  </View>
                )
              })}
            </View>

            <View style={localStyles.block}>
              <Text accessibilityRole="header" style={localStyles.blockTitle}>Esporte</Text>
              <InfoRow label="Modalidade" value={displayText(profile?.modalidade)} />
              <InfoRow label="Categoria" value={displayText(profile?.categoria)} />
              <InfoRow label="Nível competitivo" value={displayText(level)} />
              <InfoRow label="Joga em" value={displayText(profile?.posicao)} />
              <InfoRow label="Mão dominante" value={displayText(profile?.maoDominante)} />
              <InfoRow label="Tempo de prática" value={displayText(profile?.tempoDePratica)} />
              <InfoRow label="Equipe ou clube" value={displayText(profile?.equipeAtual)} />
            </View>

            <View style={localStyles.block}>
              <Text accessibilityRole="header" style={localStyles.blockTitle}>Sobre mim</Text>
              <Text style={localStyles.aboutText}>{displayText(profile?.biografia, 'Escreva uma apresentação curta em "Editar perfil".')}</Text>
              <InfoRow label="Idade" value={calculateAge(profile?.dataNascimento) !== null ? `${calculateAge(profile?.dataNascimento)} anos` : 'Não informada'} />
              <InfoRow label="Nascimento" value={formatDate(profile?.dataNascimento)} />
              <InfoRow label="Cidade" value={displayText(profile?.localizacao)} />
            </View>

            <View style={localStyles.block}>
              <Text accessibilityRole="header" style={localStyles.blockTitle}>Objetivos e disponibilidade</Text>
              <InfoRow label="Objetivos" value={displayText(profile?.objetivos)} />
              <InfoRow label="Do que preciso" value={displayText(profile?.necessidades)} />
              <InfoRow label="Disponibilidade" value={displayText(profile?.disponibilidade)} />
              <InfoRow label="Viagens" value={displayText(profile?.possibilidadeViagem)} />
              <InfoRow label="Distância máxima" value={displayText(profile?.distanciaMaxima)} />
            </View>

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
  header: { height: 162, backgroundColor: BLUE, overflow: 'hidden' },
  headerStripe: { position: 'absolute', left: -80, top: 120, width: 200, height: 34, backgroundColor: '#e5e6e7', transform: [{ rotate: '40deg' }] },
  identity: { position: 'absolute', left: 30, right: 18, top: 72, flexDirection: 'row', alignItems: 'center', gap: 14 },
  // Espaço do botão "Editar perfil": nome comprido quebra a linha em vez de passar por baixo dele.
  identityCopy: { flex: 1, paddingRight: 128 },
  name: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 18, lineHeight: 24 },
  role: { color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 22 },
  headerEditButton: { position: 'absolute', right: 12, bottom: 12, minHeight: 44, borderRadius: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#c4ff32' },
  headerEditText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  body: { flex: 1, marginTop: -2, backgroundColor: '#f3f4f4', borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  content: { gap: 12, paddingHorizontal: 14, paddingTop: 26, paddingBottom: 110 },
  formSection: { gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e1e5e5' },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 18 },
  fieldGroup: { gap: 6 },
  fieldLabel: { color: '#2b3f48', fontFamily: 'Poppins_500Medium', fontSize: 14 },
  input: { minHeight: 48, borderColor: '#c8d5d8', borderRadius: 8, borderWidth: 1, backgroundColor: '#ffffff', color: '#17313c', fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 20, paddingHorizontal: 12 },
  multilineInput: { minHeight: 104, paddingTop: 10, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 12 },
  completionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e1e5e5' },
  completionValue: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  completionCopy: { flex: 1, gap: 2 },
  completionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  completionText: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 78, padding: 8, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e1e5e5' },
  statValue: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 24, lineHeight: 30 },
  statLabel: { color: '#526770', fontFamily: 'Poppins_500Medium', fontSize: 12, textAlign: 'center' },
  block: { gap: 8, padding: 14, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e1e5e5' },
  blockTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 17, marginBottom: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eef1f2' },
  infoRowLabel: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 14, flexShrink: 0 },
  infoRowValue: { flex: 1, color: '#17313c', fontFamily: 'Poppins_500Medium', fontSize: 14, textAlign: 'right' },
  aboutText: { color: '#3d4f57', fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 22 },
  centerState: { flex: 1, justifyContent: 'center', gap: 16, padding: 24 },
  stateText: { color: '#526770', fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  errorText: { color: '#b42318', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  successText: { color: '#126b35', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  secondaryAction: { alignItems: 'center', justifyContent: 'center', minHeight: 48, padding: 12 },
  secondaryActionText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 14 },
})
