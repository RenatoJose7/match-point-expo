import React from 'react'
import { View } from 'react-native'
import { Text } from '../components/accessibility/AppText'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { styles } from '../theme/styles'

export function AthleteDetailScreen({ go, back }) {
  return (
    <View style={styles.profileScreen}>
      <BackButton onPress={back} />
      <View style={styles.profileIdentity}>
        <View style={styles.avatar}><Text style={styles.avatarText}>Ju</Text></View>
        <View><Text style={styles.profileName}>Juliana Santos</Text><Text style={styles.profileRole}>Atleta</Text></View>
      </View>
      <View style={styles.profileBody}>
        <Text style={styles.sectionTitle}>Informações esportivas</Text>
        <View style={styles.profileGrid}>
          <Text style={styles.infoText}>Modalidade{`\n`}Futebol</Text>
          <Text style={styles.infoText}>Posição{`\n`}Meia</Text>
          <Text style={styles.infoText}>Clube atual{`\n`}Clube Esperança</Text>
          <Text style={styles.infoText}>Tempo de prática{`\n`}8 anos</Text>
        </View>
        <Text style={styles.sectionTitle}>Desempenho</Text>
        <Text style={styles.about}>Clube atual　　　　　 Títulos conquistados{`\n`}14　　　　　　　　　6</Text>
      </View>
      <BottomNav go={go} role="trainer" active="opportunities" />
    </View>
  )
}
