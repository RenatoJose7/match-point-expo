import React from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../components/accessibility/AppText'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { useFrameSize } from '../theme/layout'
import { styles } from '../theme/styles'

// Frases curtas e sem quebras manuais: o texto se ajusta a qualquer largura de tela.
const profiles = [
  ['Atleta', 'Crie seu perfil esportivo, encontre oportunidades e candidate-se.'],
  ['Treinador', 'Publique oportunidades, encontre atletas e acompanhe as seleções.'],
  ['Instituição', 'Invista em atletas, fortaleça sua marca e acompanhe os resultados.'],
]

const DESIGN_WIDTH = 402
const DESIGN_HEIGHT = 874

export function ProfileChoiceScreen({ go, back, routeParams = {} }) {
  const destinations = ['signupAthlete', 'signupTrainer', 'signupInstitution']
  // Mesmo quadro usado pelo resto do app (no celular, já em escala do modelo).
  const { width: frameWidth, height: frameHeight } = useFrameSize()
  // Tudo encolhe na mesma proporção em telas menores que o modelo (402x874),
  // para os três cartões caberem sem rolagem; em telas maiores fica no tamanho do modelo.
  const scale = Math.max(0.6, Math.min(1, frameWidth / DESIGN_WIDTH, frameHeight / DESIGN_HEIGHT))
  const size = (value) => Math.round(value * scale)

  return (
    <Shell background={assets.choiceCourt} back={back}>
      <View style={[styles.choicePanel, { top: Math.max(76, size(106)), bottom: size(67), paddingTop: size(40), paddingHorizontal: size(28) }]}>
        <ScrollView
          style={styles.choiceScroll}
          contentContainerStyle={[styles.choiceContent, localStyles.choiceContent]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.choiceHeading, { fontSize: size(40), lineHeight: size(46) }]}>Como você quer usar o</Text>
          <Text style={[styles.choiceBrand, { fontSize: size(40), lineHeight: size(46) }]}>Match Point?</Text>
          <View style={[styles.profileList, { marginTop: size(40), gap: size(16) }]}>
            {profiles.map(([accent, copy], index) => (
              <Pressable
                key={accent}
                accessibilityRole="button"
                accessibilityLabel={`${accent}: ${copy}`}
                onPress={() => go(destinations[index], routeParams)}
                style={({ pressed }) => [styles.profileCard, localStyles.profileCard, { minHeight: size(150), paddingVertical: size(14), paddingHorizontal: size(16) }, pressed && styles.pressed]}
              >
                <Text style={[styles.profileTitle, styles.profileAccent, { fontSize: size(40), lineHeight: size(46) }]}>{accent}</Text>
                <Text style={[styles.profileCopy, { fontSize: Math.max(13, size(15)), lineHeight: Math.max(17, size(19)) }]}>{copy}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </Shell>
  )
}

const localStyles = StyleSheet.create({
  // Os três cartões cabem na tela: sem folga extra que gere rolagem à toa.
  choiceContent: {
    paddingBottom: 8,
  },
  profileCard: {
    height: 'auto',
  },
})
