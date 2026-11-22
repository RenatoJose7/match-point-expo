import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

export function RecoveryInboxScreen({ go, back, routeParams = {} }) {
  return (
    <Shell background={assets.recovery2} back={back} logo>
      <View style={[styles.card, styles.recoveryCard, localStyles.card]}>
        <Text style={[styles.title, styles.center, localStyles.title]}>Verifique sua</Text>
        <Text style={[styles.title, styles.greenTitle, styles.center, localStyles.title]}>Caixa de entrada</Text>
        <Text style={[styles.recoveryCopy, styles.center, localStyles.copy]}>
          Enviamos um e-mail com um link para redefinir sua senha{routeParams.email ? ` para ${routeParams.email}` : ''}.
        </Text>
        <Button onPress={() => go('login')}>Confirmar</Button>
        <Text style={[styles.recoveryCopy, styles.center, localStyles.spam]}>Verifique a pasta de spam e promoções se não recebê-lo.</Text>
      </View>
    </Shell>
  )
}

const localStyles = StyleSheet.create({
  card: { top: '33%', paddingTop: 20, paddingBottom: 22, paddingHorizontal: 24, alignItems: 'center', gap: 4 },
  title: { fontSize: 40, lineHeight: 46 },
  copy: { fontSize: 17, lineHeight: 21, marginTop: 14, marginBottom: 14 },
  spam: { fontSize: 14, lineHeight: 17, marginTop: 14 },
})
