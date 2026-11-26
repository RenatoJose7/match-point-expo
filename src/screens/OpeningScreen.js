import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Text } from '../components/accessibility/AppText'
import { Button } from '../components/ui/Button'
import { assets } from '../theme/assets'
import { frameScale, useFrameSize } from '../theme/layout'
import { ACCESSIBILITY_CORNER, AccessibilityButton } from '../components/accessibility/AccessibilityButton'
import { withGriffithsOverhang } from '../theme/typography'

const LOGO_RATIO = 596 / 420

export function OpeningScreen({ go }) {
  const frame = useFrameSize()
  // Proporcional à altura e à largura: em celulares baixos a logo e os botões continuam inteiros.
  const scale = frameScale(frame, 0.62)
  const heroHeight = frame.height * 0.564
  const logoWidth = Math.min(frame.width * 0.66, heroHeight * 0.62 * LOGO_RATIO)
  const logoHeight = logoWidth / LOGO_RATIO
  // Como no modelo, o centro da logo fica a 63% da altura da foto, sem passar da borda.
  const logoTop = Math.max(8, Math.min(heroHeight * 0.63 - logoHeight * 0.55, heroHeight - logoHeight * 1.1 - 8))

  return (
    <View style={localStyles.screen}>
      <AccessibilityButton style={ACCESSIBILITY_CORNER} />
      <View style={localStyles.hero}>
        <Image source={assets.opening} resizeMode="stretch" style={localStyles.background} />
        <Image source={assets.logo} style={[localStyles.logo, { width: logoWidth, height: logoHeight, marginTop: logoTop }]} resizeMode="contain" />
      </View>
      <View style={[localStyles.card, { paddingTop: Math.round(29 * scale), paddingBottom: Math.round(35 * scale) }]}>
        <View>
          <Text style={[localStyles.title, { fontSize: Math.round(60 * scale), lineHeight: Math.round(52 * scale) }]}>O que você{'\n'}deseja fazer?</Text>
          <Text style={[localStyles.subtitle, { fontSize: Math.max(14, Math.round(18 * scale)), lineHeight: Math.max(17, Math.round(21 * scale)) }]}>Sua próxima oportunidade{'\n'}começa aqui.</Text>
        </View>
        <View style={localStyles.actions}>
          <Button variant="blue" wide onPress={() => go('login')}>Login</Button>
          <Button wide onPress={() => go('choice')}>Cadastro</Button>
        </View>
      </View>
    </View>
  )
}

const localStyles = StyleSheet.create(withGriffithsOverhang({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  hero: { height: '56.4%', width: '100%', alignItems: 'center', overflow: 'hidden', backgroundColor: '#1c5a83' },
  background: { position: 'absolute', top: -5, left: 0, width: '100%', height: '172%' },
  logo: { transform: [{ translateX: -18 }, { scaleY: 1.1 }] },
  // O espaço entre o texto e os botões se ajusta sozinho (space-between), sem altura fixa.
  card: { position: 'absolute', bottom: 0, width: '100%', height: '43.6%', borderTopLeftRadius: 29, borderTopRightRadius: 29, backgroundColor: '#ffffff', paddingHorizontal: '8.5%', justifyContent: 'space-between' },
  title: { fontFamily: 'Griffiths', fontWeight: '400', color: '#10579b', textAlign: 'center', fontSize: 60, lineHeight: 52 },
  subtitle: { marginTop: 10, fontFamily: 'Poppins_400Regular', color: '#10579b', textAlign: 'center', fontSize: 18, lineHeight: 21 },
  actions: { gap: 5 },
}))
