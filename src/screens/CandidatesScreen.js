import React from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'
import { Text } from '../components/accessibility/AppText'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../components/navigation/BottomNav'
import { BackButton } from '../components/ui/BackButton'
import { assets } from '../theme/assets'
import { BLUE } from '../theme/colors'
import { styles } from '../theme/styles'

const opportunityCandidates = [
  { name: 'Mirra Andrade', category: 'Sub-20', date: '28/03/2026', score: '94%', photo: assets.mirra },
  { name: 'Helena Rybakina', category: 'Sub-25', date: '31/03/2026', score: '80%', photo: assets.helena },
]

export function CandidatesScreen({ go, back }) {
  return (
    <View style={styles.opportunityCandidatesScreen}>
      <View style={styles.opportunityCandidatesHeader}>
        <View style={styles.opportunityCandidatesStripe} />
        <BackButton onPress={back} style={styles.opportunityCandidatesBack} />
        <Image source={assets.monogram} style={styles.opportunityCandidatesMark} resizeMode="contain" />
        <Ionicons name="funnel-outline" size={22} color="#fff" style={styles.opportunityCandidatesFilter} />
        <Text style={styles.opportunityCandidatesTitle}>Bolsas de Estudos</Text>
        <Text fixedSize style={styles.opportunityCandidatesPill}>Candidatos</Text>
      </View>

      <ScrollView style={styles.opportunityCandidatesBody} contentContainerStyle={styles.opportunityCandidatesContent} showsVerticalScrollIndicator={false}>
        {opportunityCandidates.map(candidate => (
          <Pressable accessibilityRole="button" key={candidate.name} onPress={() => go('perfilAtletaTecnico')} style={styles.opportunityCandidateCard}>
            <Image source={candidate.photo} style={styles.opportunityCandidatePhoto} />
            <View style={styles.opportunityCandidateCopy}>
              <Text style={styles.opportunityCandidateName}>{candidate.name}</Text>
              <Text style={styles.opportunityCandidateCategory}>{candidate.category}</Text>
              <View style={styles.opportunityCandidateDateRow}>
                <Ionicons name="calendar" size={13} color={BLUE} />
                <Text style={styles.opportunityCandidateDate}>Inscrição em {candidate.date}</Text>
              </View>
            </View>
            <View style={styles.opportunityCandidateScore}>
              <Text style={styles.opportunityCandidateScoreLabel}>Match{`\n`}Score</Text>
              <Text style={styles.opportunityCandidateScoreValue}>{candidate.score}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <BottomNav go={go} role="trainer" active="opportunities" />
    </View>
  )
}
