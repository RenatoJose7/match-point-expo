import React, { useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SelectField, SELECT_OPTIONS } from '../../components/ui/SelectField'
import { Shell } from '../../components/ui/Shell'
import { assets } from '../../theme/assets'
import { BLUE, GREEN } from '../../theme/colors'

const fieldsByStep = {
  1: [
    { label: 'Nome completo' },
    { label: 'Categoria', options: SELECT_OPTIONS.categorias },
    { label: 'Mão dominante', options: SELECT_OPTIONS.maoDominante },
    { label: 'Equipe atual (opcional)' },
    { label: 'Resultados esportivos' },
  ],
  2: [
    { label: 'Objetivos' },
    { label: 'Necessidades' },
    { label: 'Dias e períodos disponíveis', options: SELECT_OPTIONS.disponibilidade },
    { label: 'Possibilidade de viagem', options: SELECT_OPTIONS.viagens },
    { label: 'Distância máxima', options: SELECT_OPTIONS.distancias },
    { label: 'Resumo do responsável (opcional)' },
  ],
}

export function AthleteAreaForm({ step, go, back }) {
  const next = step === 1 ? 'athleteArea2' : 'homeAthlete'
  const [values, setValues] = useState({})

  return (
    <Shell background={assets.athleteArea} back={back}>
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
          <View style={localStyles.fields}>
            {fieldsByStep[step].map(({ label, options }) => (
              options ? (
                <SelectField key={label} accessibilityLabel={label} options={options} value={values[label] ?? ''} onChange={(value) => setValues(current => ({ ...current, [label]: value }))} placeholder={label} triggerStyle={localStyles.select} />
              ) : (
                <TextInput
                  key={label}
                  placeholder={label}
                  placeholderTextColor={BLUE}
                  style={localStyles.input}
                  value={values[label] ?? ''}
                  onChangeText={(value) => setValues(current => ({ ...current, [label]: value }))}
                />
              )
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={() => go(next)} style={({ pressed }) => [localStyles.button, pressed && localStyles.buttonPressed]}>
            <Text style={localStyles.buttonText}>{step === 1 ? 'Continuar' : 'Concluir cadastro'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Shell>
  )
}

const localStyles = StyleSheet.create({
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
    paddingBottom: 28,
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
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: -4,
  },
  progressTrack: {
    width: 165,
    height: 2,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,.72)',
    marginTop: 5,
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GREEN,
  },
  fields: {
    gap: 12,
  },
  input: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  select: {
    minHeight: 50,
    height: 50,
    borderWidth: 0,
  },
  button: {
    width: 148,
    height: 38,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: '#ffffff',
    marginTop: 22,
  },
  buttonPressed: {
    opacity: .82,
    transform: [{ scale: .985 }],
  },
  buttonText: {
    color: BLUE,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
})
