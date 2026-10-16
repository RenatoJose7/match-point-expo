import React from 'react'
import { Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { OperationFeedback } from '../components/ui/OperationFeedback'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

export function RecoveryInboxScreen({ go, back }) {
  return (
    <Shell background={assets.recovery2} back={back} logo>
      <View style={[styles.card, styles.recoveryCard, styles.recoveryTwo]}>
        <Text style={[styles.title, styles.center]}>Verifique sua</Text>
        <Text style={[styles.title, styles.greenTitle, styles.center, styles.tightTop]}>Caixa de entrada</Text>
        <View style={styles.mailCopy}>
          <OperationFeedback status="success" message="Solicitação enviada. Verifique seu e-mail para redefinir a senha." />
        </View>
        <Button onPress={() => go('recovery3')}>Confirmar</Button>
        <Text style={[styles.recoveryCopy, styles.center, styles.spam]}>Verifique a pasta de spam e{`\n`}promoções se não recebê-lo.</Text>
      </View>
    </Shell>
  )
}
