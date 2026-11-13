import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Shell } from '../components/ui/Shell'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

const profiles = [
  ['Sou um ', 'atleta', 'Quero criar meu perfil esportivo,\nencontrar oportunidades e enviar\ncandidaturas.'],
  ['Sou um ', 'treinador', 'Quero publicar oportunidades,\nencontrar atletas e acompanhar\nprocessos seletivos.'],
  ['Sou uma ', 'instituição', 'Quero investir em atletas, fortalecer\nminha marca e acompanhar os\nresultados da parceria.'],
]

export function ProfileChoiceScreen({ go, back, routeParams = {} }) {
  const destinations = ['signupAthlete', 'signupTrainer', 'signupInstitution']

  return (
    <Shell background={assets.court} back={back}>
      <View style={styles.choicePanel}>
        <ScrollView
          style={styles.choiceScroll}
          contentContainerStyle={styles.choiceContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.choiceHeading, localStyles.choiceHeading]}>Como você quer usar o</Text>
          <Text style={[styles.choiceBrand, localStyles.choiceBrand]}>Match Point?</Text>
          <View style={styles.profileList}>
            {profiles.map(([prefix, accent, copy], index) => (
              <Pressable key={accent} onPress={() => go(destinations[index], routeParams)} style={({ pressed }) => [styles.profileCard, localStyles.profileCard, pressed && styles.pressed]}>
                <Text style={[styles.profileTitle, localStyles.profileTitle]}>{prefix}<Text style={styles.profileAccent}>{accent}</Text></Text>
                <Text style={styles.profileCopy}>{copy}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </Shell>
  )
}

const localStyles = StyleSheet.create({
  choiceHeading: {
    fontSize: 40,
    lineHeight: 46,
  },
  choiceBrand: {
    fontSize: 40,
    lineHeight: 46,
  },
  profileCard: {
    minHeight: 158,
    height: 'auto',
    paddingVertical: 12,
  },
  profileTitle: {
    fontSize: 40,
    lineHeight: 46,
  },
})
