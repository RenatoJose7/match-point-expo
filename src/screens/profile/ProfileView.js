import React, { useEffect, useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BackButton } from '../../components/ui/BackButton'
import { BottomNav } from '../../components/navigation/BottomNav'
import { ProfilePhotoPicker } from '../../components/profile/ProfilePhotoPicker'
import { DeleteAccountSection } from '../../components/profile/DeleteAccountSection'
import { SelectField, SELECT_OPTIONS } from '../../components/ui/SelectField'

const BLUE = '#10579b'
const GREEN = '#c4ff32'

// Campos do perfil do parceiro. Os quatro primeiros aparecem como cartões, como no modelo.
const fields = [
  { key: 'nomeExibicao', label: 'Nome exibido' },
  { key: 'modalidade', label: 'Modalidade', options: SELECT_OPTIONS.modalidades, card: true, required: true },
  { key: 'experiencia', label: 'Experiência', placeholder: 'Ex.: 10 anos', card: true },
  // O CPF do cadastro fica em `documento`; o registro profissional tem campo próprio.
  { key: 'cref', label: 'CREF', placeholder: 'Ex.: 123456-G/SP', card: true },
  { key: 'localizacao', label: 'Localização', options: SELECT_OPTIONS.locais, card: true, required: true },
  { key: 'descricao', label: 'Sobre mim', multiline: true },
  { key: 'especialidades', label: 'Especialidades', placeholder: 'Separe por vírgula: Tática, Físico, Mental' },
]

function valuesFrom(profile) {
  return Object.fromEntries(fields.map(({ key }) => [key, profile?.[key] ?? '']))
}

export function ProfileView({ role, go, back, repositories, session, routeParams = {} }) {
  const institution = role === 'institution'
  const onboarding = Boolean(routeParams.onboarding)
  const home = institution ? 'homeInstitution' : 'homeTrainer'
  const [profile, setProfile] = useState(null)
  const [values, setValues] = useState({})
  const [editing, setEditing] = useState(onboarding)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    const result = await repositories.users.obterPerfilParceiroPorUsuario(session?.id)
    if (!result.ok) return setMessage(result.mensagem || 'Não foi possível carregar o perfil.')
    setProfile(result.data)
    setValues(valuesFrom(result.data))
  }

  useEffect(() => { load() }, [repositories, session?.id])

  const save = async () => {
    if (!profile || saving) return
    const missing = fields.find(({ key, required }) => required && !String(values[key] ?? '').trim())
    if (missing) return setMessage(`Preencha o campo ${missing.label}.`)
    setSaving(true); setMessage('')
    const data = Object.fromEntries(fields.map(({ key }) => [key, String(values[key] ?? '').trim()]))
    const result = await repositories.users.atualizarPerfilParceiro(profile.id, data)
    setSaving(false)
    if (!result.ok) return setMessage(result.mensagem || 'Não foi possível salvar o perfil.')
    setProfile(result.data); setEditing(false); setMessage('Perfil atualizado.')
    if (onboarding) go(home)
  }

  const cancelEditing = () => {
    setValues(valuesFrom(profile))
    setEditing(false)
  }

  const displayName = profile?.nomeExibicao || session?.nome || 'Carregando...'
  const roleLabel = institution ? 'Instituição' : 'Treinador'
  const specialties = String(profile?.especialidades ?? '').split(',').map((item) => item.trim()).filter(Boolean)

  return (
    <View style={localStyles.screen}>
      <View style={localStyles.header}>
        <View style={localStyles.headerStripe} />
        {onboarding ? null : <BackButton onPress={back} />}
        <View style={localStyles.identity}>
          <ProfilePhotoPicker compact repositories={repositories} session={session} size={58} />
          <View style={localStyles.identityText}>
            <Text numberOfLines={2} style={localStyles.name}>{displayName}</Text>
            <Text style={localStyles.roleLabel}>{roleLabel}</Text>
          </View>
        </View>
        {!editing ? (
          <Pressable onPress={() => setEditing(true)} style={({ pressed }) => [localStyles.editBtn, pressed && localStyles.pressed]} accessibilityRole="button" accessibilityLabel="Editar perfil">
            <Text style={localStyles.editBtnText}>Editar perfil</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={localStyles.body}>
        <ScrollView contentContainerStyle={localStyles.bodyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!editing && message ? <Text style={localStyles.message}>{message}</Text> : null}

          {editing ? (
            <>
              <Text style={localStyles.sectionTitle}>{onboarding ? 'Complete seu perfil' : 'Editar perfil'}</Text>
              {onboarding ? <Text style={localStyles.about}>Esses dados aparecem para os atletas e ajudam a mostrar a compatibilidade das suas oportunidades.</Text> : null}
              {fields.map(({ key, label, options, placeholder, multiline, required }) => (
                <View key={key} style={localStyles.field}>
                  <Text style={localStyles.fieldLabel}>{label}{required ? ' *' : ''}</Text>
                  {options ? (
                    <SelectField accessibilityLabel={label} options={options} value={String(values[key] ?? '')} onChange={(value) => setValues((current) => ({ ...current, [key]: value }))} placeholder={`Selecione ${label.toLowerCase()}`} />
                  ) : (
                    <TextInput
                      accessibilityLabel={label}
                      value={String(values[key] ?? '')}
                      onChangeText={(value) => setValues((current) => ({ ...current, [key]: value }))}
                      placeholder={placeholder}
                      placeholderTextColor="#8295a8"
                      multiline={multiline}
                      style={[localStyles.input, multiline && localStyles.multiline]}
                    />
                  )}
                </View>
              ))}
              {message ? <Text accessibilityRole="alert" style={localStyles.message}>{message}</Text> : null}
              <Pressable onPress={save} disabled={saving} style={({ pressed }) => [localStyles.primaryBtn, (pressed || saving) && localStyles.pressed]} accessibilityRole="button">
                <Text style={localStyles.primaryBtnText}>{saving ? 'Salvando...' : 'Salvar alterações'}</Text>
              </Pressable>
              <Pressable onPress={onboarding ? () => go(home) : cancelEditing} style={localStyles.secondaryBtn} accessibilityRole="button">
                <Text style={localStyles.secondaryBtnText}>{onboarding ? 'Preencher depois' : 'Cancelar'}</Text>
              </Pressable>
              {onboarding ? null : <DeleteAccountSection repositories={repositories} />}
            </>
          ) : (
            <>
              <View style={localStyles.grid}>
                {fields.filter((field) => field.card).map(({ key, label }) => (
                  <View key={key} style={localStyles.infoCard}>
                    <Text style={localStyles.infoLabel}>{label}</Text>
                    <Text numberOfLines={2} style={localStyles.infoValue}>{profile?.[key] || 'Não informado'}</Text>
                  </View>
                ))}
              </View>

              <Text style={localStyles.sectionTitle}>Sobre mim</Text>
              <Text style={localStyles.about}>{profile?.descricao || 'Conte um pouco sobre sua trajetória em "Editar perfil".'}</Text>

              <Text style={localStyles.sectionTitle}>Especialidades</Text>
              {specialties.length ? (
                <View style={localStyles.chips}>
                  {specialties.map((item) => <View key={item} style={localStyles.chip}><Text style={localStyles.chipText}>{item}</Text></View>)}
                </View>
              ) : <Text style={localStyles.about}>Nenhuma especialidade informada.</Text>}

              <Text style={localStyles.verification}>
                {profile?.verificado ? '✓ Perfil verificado' : 'Perfil aguardando verificação'}
              </Text>
            </>
          )}
        </ScrollView>
      </View>

      <BottomNav go={go} role={role} active="profile" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },
  header: { height: 162, backgroundColor: BLUE, overflow: 'hidden' },
  headerStripe: { position: 'absolute', left: -80, top: 120, width: 200, height: 34, backgroundColor: '#e5e6e7', transform: [{ rotate: '40deg' }] },
  identity: { position: 'absolute', left: 30, right: 18, top: 72, flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityText: { flex: 1, minWidth: 0 },
  name: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 18, lineHeight: 24 },
  roleLabel: { color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 22 },
  editBtn: { position: 'absolute', right: 12, bottom: 12, minHeight: 30, borderRadius: 8, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN },
  editBtnText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  pressed: { opacity: 0.85 },
  body: { flex: 1, marginTop: -2, backgroundColor: '#f3f4f4', borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  bodyContent: { paddingHorizontal: 12, paddingTop: 34, paddingBottom: 100, gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoCard: { flexBasis: '48%', flexGrow: 1, minHeight: 86, gap: 6, padding: 14, borderRadius: 7, borderWidth: 1, borderColor: '#dfe5e7', backgroundColor: '#ffffff', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(23, 49, 60, .08)' }, default: { elevation: 1 } }) },
  infoLabel: { color: '#6f747a', fontFamily: 'Poppins_400Regular', fontSize: 14 },
  infoValue: { color: '#0f4c8f', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 19, lineHeight: 26, marginTop: 14, marginHorizontal: 8 },
  about: { color: '#3f5970', fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 21, marginHorizontal: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 8 },
  chip: { minWidth: 92, paddingHorizontal: 16, height: 24, borderRadius: 12, backgroundColor: '#d6e2ee', alignItems: 'center', justifyContent: 'center' },
  chipText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  field: { gap: 5 },
  fieldLabel: { color: '#3f5970', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  input: { borderWidth: 1, borderColor: '#c8d5d8', backgroundColor: '#fff', borderRadius: 8, minHeight: 46, paddingHorizontal: 12, paddingVertical: 10, color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 14 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  verification: { color: '#164d34', fontFamily: 'Poppins_600SemiBold', marginTop: 14, marginHorizontal: 8, fontSize: 13 },
  message: { color: '#164d34', fontFamily: 'Poppins_500Medium', fontSize: 13, marginHorizontal: 8 },
  primaryBtn: { backgroundColor: BLUE, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginTop: 8 },
  primaryBtnText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  secondaryBtn: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: '#3f5970', fontFamily: 'Poppins_500Medium', fontSize: 14 },
})
