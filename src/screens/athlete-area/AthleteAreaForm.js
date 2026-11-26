import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text, TextInput } from '../../components/accessibility/AppText'
import { SelectField, SELECT_OPTIONS } from '../../components/ui/SelectField'
import { ChoiceChips, toList } from '../../components/ui/ChoiceChips'
import { Shell } from '../../components/ui/Shell'
import { isMinor } from '../../domain/contracts.js'
import { assets } from '../../theme/assets'
import { BLUE, GREEN } from '../../theme/colors'
import { withGriffithsOverhang } from '../../theme/typography'

// Cada campo grava direto no perfil esportivo; é daqui que o Match Score tira os dados.
const fieldsByStep = {
  1: [
    { key: 'nome', label: 'Nome completo', maxLength: 80 },
    { key: 'modalidade', label: 'Modalidade', options: SELECT_OPTIONS.modalidades, required: true },
    { key: 'categoria', label: 'Categoria', options: SELECT_OPTIONS.categorias, required: true },
    { key: 'maoDominante', label: 'Mão dominante', options: SELECT_OPTIONS.maoDominante },
    { key: 'tempoDePratica', label: 'Tempo de prática', options: SELECT_OPTIONS.tempoDePratica },
    { key: 'nivelCompetitivo', label: 'Nível competitivo', options: SELECT_OPTIONS.niveisCompetitivos },
    { key: 'equipeAtual', label: 'Equipe ou clube (opcional)', maxLength: 60 },
  ],
  2: [
    // Objetivos e necessidades em múltipla escolha: nada de texto aberto sem padrão.
    { key: 'objetivos', label: 'Seus objetivos', chips: SELECT_OPTIONS.objetivos },
    { key: 'necessidades', label: 'Do que você precisa', chips: SELECT_OPTIONS.necessidades },
    { key: 'localizacao', label: 'Cidade onde treina', options: SELECT_OPTIONS.locais, required: true, allowCustom: true },
    { key: 'disponibilidade', label: 'Dias e períodos disponíveis', options: SELECT_OPTIONS.disponibilidade },
    { key: 'possibilidadeViagem', label: 'Possibilidade de viagem', options: SELECT_OPTIONS.viagens },
    { key: 'distanciaMaxima', label: 'Distância máxima', options: SELECT_OPTIONS.distancias },
    { key: 'resumoResponsavel', label: 'Resumo do responsável (opcional)', minorOnly: true, maxLength: 200 },
  ],
}

function initialValues(profile, session) {
  const values = { nome: session?.nome ?? '' }
  Object.values(fieldsByStep).flat().forEach(({ key, chips }) => {
    if (key === 'nome') return
    values[key] = chips ? toList(profile?.[key]) : profile?.[key] ? String(profile[key]) : ''
  })
  return values
}

export function AthleteAreaForm({ step, go, back, repositories, session }) {
  const [profile, setProfile] = useState(null)
  const [values, setValues] = useState(() => initialValues(null, session))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      const result = session?.id ? await repositories?.users.obterPerfilAtletaPorUsuario(session.id) : null
      if (!active) return
      if (result?.ok) {
        setProfile(result.data)
        setValues(initialValues(result.data, session))
      }
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [repositories, session])

  const minor = isMinor(profile?.dataNascimento)
  const fields = fieldsByStep[step].filter((field) => !field.minorOnly || minor)
  const update = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const save = async () => {
    if (saving) return
    const missing = fields.find((field) => field.required && !String(values[field.key] ?? '').trim())
    if (missing) {
      setError(`Preencha o campo ${missing.label}.`)
      return
    }
    if (!profile) {
      setError('Não encontramos seu perfil esportivo. Entre novamente para continuar.')
      return
    }

    const data = Object.fromEntries(fields
      .filter(({ key }) => key !== 'nome')
      .map(({ key, chips }) => [key, chips ? toList(values[key]) : String(values[key] ?? '').trim()]))
    // O nível também vai para "ranking", o campo que o perfil público do candidato mostra.
    if ('nivelCompetitivo' in data) data.ranking = data.nivelCompetitivo
    const modalidade = data.modalidade ?? profile.modalidade
    data.perfilCompleto = Boolean(profile.dataNascimento && modalidade)
    data.atualizadoEm = new Date().toISOString()

    setSaving(true)
    try {
      const result = await repositories.users.atualizarPerfilAtleta(profile.id, data)
      if (!result.ok) throw new Error(result.mensagem || 'Não foi possível salvar seus dados.')
      const name = values.nome?.trim()
      if (step === 1 && name && name !== session?.nome) await repositories.users.atualizarUsuario(session.id, { nome: name })
      setProfile(result.data)
      go(step === 1 ? 'athleteArea2' : 'homeAthlete')
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar seus dados. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell background={assets.athleteArea} back={step === 2 ? back : undefined}>
      <View style={localStyles.panel}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={localStyles.content}
        >
          <Text style={localStyles.title}>Área do <Text style={localStyles.accent}>Atleta</Text></Text>
          <Text style={localStyles.step}>{step} de 2</Text>
          <View style={localStyles.progressTrack}>
            <View style={[localStyles.progressFill, { width: `${step * 50}%` }]} />
          </View>
          {loading ? <ActivityIndicator color="#ffffff" style={localStyles.loading} /> : (
            <View style={localStyles.fields}>
              {fields.map(({ key, label, options, chips, required, allowCustom, maxLength }) => (
                chips ? (
                  <View key={key} style={localStyles.chipsGroup}>
                    <Text style={localStyles.chipsLabel}>{label}</Text>
                    <ChoiceChips label={label} options={chips} value={values[key]} onChange={(value) => update(key, value)} />
                  </View>
                ) : options ? (
                  <SelectField
                    key={key}
                    accessibilityLabel={label}
                    options={options}
                    value={values[key] ?? ''}
                    onChange={(value) => update(key, value)}
                    placeholder={required ? `${label} *` : label}
                    allowCustom={allowCustom}
                    triggerStyle={localStyles.select}
                    textStyle={localStyles.selectText}
                  />
                ) : (
                  <TextInput
                    key={key}
                    accessibilityLabel={label}
                    placeholder={label}
                    placeholderTextColor={BLUE}
                    maxLength={maxLength}
                    style={localStyles.input}
                    value={values[key] ?? ''}
                    onChangeText={(value) => update(key, value)}
                  />
                )
              ))}
            </View>
          )}
          {error ? <Text accessibilityRole="alert" style={localStyles.error}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={loading || saving}
            onPress={save}
            style={({ pressed }) => [localStyles.button, pressed && localStyles.buttonPressed, (loading || saving) && localStyles.buttonDisabled]}
          >
            <Text style={localStyles.buttonText}>{saving ? 'Salvando...' : step === 1 ? 'Continuar' : 'Concluir cadastro'}</Text>
          </Pressable>
          {step === 1 ? (
            <Pressable accessibilityRole="button" onPress={() => go('homeAthlete')} style={localStyles.skip}>
              <Text style={localStyles.skipText}>Preencher depois</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Shell>
  )
}

const localStyles = StyleSheet.create(withGriffithsOverhang({
  panel: {
    position: 'absolute',
    top: 79,
    bottom: 26,
    left: 11,
    right: 11,
    borderRadius: 26,
    backgroundColor: BLUE,
    overflow: 'hidden',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 23,
    paddingTop: 22,
    paddingBottom: 24,
  },
  title: {
    color: '#ffffff',
    fontFamily: 'Griffiths',
    fontSize: 40,
    fontWeight: '400',
    lineHeight: 50,
    textAlign: 'center',
  },
  accent: {
    color: GREEN,
  },
  step: {
    color: '#ffffff',
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: -4,
  },
  progressTrack: {
    width: 165,
    height: 2,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,.72)',
    marginTop: 5,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GREEN,
  },
  loading: {
    marginVertical: 40,
  },
  chipsGroup: { gap: 8 },
  chipsLabel: { color: '#ffffff', fontFamily: 'Poppins_500Medium', fontSize: 15 },
  fields: {
    gap: 11,
  },
  input: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  select: {
    minHeight: 48,
    height: 48,
    borderWidth: 0,
    paddingHorizontal: 16,
  },
  selectText: {
    color: BLUE,
    fontSize: 16,
  },
  error: {
    color: '#ffd8d3',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    width: 168,
    height: 40,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: '#ffffff',
    marginTop: 18,
  },
  buttonPressed: {
    opacity: .82,
    transform: [{ scale: .985 }],
  },
  buttonDisabled: {
    opacity: .6,
  },
  buttonText: {
    color: BLUE,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  skip: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  skipText: {
    color: '#ffffff',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
}))
