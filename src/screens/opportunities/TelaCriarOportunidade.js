import React, { useState } from 'react'
import { Image, ScrollView, Text, TextInput, View } from 'react-native'
import { BackButton } from '../../components/ui/BackButton'
import { BottomNav } from '../../components/navigation/BottomNav'
import { Button } from '../../components/ui/Button'
import { SelectField, SELECT_OPTIONS } from '../../components/ui/SelectField'
import { assets } from '../../theme/assets'
import { styles } from '../../theme/styles'

const campos = [
  { label: 'Título da oportunidade' },
  { label: 'Modalidade', options: SELECT_OPTIONS.modalidades },
  { label: 'Categoria', options: SELECT_OPTIONS.categorias },
  { label: 'Localização', options: SELECT_OPTIONS.locais },
]

export function TelaCriarOportunidade({ go, back }) {
  const [values, setValues] = useState({})
  return (
    <View style={styles.createOpportunityScreen}>
      <View style={styles.createOpportunityHeader}>
        <View style={styles.createOpportunityStripe} />
        <BackButton onPress={back} />
        <Image source={assets.monogram} style={styles.createOpportunityMark} resizeMode="contain" />
      </View>

      <ScrollView
        style={styles.createOpportunityPanel}
        contentContainerStyle={styles.createOpportunityContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.createOpportunityTitle}>Criar oportunidade</Text>
        <Text style={styles.createOpportunitySubtitle}>Informações</Text>

        <View style={styles.createOpportunityFields}>
          {campos.map(({ label, options }) => (
            <View key={label} style={styles.createOpportunityFieldGroup}>
              <Text style={styles.createOpportunityLabel}>{label}</Text>
              {options ? <SelectField accessibilityLabel={label} options={options} value={values[label] ?? ''} onChange={(value) => setValues(current => ({ ...current, [label]: value }))} placeholder={`Selecione ${label.toLowerCase()}`} /> : <TextInput accessibilityLabel={label} style={styles.createOpportunityInput} />}
            </View>
          ))}
        </View>

        <View style={styles.createOpportunityAction}>
          <Button wide onPress={() => go('oportunidadesCriadasTecnico')}>Criar Oportunidade</Button>
        </View>
      </ScrollView>
      <BottomNav go={go} role="trainer" active="opportunities" />
    </View>
  )
}
