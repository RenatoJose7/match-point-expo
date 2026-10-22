import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BackButton } from '../../components/ui/BackButton'
import { Button } from '../../components/ui/Button'

const fields = [
  ['modalidade', 'Modalidade'],
  ['categoria', 'Categoria'],
  ['posicao', 'Posição'],
  ['equipeAtual', 'Equipe atual'],
  ['tempoDePratica', 'Tempo de prática'],
  ['ranking', 'Ranking'],
]

export function ResponsibleAthleteProfileScreen({ back, repositories, routeParams = {}, session }) {
  const [athlete, setAthlete] = useState(null)
  const [guardian, setGuardian] = useState(null)
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        if (!routeParams.athleteId) throw new Error('Não foi possível identificar o atleta vinculado.')
        const guardianResult = await repositories.users.obterPerfilResponsavelPorUsuario(session?.id)
        if (!guardianResult.ok) throw new Error(guardianResult.mensagem || 'Perfil de responsável não encontrado.')
        const athletesResult = await repositories.users.obterAtletasDoResponsavel(guardianResult.data.id)
        if (!athletesResult.ok) throw new Error(athletesResult.mensagem || 'Não foi possível validar o vínculo.')
        const linkedAthlete = athletesResult.data.find((item) => item.id === routeParams.athleteId)
        if (!linkedAthlete) throw new Error('Este atleta não está vinculado à sua conta.')
        if (active) {
          setGuardian(guardianResult.data)
          setAthlete(linkedAthlete)
          setValues(Object.fromEntries(fields.map(([key]) => [key, String(linkedAthlete[key] ?? '')])))
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Não foi possível carregar o perfil.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [repositories, routeParams.athleteId, session?.id])

  const save = async () => {
    if (!athlete || !guardian || saving) return
    const modalidade = values.modalidade?.trim() || ''
    if (!modalidade) {
      setError('Informe a modalidade esportiva.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = Object.fromEntries(fields.map(([key]) => [key, values[key]?.trim() || '']))
      const result = await repositories.users.atualizarAtletaComoResponsavel(guardian.id, athlete.id, {
        ...data,
        perfilCompleto: Boolean(modalidade),
      })
      if (!result.ok) throw new Error(result.mensagem || 'Não foi possível salvar o perfil.')
      setAthlete(result.data)
      setValues(Object.fromEntries(fields.map(([key]) => [key, String(result.data[key] ?? '')])))
      setEditing(false)
      setNotice('Perfil esportivo atualizado.')
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}><BackButton onPress={back} /><Text style={styles.title}>Perfil do atleta</Text></View>
      {loading ? <View style={styles.state}><ActivityIndicator color="#126b35" /><Text style={styles.stateText}>Carregando perfil...</Text></View> : error && !athlete ? (
        <View style={styles.state}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></View>
      ) : athlete ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.description}>Você pode editar somente este atleta, que está vinculado à sua conta.</Text>
          {fields.map(([key, label]) => (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>{label}{key === 'modalidade' ? ' *' : ''}</Text>
              {editing ? <TextInput value={values[key] ?? ''} onChangeText={(value) => setValues((current) => ({ ...current, [key]: value }))} style={styles.input} /> : <Text style={styles.value}>{athlete[key] || 'Não informado'}</Text>}
            </View>
          ))}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
          {editing ? (
            <>
              <Button wide disabled={saving} onPress={save}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
              <Pressable onPress={() => { setEditing(false); setValues(Object.fromEntries(fields.map(([key]) => [key, String(athlete[key] ?? '')]))) }}><Text style={styles.cancel}>Cancelar</Text></Pressable>
            </>
          ) : <Button wide onPress={() => { setEditing(true); setNotice('') }}>Editar perfil</Button>}
        </ScrollView>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f8f7' },
  header: { gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, backgroundColor: '#ffffff' },
  title: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 20 },
  content: { gap: 12, padding: 20, paddingBottom: 28 },
  description: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18 },
  field: { gap: 5 },
  label: { color: '#344b55', fontFamily: 'Poppins_500Medium', fontSize: 12 },
  value: { minHeight: 46, paddingHorizontal: 12, paddingVertical: 13, borderRadius: 8, backgroundColor: '#ffffff', color: '#17313c', fontFamily: 'Poppins_400Regular', fontSize: 14 },
  input: { minHeight: 46, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#c8d5d8', backgroundColor: '#ffffff', color: '#17313c', fontFamily: 'Poppins_400Regular', fontSize: 14 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  stateText: { color: '#526770', fontFamily: 'Poppins_400Regular' },
  error: { color: '#8c2721', fontFamily: 'Poppins_500Medium', fontSize: 12, lineHeight: 18 },
  notice: { color: '#126b35', fontFamily: 'Poppins_500Medium', fontSize: 12 },
  cancel: { color: '#526770', fontFamily: 'Poppins_500Medium', textAlign: 'center', padding: 8 },
})
