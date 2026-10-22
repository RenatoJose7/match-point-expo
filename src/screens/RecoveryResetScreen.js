import React from 'react'
import { Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

export function RecoveryResetScreen({ go, back }) {
  return (
    <Shell background={assets.recovery3} back={back} logo>
      <View style={[styles.card, styles.recoveryCard, styles.recoveryThree]}>
        <Text style={styles.title}>Atualize sua <Text style={styles.greenTitle}>senha</Text></Text>
        <View style={styles.formGapSmall} />
        <Text style={styles.helper}>Para sua segurança, a nova senha deve ser criada pelo link enviado ao seu e-mail.</Text>
        <View style={styles.formGapSmall} />
        <Button onPress={() => go('login')}>Voltar ao login</Button>
      </View>
    </Shell>
  )
}
