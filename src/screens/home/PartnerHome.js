import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../../components/accessibility/AppText'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { Header } from '../../components/Header'
import { StatIcon } from '../../components/StatIcon'
import { assets } from '../../theme/assets'
import { BLUE, GREEN } from '../../theme/colors'
import { styles } from '../../theme/styles'
import { useHeightFit } from '../../theme/layout'
import { withGriffithsWeight } from '../../theme/typography'
import { loadPartnerOpportunities, summarizePartnerOpportunities } from '../partner/partnerOpportunitiesData'

export function PartnerHome({ go, role, initials, name, activeCount, candidateCount, bannerPressable = true, repositories, session }) {
  const fit = useHeightFit()
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
      // Mesma lista da tela Oportunidades (com os exemplos): os números sempre batem.
      const data = await loadPartnerOpportunities(repositories, session).catch(() => null)
      if (!data || !active) return
      setDisplayName(partnerResult.data.nomeExibicao || name)
      setSummary(summarizePartnerOpportunities(data))
    })
    return () => { active = false }
  }, [repositories, session?.id, name])

  if (role === 'trainer') {
    return (
      <View style={styles.trainerHomeScreen}>
        <Header initials={initials} name={displayName} photoUrl={session?.fotoUrl} subtitle="Bem-vindo de volta" go={go} repositories={repositories} trainer />
        <ScrollView contentContainerStyle={[styles.trainerHomeScroll, localStyles.trainerHomeScroll, { paddingTop: fit(9, 5), gap: fit(9, 4) }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.trainerOpportunityCard, localStyles.trainerCard]}>
            <View style={localStyles.cardHeading}>
              <View style={localStyles.cardIcon}><Ionicons name="stats-chart" size={17} color={BLUE} /></View>
              <Text numberOfLines={1} style={localStyles.cardTitle}>Oportunidades</Text>
              <Pressable accessibilityRole="button" onPress={() => go(opportunitiesTarget)} hitSlop={10} style={localStyles.seeAllButton}>
                <Text style={localStyles.seeAll}>Ver mais</Text>
              </Pressable>
            </View>

            <View style={[styles.trainerOpportunityBody, localStyles.trainerBody]}>
              <View style={localStyles.countBlock}>
                <Text style={localStyles.countLabel}>Oportunidades{`\n`}ativas</Text>
                <Text style={localStyles.countValue}>{summary.activeCount}</Text>
              </View>
              <View style={localStyles.cardDivider} />
              <View style={[styles.trainerStatusList, localStyles.statusList]}>
                <View style={[styles.trainerStatusRow, localStyles.statusRow]}>
                  <View style={[styles.trainerStatusDot, styles.trainerStatusDotGreen, localStyles.statusDot]} />
                  <Text style={localStyles.statusNumber}>{summary.activeCount}</Text>
                  <Text numberOfLines={2} style={[styles.trainerStatusLabel, localStyles.statusLabel]}>Divulgadas</Text>
                </View>
                <View style={[styles.trainerStatusRow, localStyles.statusRow]}>
                  <View style={[styles.trainerStatusDot, styles.trainerStatusDotBlue, localStyles.statusDot]} />
                  <Text style={localStyles.statusNumber}>{summary.reviewCount ?? 0}</Text>
                  <Text numberOfLines={2} style={[styles.trainerStatusLabel, localStyles.statusLabel]}>Em análise</Text>
                </View>
                <View style={[styles.trainerStatusRow, localStyles.statusRow]}>
                  <View style={[styles.trainerStatusDot, styles.trainerStatusDotOrange, localStyles.statusDot]} />
                  <Text style={localStyles.statusNumber}>{summary.waitingCount ?? 0}</Text>
                  <Text numberOfLines={2} style={[styles.trainerStatusLabel, localStyles.statusLabel]}>Aguardando inscrições</Text>
                </View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Criar oportunidade" onPress={() => go(createTarget)} style={styles.trainerCreateShortcut}>
                <View style={styles.trainerCreateCircle}><Ionicons name="add" size={28} color="#fff" /></View>
                <Text style={styles.trainerCreateLabel}>Criar</Text>
              </Pressable>
            </View>
          </View>

          <Pressable accessibilityRole="button" onPress={() => go(opportunitiesTarget)} style={[styles.trainerCandidatesCard, localStyles.trainerCard]}>
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
                  {/* Quantas fotos aparecem e o "+N" vêm do total de candidatos, para nunca contradizer o número. */}
                  {[assets.coco, assets.mirra, assets.ariana].slice(0, Math.min(3, summary.candidateCount ?? 0)).map((photo, index) => (
                    <Image key={index} source={photo} style={[styles.trainerCandidateFace, index > 0 && styles.trainerCandidateFaceOverlap]} />
                  ))}
                  {(summary.candidateCount ?? 0) > 3 ? (
                    <View style={[styles.trainerCandidateFace, styles.trainerCandidateFaceOverlap, styles.trainerCandidateMore]}>
                      <Text style={styles.trainerCandidateMoreText}>+{summary.candidateCount - 3}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.trainerCandidateCaption, localStyles.candidateCaption]}>{(summary.candidateCount ?? 0) > 0 ? 'Novos candidatos aguardando análise' : 'Nenhum candidato ainda'}</Text>
              </View>
            </View>
          </Pressable>

          <Banner {...(bannerPressable ? { onPress: () => go(bannerTarget) } : {})} style={[styles.trainerTalentBanner, localStyles.trainerBanner, { minHeight: fit(152, 12) }]}>
            <Text numberOfLines={1} style={localStyles.bannerTitle}>Transforme talentos</Text>
            <Text style={localStyles.bannerCopy}>Acompanhe e avalie os{`\n`}próximos talentos.</Text>
            <Text fixedSize numberOfLines={1} style={localStyles.bannerCta}>Saiba mais</Text>
            <Image source={assets.trainerBanner} style={[styles.trainerBannerPerson, localStyles.bannerPerson]} resizeMode="contain" />
          </Banner>
        </ScrollView>
        <BottomNav go={go} role="trainer" />
      </View>
    )
  }

  return (
    <View style={styles.home}>
      <Header initials={initials} name={displayName} photoUrl={session?.fotoUrl} subtitle="Bem-vindo de volta" go={go} repositories={repositories} trainer />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.homeScroll, localStyles.partnerHomeScroll]}>
        <View style={[styles.whiteCard, styles.trainerCard, localStyles.partnerCard]}>
          <View style={localStyles.cardHeading}>
            <View style={localStyles.cardIcon}><Ionicons name="stats-chart" size={17} color={BLUE} /></View>
            <Text numberOfLines={1} style={localStyles.cardTitle}>Oportunidades</Text>
            <Pressable accessibilityRole="button" onPress={() => go(opportunitiesTarget)} hitSlop={10} style={localStyles.seeAllButton}>
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
        <Pressable accessibilityRole="button" onPress={() => go(opportunitiesTarget)} style={[styles.whiteCard, styles.trainerCard, localStyles.partnerCard]}>
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
          <Text fixedSize numberOfLines={1} style={localStyles.bannerCta}>Saiba mais</Text>
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
    gap: 9,
  },
  trainerCard: {
    minHeight: 172,
    height: 172,
    paddingBottom: 10,
  },
  trainerBody: {
    minHeight: 105,
    paddingTop: 1,
    paddingBottom: 9,
  },
  // Altura mínima (não fixa): o texto nunca se sobrepõe em telas baixas.
  trainerBanner: {
    minHeight: 152,
    height: 'auto',
    paddingTop: 11,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  countBlock: {
    width: 118,
  },
  countLabel: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 15,
  },
  countValue: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 32,
    lineHeight: 38,
  },
  cardDivider: {
    width: 1,
    height: 78,
    alignSelf: 'center',
    backgroundColor: '#d5d8dc',
  },
  statusList: {
    flex: 1,
    gap: 7,
    paddingLeft: 8,
    minWidth: 0,
    paddingRight: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 22,
  },
  statusDot: {
    marginRight: 5,
  },
  statusNumber: {
    width: 26,
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16, lineHeight: 20,
  },
  statusLabel: {
    flex: 1,
    minWidth: 0,
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    lineHeight: 13,
  },
  createShortcut: {
    width: 58,
    alignItems: 'center',
  },
  createLabel: {
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    lineHeight: 13,
    marginTop: 4,
  },
  candidateCaption: {
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    lineHeight: 13,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  partnerHomeScroll: {
    paddingBottom: 124,
    gap: 9,
  },
  partnerCard: {
    minHeight: 153,
    height: 153,
    padding: 14,
  },
  partnerStats: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerBanner: {
    minHeight: 140,
    height: 140,
  },
  cardHeading: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 1,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 15,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flexShrink: 1,
    minWidth: 0,
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
    fontSize: 11,
  },
  bannerTitle: {
    zIndex: 2,
    maxWidth: 286,
    color: GREEN,
    fontFamily: 'Griffiths',
    fontSize: 40,
    lineHeight: 46,
  },
  bannerCopy: {
    zIndex: 2,
    maxWidth: 205,
    color: '#ffffff',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 16,
    marginTop: 4,
  },
  bannerCta: {
    zIndex: 2,
    marginTop: 6,
    minWidth: 72,
    height: 15,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignSelf: 'flex-start',
    color: BLUE,
    fontFamily: 'Poppins_500Medium',
    fontSize: 9,
    lineHeight: 15,
    textAlign: 'center',
  },
  bannerPerson: {
    zIndex: 1,
    right: -3,
    bottom: -4,
    width: 126,
    height: 126,
  },
}))
