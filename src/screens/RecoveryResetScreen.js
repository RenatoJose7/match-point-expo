import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

export function RecoveryResetScreen({ go, back }) {
  return (
    <Shell background={assets.recovery3} back={back} logo>
      <View style={[styles.card, styles.recoveryCard, styles.recoveryThree, localStyles.card]}>
        <Text style={[styles.title, localStyles.title]}>Atualize sua <Text style={styles.greenTitle}>senha</Text></Text>
        <View style={localStyles.action}>
          <Button onPress={() => go('login')}>Confirmar</Button>
        </View>
      </View>
    </Shell>
  )
}

const localStyles = StyleSheet.create({
  card: { top: '32.2%' },
  title: { fontSize: 40, lineHeight: 46 },
  action: { position: 'absolute', bottom: 18, alignSelf: 'center' },
})
