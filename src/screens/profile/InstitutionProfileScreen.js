import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { DeleteAccountSection } from '../../components/profile/DeleteAccountSection'
import { ProfilePhotoPicker } from '../../components/profile/ProfilePhotoPicker'
import { SelectField, SELECT_OPTIONS } from '../../components/ui/SelectField'
import { assets } from '../../theme/assets'

const BLUE = '#10579b'
const LIME = '#c4ff32'
const sample = {
  nomeExibicao: 'Universidade do esporte',
  documento: '02.961.362/0001–74',
  localizacao: 'São Paulo – SP',
  descricao: 'www.santosfc.com.br',
}

export function InstitutionProfileScreen({ go, back, repositories, session, routeParams = {} }) {
  // Logo após o cadastro, a instituição completa o perfil antes de ir para o início.
  const onboarding = Boolean(routeParams.onboarding)
  const [profile, setProfile] = useState(null)
  const [values, setValues] = useState({ nomeExibicao: '', documento: '', localizacao: '', descricao: '', tipoInstituicao: '' })
  const [editing, setEditing] = useState(onboarding)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      let source = repositories
      let result = await source.users.obterPerfilParceiroPorUsuario(session?.id)
      if ((!result.ok || !result.data) && repositories.demo) {
        source = repositories.demo
        result = await source.users.obterPerfilParceiroPorUsuario('usuario-instituicao')
      }
      if (!mounted || !result.ok) return
      const next = result.data
      setProfile({ ...next, source })
      setValues({
        nomeExibicao: next.nomeExibicao || session?.nome || '',
        documento: next.documento || '',
        localizacao: next.localizacao || '',
        descricao: next.descricao || '',
        tipoInstituicao: next.tipoInstituicao || '',
      })
    }
    load()
    return () => { mounted = false }
  }, [repositories, session?.id])

  const save = async () => {
    if (!profile || saving) return
    if (!values.tipoInstituicao?.trim() || !values.localizacao?.trim()) {
      setMessage('Informe o tipo da instituição e a localização.')
      return
    }
    setSaving(true)
    setMessage('')
    const result = await profile.source.users.atualizarPerfilParceiro(profile.id, values)
    setSaving(false)
    if (!result.ok) return setMessage(result.mensagem || 'Não foi possível salvar as informações.')
    setProfile((current) => ({ ...current, ...result.data }))
    setEditing(false)
    setMessage('Perfil atualizado.')
    if (onboarding) go('homeInstitution')
  }

  const cancelEditing = () => {
    setValues({
      nomeExibicao: profile?.nomeExibicao || session?.nome || '',
      documento: profile?.documento || '',
      localizacao: profile?.localizacao || '',
      descricao: profile?.descricao || '',
      tipoInstituicao: profile?.tipoInstituicao || '',
    })
    setEditing(false)
  }

  const rows = [
    ['CNPJ', values.documento],
    ['Tipo', values.tipoInstituicao],
    ['Localização', values.localizacao],
    ['Site', values.descricao],
  ].map(([label, value]) => [label, value || 'Não informado'])

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {onboarding ? null : <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} onPress={back} style={styles.back}><Ionicons name="arrow-back" size={22} color="#fff" /></Pressable>}
        <Image source={assets.monogram} style={styles.mark} resizeMode="contain" />
        <View style={styles.identity}>
          <ProfilePhotoPicker compact repositories={repositories} session={session} size={58} />
          <View style={styles.identityCopy}><Text numberOfLines={2} style={styles.name}>{values.nomeExibicao}</Text><Text style={styles.role}>Instituição</Text></View>
        </View>
      </View>

      <View style={styles.panel}>
        <ScrollView contentContainerStyle={styles.panelContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>{onboarding ? 'Complete seu perfil' : 'Informações'}</Text>
          {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
          {editing ? (
            <View style={styles.form}>
              <Field label="Nome da instituição" value={values.nomeExibicao} onChangeText={(nomeExibicao) => setValues((current) => ({ ...current, nomeExibicao }))} />
              <Field label="CNPJ" value={values.documento} onChangeText={(documento) => setValues((current) => ({ ...current, documento }))} />
              <View style={styles.field}><Text style={styles.fieldLabel}>Tipo da instituição *</Text><SelectField accessibilityLabel="Tipo da instituição" options={SELECT_OPTIONS.tipoInstituicao} value={values.tipoInstituicao} onChange={(tipoInstituicao) => setValues((current) => ({ ...current, tipoInstituicao }))} placeholder="Selecione o tipo" /></View>
              <View style={styles.field}><Text style={styles.fieldLabel}>Localização *</Text><SelectField accessibilityLabel="Localização" options={SELECT_OPTIONS.locais} value={values.localizacao} onChange={(localizacao) => setValues((current) => ({ ...current, localizacao }))} placeholder="Selecione a cidade" /></View>
              <Field label="Site" value={values.descricao} onChangeText={(descricao) => setValues((current) => ({ ...current, descricao }))} />
              <Pressable accessibilityRole="button" onPress={save} disabled={saving} style={[styles.editButton, saving && styles.buttonDisabled]}><Text style={styles.editText}>{saving ? 'Salvando...' : 'Salvar alterações'}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={onboarding ? () => go('homeInstitution') : cancelEditing} style={styles.cancelButton}><Text style={styles.cancelText}>{onboarding ? 'Preencher depois' : 'Cancelar'}</Text></Pressable>
              {onboarding ? null : <DeleteAccountSection repositories={repositories} />}
            </View>
          ) : (
            <>
              <View style={styles.infoList}>{rows.map(([label, value], index) => <View key={label} style={[styles.infoRow, index === 3 && styles.lastRow]}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>)}</View>
              <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={({ pressed }) => [styles.editButton, styles.viewEditButton, pressed && styles.buttonPressed]}><Text style={styles.editText}>Editar perfil</Text></Pressable>
            </>
          )}
        </ScrollView>
      </View>
      <BottomNav go={go} role="institution" active="profile" />
    </View>
  )
}

function Field({ label, value, onChangeText }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} style={styles.input} /></View>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },
  header: { height: 196, backgroundColor: BLUE },
  back: { position: 'absolute', top: 41, left: 14, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', top: 18, alignSelf: 'center', width: 54, height: 58 },
  identity: { position: 'absolute', left: 36, right: 16, bottom: 40, flexDirection: 'row', alignItems: 'center', gap: 12 },
  identityCopy: { flex: 1, minWidth: 0 },
  initials: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: BLUE, fontFamily: 'Griffiths', fontWeight: '400', fontSize: 40, lineHeight: 47 },
  name: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 19, lineHeight: 24 },
  role: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14, lineHeight: 18 },
  panel: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  panelContent: { paddingHorizontal: 22, paddingTop: 27, paddingBottom: 125 },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 22, lineHeight: 28, marginBottom: 18, marginTop: 14 },
  infoList: { gap: 0 },
  infoRow: { minHeight: 63, paddingHorizontal: 4, paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  lastRow: { borderTopWidth: 1, borderTopColor: '#9db6d3' },
  label: { width: '45%', color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  value: { flex: 1, color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, textAlign: 'left' },
  editButton: { minHeight: 52, marginTop: 8, borderRadius: 18, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  editText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  form: { gap: 14 },
  field: { gap: 5 },
  fieldLabel: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  input: { height: 45, borderWidth: 1, borderColor: '#9db6d3', borderRadius: 10, paddingHorizontal: 12, color: BLUE, fontFamily: 'Poppins_400Regular' },
  cancelButton: { height: 40, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13 },
  message: { color: '#1878d3', fontFamily: 'Poppins_500Medium', marginTop: -8, marginBottom: 15 },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { opacity: 0.88 },
  viewEditButton: { marginTop: 40 },
  headerEditButton: { position: 'absolute', right: 18, bottom: 35, minHeight: 34, borderRadius: 18, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: LIME },
  headerEditText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
})
