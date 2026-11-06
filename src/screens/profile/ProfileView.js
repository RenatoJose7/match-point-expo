import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BackButton } from '../../components/ui/BackButton'
import { BottomNav } from '../../components/navigation/BottomNav'
import { ProfilePhotoPicker } from '../../components/profile/ProfilePhotoPicker'
import { DeleteAccountSection } from '../../components/profile/DeleteAccountSection'
import { SelectField, SELECT_OPTIONS } from '../../components/ui/SelectField'
import { assets } from '../../theme/assets'
import { styles } from '../../theme/styles'

const BLUE = '#10579b'
const GREEN = '#c4ff32'

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

  const cancelEditing = () => {
    setValues(Object.fromEntries(fields.map(([key]) => [key, profile?.[key] ?? ''])))
    setEditing(false)
  }

  const displayName = profile?.nomeExibicao || session?.nome || 'Carregando...'
  const roleLabel = institution ? 'Instituição' : 'Treinador'

  return (
    <View style={localStyles.screen}>
      {/* Header azul */}
      <View style={localStyles.header}>
        <BackButton onPress={back} />
        <Image source={assets.monogram} style={localStyles.headerMark} />
        <View style={localStyles.identity}>
          <View style={localStyles.identityText}>
            <Text style={localStyles.name}>{displayName}</Text>
            <Text style={localStyles.roleLabel}>{roleLabel}</Text>
          </View>
          <Pressable
            onPress={() => editing ? cancelEditing() : setEditing(true)}
            style={localStyles.editBtn}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
          >
            <Text style={localStyles.editBtnText}>{editing ? 'Cancelar' : 'Editar perfil'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Painel branco */}
      <View style={localStyles.body}>
        <ScrollView
          contentContainerStyle={localStyles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ProfilePhotoPicker repositories={repositories} session={session} size={82} />

          {message ? <Text style={localStyles.message}>{message}</Text> : null}

          {/* Seção de informações */}
          <Text style={localStyles.sectionTitle}>
            {institution ? 'Informações da instituição' : 'Informações do treinador'}
          </Text>

          {fields.map(([key, label]) =>
            editing ? (
              <View key={key} style={localStyles.field}>
                <Text style={localStyles.fieldLabel}>{label}</Text>
                {key === 'localizacao' ? (
                  <SelectField accessibilityLabel={label} options={SELECT_OPTIONS.locais} value={String(values[key] ?? '')} onChange={(value) => setValues((current) => ({ ...current, [key]: value }))} placeholder="Selecione a cidade" />
                ) : (
                  <TextInput
                    value={String(values[key] ?? '')}
                    onChangeText={(value) => setValues((current) => ({ ...current, [key]: value }))}
                    multiline={key === 'descricao'}
                    style={[localStyles.input, key === 'descricao' && localStyles.multiline]}
                  />
                )}
              </View>
            ) : (
              <View key={key} style={localStyles.infoRow}>
                <Text style={localStyles.infoLabel}>{label}</Text>
                <Text style={localStyles.infoValue}>{profile?.[key] || 'Não informado'}</Text>
              </View>
            )
          )}

          <Text style={localStyles.verification}>
            {profile?.verificado ? '✓ Perfil verificado' : 'Perfil aguardando verificação'}
          </Text>

          {editing ? (
            <>
              <Pressable onPress={save} disabled={saving} style={localStyles.primaryBtn} accessibilityRole="button">
                <Text style={localStyles.primaryBtnText}>{saving ? 'Salvando...' : 'Salvar alterações'}</Text>
              </Pressable>
              <Pressable
                onPress={cancelEditing}
                style={localStyles.secondaryBtn}
                accessibilityRole="button"
              >
                <Text style={localStyles.secondaryBtnText}>Cancelar</Text>
              </Pressable>
            </>
          ) : null}

          <DeleteAccountSection repositories={repositories} />
        </ScrollView>
      </View>

      <BottomNav go={go} role={role} active="profile" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },
  header: { height: 159, backgroundColor: BLUE },
  headerMark: { position: 'absolute', top: 7, width: 51, height: 56, alignSelf: 'center' },
  identity: { position: 'absolute', left: 20, right: 18, bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  identityText: { flex: 1 },
  name: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 22 },
  roleLabel: { color: '#b8d4f5', fontFamily: 'Poppins_400Regular', fontSize: 13 },
  editBtn: { backgroundColor: GREEN, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7 },
  editBtnText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  // Painel branco
  body: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  bodyContent: { paddingHorizontal: 22, paddingTop: 27, paddingBottom: 110, gap: 10 },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginBottom: 12, marginTop: 12 },
  // Campos visualização
  infoRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#dce6dd' },
  infoLabel: { color: '#64756b', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  infoValue: { color: '#183126', fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 3 },
  // Campos edição
  field: { gap: 5 },
  fieldLabel: { color: '#64756b', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  input: { borderWidth: 1, borderColor: '#cddbd0', backgroundColor: '#fff', borderRadius: 8, minHeight: 46, padding: 10, color: BLUE },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  // Verificação
  verification: { color: '#164d34', fontFamily: 'Poppins_600SemiBold', marginTop: 6, fontSize: 13 },
  message: { color: '#164d34', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  // Botões
  primaryBtn: { backgroundColor: '#236b46', minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginTop: 6 },
  primaryBtnText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  secondaryBtn: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: '#64756b', fontFamily: 'Poppins_500Medium', fontSize: 13 },
})
