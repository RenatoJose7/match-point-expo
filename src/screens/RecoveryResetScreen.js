import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '../components/accessibility/AppText'
import { Button } from '../components/ui/Button'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

// A nova senha é criada na página segura aberta pelo link do e-mail.
// Esta tela confirma o passo final e leva de volta ao login.
export function RecoveryResetScreen({ go, back }) {
  return (
    <Shell background={assets.recovery3} back={back} logo>
      <View style={[styles.card, styles.recoveryCard, localStyles.card]}>
        <Text style={[styles.title, localStyles.title]}>Atualize sua <Text style={styles.greenTitle}>senha</Text></Text>
        <Text style={[styles.recoveryCopy, localStyles.copy]}>
          Abra o link que enviamos para o seu e-mail e crie uma nova senha. Depois, é só voltar e entrar com ela.
        </Text>
        <Button onPress={() => go('login')}>Ir para o login</Button>
      </View>
    </Shell>
  )
}

const localStyles = StyleSheet.create({
  card: { top: '33.3%', paddingTop: 20, paddingBottom: 22, paddingHorizontal: 26, alignItems: 'center', gap: 14 },
  title: { fontSize: 40, lineHeight: 46, alignSelf: 'stretch' },
  copy: { fontSize: 16, lineHeight: 21, alignSelf: 'stretch' },
})
