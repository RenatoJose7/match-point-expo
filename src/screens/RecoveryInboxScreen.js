import React from 'react'
import { Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

export function RecoveryInboxScreen({ go, back, routeParams = {} }) {
  return (
    <Shell background={assets.recovery2} back={back} logo>
      <View style={[styles.card, styles.recoveryCard, styles.recoveryTwo]}>
        <Text style={[styles.title, styles.center]}>Verifique sua</Text>
        <Text style={[styles.title, styles.greenTitle, styles.center, styles.tightTop]}>Caixa de entrada</Text>
        <Text style={[styles.recoveryCopy, styles.center, styles.mailCopy]}>Enviamos um e-mail para {routeParams.email || 'sua caixa de entrada'} com um{`\n`}link para redefinir sua senha.</Text>
        <Button onPress={() => go('login')}>Voltar para entrar</Button>
        <Text style={[styles.recoveryCopy, styles.center, styles.spam]}>Verifique a pasta de spam e{`\n`}promoções se não recebê-lo.</Text>
      </View>
    </Shell>
  )
}
