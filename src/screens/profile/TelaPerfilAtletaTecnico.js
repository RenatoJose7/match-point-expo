import React from 'react'
import { ScrollView, View } from 'react-native'
import { Text } from '../../components/accessibility/AppText'
import { BackButton } from '../../components/ui/BackButton'
import { BottomNav } from '../../components/navigation/BottomNav'
import { styles } from '../../theme/styles'

const informacoes = [
  ['Categoria', 'Tênis'],
  ['Mão dominante', 'Direita'],
  ['Equipe', 'Equipe Guga PIC / Fly'],
  ['Tempo de prática', '3 meses'],
]

export function TelaPerfilAtletaTecnico({ go, back }) {
  return (
    <View style={styles.publicAthleteScreen}>
      <View style={styles.publicAthleteHeader}>
        <BackButton onPress={back} />
        <View style={styles.publicAthleteIdentity}>
          <View style={styles.publicAthleteAvatar}>
            <Text style={styles.publicAthleteAvatarText}>Ju</Text>
          </View>
          <View>
            <Text style={styles.publicAthleteName}>Juliana Santos</Text>
            <Text style={styles.publicAthleteRole}>Atleta</Text>
          </View>
        </View>
      </View>

      <View style={styles.publicAthleteBody}>
        <View style={styles.publicAthleteTabs}>
          <View style={styles.publicAthleteTabActive}>
            <Text style={styles.publicAthleteTabActiveText}>Perfil</Text>
          </View>
          <Text style={styles.publicAthleteTabText}>Documentos</Text>
          <Text style={styles.publicAthleteTabText}>Vídeos</Text>
        </View>

        <ScrollView contentContainerStyle={styles.publicAthleteContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.publicAthleteSectionTitle}>Informações esportivas</Text>
          <View style={styles.publicAthleteGrid}>
            {informacoes.map(([label, value]) => (
              <View key={label} style={styles.publicAthleteInfoCard}>
                <Text style={styles.publicAthleteInfoLabel}>{label}</Text>
                <Text style={styles.publicAthleteInfoValue}>{value}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.publicAthletePerformanceTitle}>Desempenho</Text>
          <View style={styles.publicAthletePerformanceRow}>
            <View>
              <Text style={styles.publicAthletePerformanceLabel}>Organização atual</Text>
              <Text style={styles.publicAthletePerformanceValue}>14</Text>
            </View>
            <View>
              <Text style={styles.publicAthletePerformanceLabel}>Títulos conquistados</Text>
              <Text style={styles.publicAthletePerformanceValue}>6</Text>
            </View>
          </View>
        </ScrollView>
      </View>
      <BottomNav go={go} role="trainer" active="opportunities" />
    </View>
  )
}
