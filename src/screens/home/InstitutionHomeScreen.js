import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { assets } from '../../theme/assets'

const BLUE = '#10579b'
const LIME = '#c4ff32'

export function InstitutionHomeScreen({ go, repositories, session }) {
  const [profileName, setProfileName] = useState(session?.nome || 'Instituição')
  const [summary, setSummary] = useState({ active: 31, published: 19, underReview: 22, awaiting: 0, candidates: 1300 })

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        let source = repositories
        let profileResult = await source.users.obterPerfilParceiroPorUsuario(session?.id)
        if (!profileResult.ok && repositories.demo) {
          source = repositories.demo
          profileResult = await source.users.obterPerfilParceiroPorUsuario('usuario-instituicao')
        }
        if (!profileResult.ok) return
        let opportunitiesResult = await source.opportunities.listarOportunidadesDoParceiro(profileResult.data.id)
        if (opportunitiesResult.ok && opportunitiesResult.data.length === 0 && repositories.demo) {
          source = repositories.demo
          profileResult = await source.users.obterPerfilParceiroPorUsuario('usuario-instituicao')
          opportunitiesResult = await source.opportunities.listarOportunidadesDoParceiro(profileResult.data.id)
        }
        if (!active || !opportunitiesResult.ok) return
        const opportunities = opportunitiesResult.data
        const candidates = await Promise.all(opportunities.map((item) => source.applications.listarCandidatosDaOportunidade(item.id)))
        const candidateCount = candidates.reduce((total, item) => total + (item.ok ? item.data.length : 0), 0)
        if (!active) return
        const usingDemo = source === repositories.demo
        setProfileName(profileResult.data.nomeExibicao || session?.nome || 'Instituição')
        setSummary(usingDemo ? {
          active: 31,
          published: 19,
          underReview: 22,
          awaiting: 0,
          candidates: 1300,
        } : {
          active: opportunities.filter((item) => item.status === 'ativa').length,
          published: opportunities.filter((item) => item.status === 'ativa').length,
          underReview: candidateCount,
          awaiting: opportunities.filter((item) => item.status === 'rascunho').length,
          candidates: candidateCount,
        })
      } catch {
        // A composição continua disponível com os números demonstrativos seguros.
      }
    }
    load()
    return () => { active = false }
  }, [repositories, session?.id, session?.nome])

  const signOut = () => repositories.authentication.sair()
  const displayName = String(profileName).trim() || 'Instituição'

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Image source={assets.monogram} style={styles.mark} resizeMode="contain" />
        <View style={styles.identity}>
          <View style={styles.initials}><Text style={styles.initialsText}>In</Text></View>
          <View style={styles.identityCopy}>
            <Text numberOfLines={1} style={styles.greeting}>Olá, <Text style={styles.greetingAccent}>{displayName}</Text></Text>
            <Text style={styles.welcome}>Bem-vindo de volta</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={signOut} style={styles.logout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </Pressable>
        <View style={styles.rule} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeading}>
            <View style={styles.cardIcon}><Ionicons name="stats-chart" size={17} color={BLUE} /></View>
            <Text numberOfLines={1} style={styles.cardTitle}>Oportunidades</Text>
            <Pressable accessibilityRole="button" onPress={() => go('opportunitiesInstitution')}><Text style={styles.seeAll}>Ver mais</Text></Pressable>
          </View>
          <View style={styles.opportunityBody}>
            <View style={styles.countBlock}>
              <Text style={styles.countLabel}>Oportunidades{`\n`}ativas</Text>
              <Text style={styles.count}>{summary.active}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdown}>
              <Status color="#45bb49" value={summary.published} label="Divulgadas" />
              <Status color="#1878d3" value={summary.underReview} label="Em análise" />
              <Status color="#f7a715" value={summary.awaiting} label="Aguardando inscrições" />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Criar oportunidade" onPress={() => go('partnerOpportunityForm')} style={styles.createShortcut}>
              <View style={styles.createCircle}><Ionicons name="add" size={28} color="#fff" /></View>
              <Text style={styles.createCaption}>Criar</Text>
            </Pressable>
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={() => go('opportunitiesInstitution')} style={styles.card}>
          <View style={styles.cardHeading}>
            <View style={styles.cardIcon}><Ionicons name="people" size={18} color={BLUE} /></View>
            <Text numberOfLines={1} style={styles.cardTitle}>Candidatos</Text>
            <Text style={styles.seeAll}>Ver mais</Text>
          </View>
          <View style={styles.candidatesBody}>
            <View style={styles.countBlock}>
              <Text style={styles.countLabel}>Candidatos{`\n`}recebidos</Text>
              <Text style={styles.count}>{summary.candidates}</Text>
            </View>
            <View style={styles.facesColumn}>
              <View style={styles.faces}>
                {[assets.coco, assets.mirra, assets.ariana].map((source, index) => <Image key={index} source={source} style={[styles.face, index > 0 && styles.faceOverlap]} />)}
                <View style={[styles.face, styles.faceOverlap, styles.moreFace]}><Text style={styles.moreFaceText}>+9</Text></View>
              </View>
              <Text style={styles.facesCaption}>Novos candidatos aguardando análise</Text>
            </View>
          </View>
        </Pressable>

        <Pressable accessibilityRole="button" onPress={() => go('opportunitiesInstitution')} style={styles.banner}>
          <Text numberOfLines={1} style={styles.bannerTitle}>Transforme talentos</Text>
          <Text numberOfLines={2} style={styles.bannerCopy}>Acompanhe, avalie e descubra talentos.</Text>
          <Text style={styles.bannerCta}>Saiba mais</Text>
          <Image source={assets.trainerBanner} style={styles.bannerImage} resizeMode="contain" />
        </Pressable>
      </ScrollView>
      <BottomNav go={go} role="institution" active="home" />
    </View>
  )
}

function Status({ color, value, label }) {
  return <View style={styles.status}><View style={[styles.statusDot, { backgroundColor: color }]} /><Text style={styles.statusValue}>{value}</Text><Text style={styles.statusLabel}>{label}</Text></View>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },
  header: { height: 177, paddingTop: 18 },
  mark: { width: 51, height: 56, alignSelf: 'center' },
  identity: { position: 'absolute', left: 13, right: 55, top: 106, flexDirection: 'row', alignItems: 'center', gap: 14 },
  initials: { width: 57, height: 57, borderRadius: 30, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: BLUE, fontFamily: 'Griffiths', fontWeight: '400', fontSize: 40, lineHeight: 47 },
  identityCopy: { flex: 1, minWidth: 0 },
  greeting: { color: '#fff', fontFamily: 'Griffiths', fontWeight: '400', fontSize: 40, lineHeight: 46 },
  greetingAccent: { color: LIME },
  welcome: { color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 22 },
  logout: { position: 'absolute', right: 15, top: 116, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  rule: { position: 'absolute', bottom: 0, left: 8, right: 16, height: 1, backgroundColor: LIME },
  content: { paddingHorizontal: 19, paddingTop: 8, paddingBottom: 124, gap: 10 },
  card: { height: 153, borderRadius: 18, backgroundColor: '#fff', padding: 14 },
  cardHeading: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIcon: { width: 27, height: 27, borderRadius: 15, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: BLUE, flex: 1, fontFamily: 'Griffiths', fontWeight: '400', fontSize: 26, lineHeight: 30, minWidth: 0 },
  seeAll: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  opportunityBody: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingTop: 6 },
  candidatesBody: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingTop: 5 },
  countBlock: { width: 126 },
  countLabel: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 22 },
  count: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 36 },
  divider: { width: 1, height: 81, backgroundColor: '#d5d8dc' },
  breakdown: { flex: 1, gap: 7, paddingLeft: 12 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusValue: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, width: 18 },
  statusLabel: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13, flex: 1 },
  createShortcut: { width: 45, alignItems: 'center' },
  createCircle: { width: 39, height: 39, borderRadius: 20, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  createCaption: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 3 },
  facesColumn: { flex: 1, alignItems: 'center' },
  faces: { flexDirection: 'row', alignItems: 'center' },
  face: { width: 41, height: 41, borderRadius: 21, borderWidth: 2, borderColor: '#fff' },
  faceOverlap: { marginLeft: -7 },
  moreFace: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#edf0f2' },
  moreFaceText: { color: '#9da2a7', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  facesCaption: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 5, textAlign: 'center' },
  banner: { height: 140, borderRadius: 17, borderWidth: 1, borderColor: '#fff', overflow: 'hidden', backgroundColor: '#16528b', padding: 12 },
  bannerTitle: { zIndex: 2, color: LIME, fontFamily: 'Griffiths', fontWeight: '400', fontSize: 26, lineHeight: 30 },
  bannerCopy: { zIndex: 2, color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20, marginTop: 4 },
  bannerCta: { zIndex: 2, marginTop: 6, width: 70, borderRadius: 10, backgroundColor: LIME, color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, textAlign: 'center', paddingVertical: 2 },
  bannerImage: { position: 'absolute', right: -4, bottom: -7, width: 150, height: 150 },
})
