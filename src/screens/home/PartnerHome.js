import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { Header } from '../../components/Header'
import { StatIcon } from '../../components/StatIcon'
import { assets } from '../../theme/assets'
import { BLUE, GREEN } from '../../theme/colors'
import { styles } from '../../theme/styles'
import { withGriffithsWeight } from '../../theme/typography'

export function PartnerHome({ go, role, initials, name, activeCount, candidateCount, bannerPressable = true, repositories, session }) {
  const [summary, setSummary] = useState({ activeCount, candidateCount })
  const [displayName, setDisplayName] = useState(name)
  const Banner = bannerPressable ? Pressable : View
  const opportunitiesTarget = role === 'trainer' ? 'opportunitiesTrainer' : 'opportunitiesInstitution'
  const createTarget = 'partnerOpportunityForm'
  const bannerTarget = role === 'trainer' ? 'partnerOpportunityForm' : 'women'

  useEffect(() => {
    let active = true
    Promise.resolve().then(async () => {
      const partnerResult = await repositories.users.obterPerfilParceiroPorUsuario(session?.id)
      if (!partnerResult.ok) return
      const opportunitiesResult = await repositories.opportunities.listarOportunidadesDoParceiro(partnerResult.data.id)
      if (!opportunitiesResult.ok || !active) return
      const opportunities = opportunitiesResult.data
      const candidates = await Promise.all(opportunities.map(async (item) => repositories.applications.listarCandidatosDaOportunidade(item.id)))
      if (!active) return
      setDisplayName(partnerResult.data.nomeExibicao || name)
      setSummary({
        activeCount: opportunities.filter((item) => item.status === 'ativa').length,
        candidateCount: candidates.reduce((total, result) => total + (result.ok ? result.data.length : 0), 0),
      })
    })
    return () => { active = false }
  }, [repositories, session?.id, name])

  if (role === 'trainer') {
    return (
      <View style={styles.trainerHomeScreen}>
        <Header initials={initials} name={displayName} photoUrl={session?.fotoUrl} subtitle="Bem-vindo de volta" go={go} repositories={repositories} trainer />
        <ScrollView contentContainerStyle={[styles.trainerHomeScroll, localStyles.trainerHomeScroll]} showsVerticalScrollIndicator={false}>
          <View style={[styles.trainerOpportunityCard, localStyles.trainerCard]}>
            <View style={localStyles.cardHeading}>
              <View style={localStyles.cardIcon}><Ionicons name="stats-chart" size={17} color={BLUE} /></View>
              <Text numberOfLines={1} style={localStyles.cardTitle}>Oportunidades</Text>
              <Pressable onPress={() => go(opportunitiesTarget)} hitSlop={10} style={localStyles.seeAllButton}>
                <Text style={localStyles.seeAll}>Ver mais</Text>
              </Pressable>
            </View>

            <View style={[styles.trainerOpportunityBody, localStyles.trainerBody]}>
              <View style={localStyles.countBlock}>
                <Text style={localStyles.countLabel}>Oportunidades{`\n`}ativas</Text>
                <Text style={localStyles.countValue}>{summary.activeCount}</Text>
              </View>
              <View style={localStyles.cardDivider} />
              <View style={styles.trainerStatusList}>
                <View style={styles.trainerStatusRow}>
                  <View style={[styles.trainerStatusDot, styles.trainerStatusDotGreen]} />
                  <Text style={localStyles.statusNumber}>{summary.activeCount}</Text>
                  <Text style={styles.trainerStatusLabel}>Divulgadas</Text>
                </View>
                <View style={styles.trainerStatusRow}>
                  <View style={[styles.trainerStatusDot, styles.trainerStatusDotBlue]} />
                  <Text style={styles.trainerStatusNumber}>{summary.candidateCount}</Text>
                  <Text style={styles.trainerStatusLabel}>Em análise</Text>
                </View>
                <View style={styles.trainerStatusRow}>
                  <View style={[styles.trainerStatusDot, styles.trainerStatusDotOrange]} />
                  <Text style={styles.trainerStatusNumber}>—</Text>
                  <Text style={styles.trainerStatusLabel}>Sem dados adicionais</Text>
                </View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Criar oportunidade" onPress={() => go(createTarget)} style={styles.trainerCreateShortcut}>
                <View style={styles.trainerCreateCircle}><Ionicons name="add" size={28} color="#fff" /></View>
                <Text style={styles.trainerCreateLabel}>Criar</Text>
              </Pressable>
            </View>
          </View>

          <Pressable onPress={() => go(opportunitiesTarget)} style={[styles.trainerCandidatesCard, localStyles.trainerCard]}>
            <View style={localStyles.cardHeading}>
              <View style={localStyles.cardIcon}><Ionicons name="people" size={18} color={BLUE} /></View>
              <Text numberOfLines={1} style={localStyles.cardTitle}>Candidatos</Text>
              <Text style={localStyles.seeAll}>Ver mais</Text>
            </View>
            <View style={[styles.trainerCandidatesBody, localStyles.trainerBody]}>
              <View style={localStyles.countBlock}>
                <Text style={localStyles.countLabel}>Candidatos{`\n`}recebidos</Text>
                <Text style={localStyles.countValue}>{summary.candidateCount}</Text>
              </View>
              <View style={styles.trainerCandidatePreview}>
                <View style={styles.trainerCandidateFaces}>
                  {[assets.coco, assets.mirra, assets.ariana].map((photo, index) => (
                    <Image key={index} source={photo} style={[styles.trainerCandidateFace, index > 0 && styles.trainerCandidateFaceOverlap]} />
                  ))}
                  <View style={[styles.trainerCandidateFace, styles.trainerCandidateFaceOverlap, styles.trainerCandidateMore]}>
                    <Text style={styles.trainerCandidateMoreText}>+{summary.candidateCount}</Text>
                  </View>
                </View>
                <Text style={styles.trainerCandidateCaption}>Novos candidatos aguardando análise</Text>
              </View>
            </View>
          </Pressable>

          <Banner {...(bannerPressable ? { onPress: () => go(bannerTarget) } : {})} style={[styles.trainerTalentBanner, localStyles.trainerBanner]}>
            <Text numberOfLines={1} style={localStyles.bannerTitle}>Transforme talentos</Text>
            <Text style={localStyles.bannerCopy}>Acompanhe, avalie e{`\n`}descubra o próximo{`\n`}destaque do esporte.</Text>
            <Text style={localStyles.bannerCta}>Saiba mais</Text>
            <Image source={assets.trainerBanner} style={styles.trainerBannerPerson} resizeMode="contain" />
          </Banner>
        </ScrollView>
        <BottomNav go={go} role="trainer" />
      </View>
    )
  }

  return (
    <View style={styles.home}>
      <Header initials={initials} name={displayName} photoUrl={session?.fotoUrl} subtitle="Bem-vindo de volta" go={go} repositories={repositories} trainer />
      <ScrollView contentContainerStyle={[styles.homeScroll, localStyles.partnerHomeScroll]}>
        <View style={[styles.whiteCard, styles.trainerCard, localStyles.partnerCard]}>
          <View style={localStyles.cardHeading}>
            <View style={localStyles.cardIcon}><Ionicons name="stats-chart" size={17} color={BLUE} /></View>
            <Text numberOfLines={1} style={localStyles.cardTitle}>Oportunidades</Text>
            <Pressable onPress={() => go(opportunitiesTarget)} hitSlop={10} style={localStyles.seeAllButton}>
              <Text style={localStyles.seeAll}>Ver mais</Text>
            </Pressable>
          </View>
          <View style={localStyles.partnerStats}>
            <Text style={styles.smallBlue}>Oportunidades{`\n`}ativas{`\n`}<Text style={styles.bigNumber}>{summary.activeCount}</Text></Text>
            <Text style={styles.smallBlue}>●　<Text style={styles.statNumber}>{summary.activeCount}</Text> Divulgadas{`\n`}●　<Text style={styles.statNumber}>{summary.candidateCount}</Text> Candidatos{`\n`}●　<Text style={styles.statNumber}>—</Text> Dados adicionais</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Criar oportunidade" onPress={() => go(createTarget)} style={styles.createOpportunityShortcut}>
              <Text style={styles.createOpportunityShortcutPlus}>+</Text>
              <Text style={styles.createOpportunityShortcutLabel}>Criar</Text>
            </Pressable>
          </View>
        </View>
        <Pressable onPress={() => go(opportunitiesTarget)} style={[styles.whiteCard, styles.trainerCard, localStyles.partnerCard]}>
          <View style={localStyles.cardHeading}>
            <View style={localStyles.cardIcon}><Ionicons name="people" size={18} color={BLUE} /></View>
            <Text numberOfLines={1} style={localStyles.cardTitle}>Candidatos</Text>
            <Text style={localStyles.seeAll}>Ver mais</Text>
          </View>
          <View style={localStyles.partnerStats}>
            <Text style={styles.smallBlue}>Candidatos{`\n`}recebidos{`\n`}<Text style={styles.bigNumber}>{summary.candidateCount}</Text></Text>
            <Text style={styles.candidateFaces}>● ● ●　<Text style={styles.muted}>+{summary.candidateCount}</Text>{`\n`}<Text style={styles.tiny}>Candidatos nas oportunidades da conta</Text></Text>
          </View>
        </Pressable>
        <Banner {...(bannerPressable ? { onPress: () => go(bannerTarget) } : {})} style={[styles.heroBanner, styles.trainerBanner, localStyles.partnerBanner]}>
          <Text numberOfLines={1} style={localStyles.bannerTitle}>Transforme talentos</Text>
          <Text style={localStyles.bannerCopy}>Acompanhe, avalie e{`\n`}descubra o próximo{`\n`}destaque do esporte.</Text>
          <Text style={localStyles.bannerCta}>Saiba mais</Text>
          <Image source={assets.trainerBanner} style={styles.bannerPerson} resizeMode="contain" />
        </Banner>
      </ScrollView>
      <BottomNav go={go} role={role} />
    </View>
  )
}

const localStyles = StyleSheet.create(withGriffithsWeight({
  trainerHomeScroll: {
    paddingBottom: 124,
    gap: 14,
  },
  trainerCard: {
    minHeight: 218,
    height: 'auto',
    paddingBottom: 16,
  },
  trainerBody: {
    minHeight: 152,
    paddingTop: 8,
  },
  trainerBanner: {
    minHeight: 172,
    height: 'auto',
  },
  countBlock: {
    width: 132,
  },
  countLabel: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 22,
  },
  countValue: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 34,
  },
  cardDivider: {
    width: 1,
    alignSelf: 'stretch',
    minHeight: 112,
    backgroundColor: '#d5d8dc',
  },
  statusList: {
    flex: 1,
    gap: 10,
    paddingLeft: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 26,
  },
  statusNumber: {
    width: 31,
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  statusLabel: {
    flex: 1,
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 22,
  },
  createShortcut: {
    width: 58,
    alignItems: 'center',
  },
  createLabel: {
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 4,
  },
  candidateCaption: {
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 7,
    textAlign: 'center',
  },
  partnerHomeScroll: {
    paddingBottom: 124,
    gap: 14,
  },
  partnerCard: {
    minHeight: 218,
    height: 'auto',
    padding: 15,
  },
  partnerStats: {
    flex: 1,
    minHeight: 154,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerBanner: {
    minHeight: 172,
    height: 'auto',
  },
  cardHeading: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 4,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: BLUE,
    fontFamily: 'Griffiths',
    fontSize: 40,
    lineHeight: 46,
  },
  seeAllButton: {
    marginLeft: 'auto',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  seeAll: {
    marginLeft: 'auto',
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  bannerTitle: {
    zIndex: 2,
    color: GREEN,
    fontFamily: 'Griffiths',
    fontSize: 40,
    lineHeight: 46,
  },
  bannerCopy: {
    zIndex: 2,
    color: '#ffffff',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 4,
  },
  bannerCta: {
    zIndex: 2,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: GREEN,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    color: BLUE,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
}))
