import React from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { BottomNav } from '../../components/navigation/BottomNav'
import { ListHeader } from '../../components/ListHeader'
import { OpportunityRow } from '../../components/OpportunityRow'
import { opportunityRows } from '../../data/content'
import { styles } from '../../theme/styles'

export function OpportunitiesList({ role, go, back, created = false }) {
  const athlete = role === 'athlete'
  const trainer = role === 'trainer'
  const createTarget = trainer ? 'criarOportunidadeTecnico' : 'opportunitiesCreated'

  return (
    <View style={styles.listScreen}>
      <ListHeader title={created ? 'Oportunidades\ncriadas' : 'Oportunidades'} back={back} />
      <View style={styles.filterPills}>
        <Text style={styles.filterActive}>Ativas</Text>
        <Text style={styles.filterPill}>Encerradas</Text>
        {trainer && !created && (
          <Pressable onPress={() => go('oportunidadesCriadasTecnico')}>
            <Text style={styles.filterPill}>Criadas</Text>
          </Pressable>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.listContent}>
        {opportunityRows.slice(0, created ? 1 : 4).map((item, index) => (
          <OpportunityRow
            key={item[0]}
            item={item}
            athlete={athlete}
            index={index}
            delay={70 + index * 55}
            onPress={() => go(athlete ? 'matchScore' : 'candidates')}
          />
        ))}
      </ScrollView>
      {!athlete && (
        <Pressable onPress={() => go(createTarget)} style={styles.createButton}>
          <Text style={styles.createButtonText}>⊕  Criar nova oportunidade</Text>
        </Pressable>
      )}
      <BottomNav go={go} role={role} active="opportunities" />
    </View>
  )
}
