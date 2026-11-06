import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { assets } from '../theme/assets'

export function OpeningScreen({ go }) {
  return (
    <View style={localStyles.screen}>
      <View style={localStyles.hero}>
        <Image source={assets.opening} resizeMode="stretch" style={localStyles.background} />
        <Image source={assets.logo} style={localStyles.logo} resizeMode="contain" />
      </View>
      <View style={localStyles.card}>
        <View>
          <Text style={localStyles.title}>O que você{`\n`}deseja fazer?</Text>
          <Text style={localStyles.subtitle}>Sua próxima oportunidade{`\n`}começa aqui.</Text>
        </View>
        <View style={localStyles.actions}>
          <Button variant="blue" wide onPress={() => go('login')}>Login</Button>
          <Button wide onPress={() => go('choice')}>Cadastro</Button>
        </View>
      </View>
    </View>
  )
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  hero: { height: '56.4%', width: '100%', alignItems: 'center', overflow: 'hidden', backgroundColor: '#1c5a83' },
  background: { position: 'absolute', top: -5, left: 0, width: '100%', height: '172%' },
  logo: { width: '66%', aspectRatio: 596 / 420, marginTop: '15%', transform: [{ translateX: -18 }, { scaleY: 1.1 }, { translateY: 5 }] },
  card: { position: 'absolute', bottom: 0, width: '100%', height: '43.6%', borderTopLeftRadius: 29, borderTopRightRadius: 29, backgroundColor: '#ffffff', paddingHorizontal: '8.5%', paddingTop: 29, paddingBottom: 35, justifyContent: 'flex-start', gap: 56 },
  title: { fontFamily: 'Griffiths', fontWeight: '400', color: '#10579b', textAlign: 'center', fontSize: 60, lineHeight: 49 },
  subtitle: { marginTop: 12, fontFamily: 'Poppins_400Regular', color: '#10579b', textAlign: 'center', fontSize: 18, lineHeight: 20 },
  actions: { gap: 5 },
})
