import React from 'react'
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { assets } from '../theme/assets'

const BLUE = '#10579b'
const LIME = '#c4ff32'

const links = {
  opportunities: 'https://www.itftennis.com/en/about-us/itf-world-tennis-tour/',
  serena: 'https://www.wtatennis.com/legends/230234/serena-williams',
  aryna: 'https://www.wtatennis.com/players/320760/name/stats',
}

function openLink(url) {
  Linking.openURL(url).catch(() => {})
}

export function WomenInSportScreen({ go, back }) {
  return (
    <View style={localStyles.screen}>
      <View pointerEvents="none" style={localStyles.ribbon} />
      <View pointerEvents="none" style={localStyles.ribbonMask} />
      <View pointerEvents="none" style={localStyles.ribbonTop} />
      <BackButton onPress={back} style={localStyles.back} />
      <Image source={assets.monogram} style={localStyles.mark} resizeMode="contain" />
      <Text numberOfLines={1} style={localStyles.title}>
        Mulheres <Text style={localStyles.titleConnector}>no</Text> Esporte
      </Text>

      <ScrollView style={localStyles.scroll} contentContainerStyle={localStyles.list} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="link" accessibilityLabel="Conhecer oportunidades no circuito mundial de tênis" onPress={() => openLink(links.opportunities)} style={localStyles.feature}>
          <Image source={assets.womenCourt} style={localStyles.featureImage} resizeMode="cover" />
          <View style={localStyles.featureOverlay} />
          <Text style={localStyles.featureTitle}>Descubra{`\n`}aqui a sua{`\n`}próxima{`\n`}oportunidade</Text>
          <View style={localStyles.tag}><Text style={localStyles.tagText}>Oportunidades</Text></View>
        </Pressable>

        <Pressable accessibilityRole="link" accessibilityLabel="Abrir perfil de Serena Williams na WTA" onPress={() => openLink(links.serena)} style={localStyles.card}>
          <Image source={assets.serena} style={localStyles.serena} resizeMode="contain" />
          <Text style={localStyles.cardTitle}>O legado{`\n`}de <Text style={localStyles.accent}>Serena{`\n`}Williams</Text></Text>
          <View style={localStyles.more}><Text style={localStyles.moreText}>Ver mais</Text></View>
        </Pressable>

        <Pressable accessibilityRole="link" accessibilityLabel="Abrir perfil de Aryna Sabalenka na WTA" onPress={() => openLink(links.aryna)} style={localStyles.card}>
          <Image source={assets.aryna} style={localStyles.aryna} resizeMode="contain" />
          <Text style={localStyles.arynaTitle}>A liderança{`\n`}de <Text style={localStyles.accent}>Aryna{`\n`}Sabalenka</Text></Text>
          <View style={[localStyles.more, localStyles.arynaMore]}><Text style={localStyles.moreText}>Ver mais</Text></View>
        </Pressable>
      </ScrollView>

      <BottomNav go={go} />
    </View>
  )
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE, overflow: 'hidden' },
  ribbon: { position: 'absolute', width: 850, height: 500, left: -240, top: 185, borderRadius: 300, borderWidth: 30, borderColor: '#e5e7e8', opacity: 0.95, transform: [{ rotate: '24deg' }] },
  ribbonMask: { position: 'absolute', zIndex: 1, top: 0, left: 0, right: 0, height: 607, backgroundColor: BLUE },
  ribbonTop: { position: 'absolute', zIndex: 1, width: 560, height: 30, left: -80, top: 179, backgroundColor: '#e5e7e8', opacity: 0.95, transform: [{ rotate: '22deg' }] },
  back: { top: 37, left: 18, zIndex: 3 },
  mark: { position: 'absolute', zIndex: 2, top: 39, alignSelf: 'center', width: 54, height: 57 },
  title: { position: 'relative', zIndex: 2, marginTop: 116, width: '100%', paddingHorizontal: 16, color: LIME, fontFamily: 'Griffiths', fontWeight: '400', fontSize: 40, lineHeight: 46, textAlign: 'center' },
  titleConnector: { color: '#fff' },
  scroll: { zIndex: 2 },
  list: { paddingHorizontal: 13, paddingTop: 33, paddingBottom: 104, gap: 19 },
  feature: { height: 151, borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: '#fff', backgroundColor: '#123f71' },
  featureImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featureOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4, 38, 57, 0.25)' },
  featureTitle: { position: 'absolute', left: 8, top: 3, color: '#fff', fontFamily: 'Griffiths', fontWeight: '400', fontSize: 40, lineHeight: 34 },
  tag: { position: 'absolute', right: 33, bottom: 63, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 1, backgroundColor: LIME },
  tagText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 18 },
  card: { height: 151, borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: '#fff', backgroundColor: '#194f89' },
  serena: { position: 'absolute', left: -18, bottom: -12, width: 252, height: 210 },
  aryna: { position: 'absolute', right: -3, bottom: -5, width: 188, height: 160 },
  cardTitle: { position: 'absolute', right: 10, top: 4, width: 190, color: '#fff', fontFamily: 'Griffiths', fontWeight: '400', fontSize: 40, lineHeight: 37, textAlign: 'right' },
  arynaTitle: { position: 'absolute', left: 9, top: 6, color: '#fff', fontFamily: 'Griffiths', fontWeight: '400', fontSize: 40, lineHeight: 37 },
  accent: { color: LIME },
  more: { position: 'absolute', right: 63, bottom: 10, borderRadius: 12, backgroundColor: LIME, paddingHorizontal: 17, paddingVertical: 1 },
  arynaMore: { left: 48, right: 'auto', width: 91, paddingHorizontal: 0, alignItems: 'center' },
  moreText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 18 },
})
