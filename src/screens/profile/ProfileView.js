import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BackButton } from '../../components/ui/BackButton'
import { BottomNav } from '../../components/navigation/BottomNav'
import { assets } from '../../theme/assets'
import { styles } from '../../theme/styles'

const fields = [['nomeExibicao', 'Nome exibido'], ['descricao', 'Sobre'], ['localizacao', 'Localização'], ['documento', 'Documento']]

export function ProfileView({ role, go, back, repositories, session }) {
  const institution = role === 'institution'
  const [profile, setProfile] = useState(null)
  const [values, setValues] = useState({})
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    const result = await repositories.users.obterPerfilParceiroPorUsuario(session?.id)
    if (!result.ok) return setMessage(result.mensagem || 'Não foi possível carregar o perfil.')
    setProfile(result.data)
    setValues(Object.fromEntries(fields.map(([key]) => [key, result.data[key] ?? ''])))
  }

  useEffect(() => { load() }, [repositories, session?.id])

  const save = async () => {
    if (!profile || saving) return
    setSaving(true); setMessage('')
    const result = await repositories.users.atualizarPerfilParceiro(profile.id, values)
    setSaving(false)
    if (!result.ok) return setMessage(result.mensagem || 'Não foi possível salvar o perfil.')
    setProfile(result.data); setEditing(false); setMessage('Perfil atualizado.')
  }

  return <View style={styles.profileScreen}>
    <BackButton onPress={back} />
    <Image source={assets.monogram} style={styles.listMark} />
    <View style={styles.profileIdentity}><View style={styles.avatar}><Text style={styles.avatarText}>{(profile?.nomeExibicao || session?.nome || 'MP').slice(0, 2)}</Text></View><View><Text style={styles.profileName}>{profile?.nomeExibicao || 'Carregando...'}</Text><Text style={styles.profileRole}>{institution ? 'Instituição' : 'Treinador'}</Text></View></View>
    <ScrollView style={styles.profileBody} contentContainerStyle={localStyles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>{institution ? 'Informações da instituição' : 'Informações do treinador'}</Text>
      {fields.map(([key, label]) => editing ? <View key={key} style={localStyles.field}><Text style={localStyles.label}>{label}</Text><TextInput value={String(values[key] ?? '')} onChangeText={(value) => setValues((current) => ({ ...current, [key]: value }))} multiline={key === 'descricao'} style={[localStyles.input, key === 'descricao' && localStyles.multiline]} /></View> : <View key={key} style={localStyles.row}><Text style={localStyles.label}>{label}</Text><Text style={localStyles.value}>{profile?.[key] || 'Não informado'}</Text></View>)}
      <Text style={localStyles.verification}>{profile?.verificado ? 'Perfil verificado' : 'Perfil aguardando verificação'}</Text>
      {message ? <Text style={localStyles.message}>{message}</Text> : null}
      {editing ? <><Pressable onPress={save} disabled={saving} style={localStyles.primary}><Text style={localStyles.primaryText}>{saving ? 'Salvando...' : 'Salvar alterações'}</Text></Pressable><Pressable onPress={() => { setEditing(false); setValues(Object.fromEntries(fields.map(([key]) => [key, profile?.[key] ?? '']))) }} style={localStyles.secondary}><Text>Cancelar</Text></Pressable></> : <Pressable onPress={() => setEditing(true)} style={localStyles.primary}><Text style={localStyles.primaryText}>Editar perfil</Text></Pressable>}
    </ScrollView>
    <BottomNav go={go} role={role} active="profile" />
  </View>
}

const localStyles = StyleSheet.create({
  content: { paddingBottom: 28, gap: 10 }, field: { gap: 5 }, row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#dce6dd' }, label: { color: '#64756b', fontFamily: 'Poppins_500Medium', fontSize: 12 }, value: { color: '#183126', fontFamily: 'Poppins_400Regular', fontSize: 14, marginTop: 3 }, input: { borderWidth: 1, borderColor: '#cddbd0', backgroundColor: '#fff', borderRadius: 8, minHeight: 46, padding: 10, color: '#183126' }, multiline: { minHeight: 90, textAlignVertical: 'top' }, verification: { color: '#164d34', fontFamily: 'Poppins_600SemiBold', marginTop: 6 }, message: { color: '#164d34', fontFamily: 'Poppins_500Medium' }, primary: { backgroundColor: '#236b46', minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginTop: 6 }, primaryText: { color: '#fff', fontFamily: 'Poppins_600SemiBold' }, secondary: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
})
