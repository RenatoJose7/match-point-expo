import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { DeleteAccountSection } from '../../components/profile/DeleteAccountSection'
import { ProfilePhotoPicker } from '../../components/profile/ProfilePhotoPicker'
import { assets } from '../../theme/assets'

const BLUE = '#10579b'
const LIME = '#c4ff32'
const sample = {
  nomeExibicao: 'Universidade do esporte',
  documento: '02.961.362/0001–74',
  localizacao: 'São Paulo – SP',
  descricao: 'www.santosfc.com.br',
}

export function InstitutionProfileScreen({ go, back, repositories, session }) {
  const [profile, setProfile] = useState(null)
  const [values, setValues] = useState(sample)
  const [editing, setEditing] = useState(false)
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
        nomeExibicao: next.nomeExibicao || sample.nomeExibicao,
        documento: next.documento || sample.documento,
        localizacao: next.localizacao || sample.localizacao,
        descricao: next.descricao || sample.descricao,
      })
    }
    load()
    return () => { mounted = false }
  }, [repositories, session?.id])

  const save = async () => {
    if (!profile || saving) return
    setSaving(true)
    setMessage('')
    const result = await profile.source.users.atualizarPerfilParceiro(profile.id, values)
    setSaving(false)
    if (!result.ok) return setMessage(result.mensagem || 'Não foi possível salvar as informações.')
    setProfile((current) => ({ ...current, ...result.data }))
    setEditing(false)
    setMessage('Perfil atualizado.')
  }

  const cancelEditing = () => {
    setValues({
      nomeExibicao: profile?.nomeExibicao || sample.nomeExibicao,
      documento: profile?.documento || sample.documento,
      localizacao: profile?.localizacao || sample.localizacao,
      descricao: profile?.descricao || sample.descricao,
    })
    setEditing(false)
  }

  const rows = [
    ['CNPJ', values.documento],
    ['Tipo', 'Universidade'],
    ['Localização', values.localizacao],
    ['Site', values.descricao],
  ]

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={back} style={styles.back}><Ionicons name="arrow-back" size={21} color="#fff" /></Pressable>
        <Image source={assets.monogram} style={styles.mark} resizeMode="contain" />
        <View style={styles.identity}>
          <View style={styles.initials}><Text style={styles.initialsText}>In</Text></View>
          <View style={styles.identityCopy}><Text numberOfLines={2} style={styles.name}>{values.nomeExibicao}</Text><Text style={styles.role}>Instituição</Text></View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={editing ? 'Cancelar edição' : 'Editar perfil'} onPress={() => editing ? cancelEditing() : setEditing(true)} style={styles.headerEditButton}><Text style={styles.headerEditText}>{editing ? 'Cancelar' : 'Editar perfil'}</Text></Pressable>
      </View>

      <View style={styles.panel}>
        <ScrollView contentContainerStyle={styles.panelContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <ProfilePhotoPicker repositories={repositories} session={session} size={78} />
          <Text style={styles.sectionTitle}>Informações</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {editing ? (
            <View style={styles.form}>
              <Field label="Nome da instituição" value={values.nomeExibicao} onChangeText={(nomeExibicao) => setValues((current) => ({ ...current, nomeExibicao }))} />
              <Field label="CNPJ" value={values.documento} onChangeText={(documento) => setValues((current) => ({ ...current, documento }))} />
              <Field label="Localização" value={values.localizacao} onChangeText={(localizacao) => setValues((current) => ({ ...current, localizacao }))} />
              <Field label="Site" value={values.descricao} onChangeText={(descricao) => setValues((current) => ({ ...current, descricao }))} />
              <Pressable accessibilityRole="button" onPress={save} disabled={saving} style={[styles.editButton, saving && styles.buttonDisabled]}><Text style={styles.editText}>{saving ? 'Salvando...' : 'Salvar alterações'}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={cancelEditing} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
              <DeleteAccountSection repositories={repositories} />
            </View>
          ) : (
            <View style={styles.infoList}>{rows.map(([label, value], index) => <View key={label} style={[styles.infoRow, index === 3 && styles.lastRow]}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>)}</View>
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
  header: { height: 159, backgroundColor: BLUE },
  back: { position: 'absolute', top: 41, left: 14, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', top: 7, alignSelf: 'center', width: 58, height: 62 },
  identity: { position: 'absolute', left: 20, right: 124, bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  identityCopy: { flex: 1, minWidth: 0 },
  initials: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: BLUE, fontFamily: 'Griffiths', fontWeight: '400', fontSize: 40, lineHeight: 47 },
  name: { maxWidth: 215, color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 22 },
  role: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 18 },
  panel: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  panelContent: { paddingHorizontal: 22, paddingTop: 27, paddingBottom: 125 },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 24, marginBottom: 18, marginTop: 14 },
  infoList: { gap: 0 },
  infoRow: { minHeight: 63, paddingHorizontal: 4, paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  lastRow: { borderTopWidth: 1, borderTopColor: '#9db6d3' },
  label: { width: '45%', color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  value: { flex: 1, color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, textAlign: 'left' },
  editButton: { minHeight: 52, marginTop: 8, borderRadius: 18, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  editText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  form: { gap: 14 },
  field: { gap: 5 },
  fieldLabel: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  input: { height: 45, borderWidth: 1, borderColor: '#9db6d3', borderRadius: 10, paddingHorizontal: 12, color: BLUE, fontFamily: 'Poppins_400Regular' },
  cancelButton: { height: 40, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13 },
  message: { color: '#1878d3', fontFamily: 'Poppins_500Medium', marginTop: -22, marginBottom: 15 },
  buttonDisabled: { opacity: 0.6 },
  headerEditButton: { position: 'absolute', right: 18, bottom: 35, minHeight: 34, borderRadius: 18, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: LIME },
  headerEditText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
})
