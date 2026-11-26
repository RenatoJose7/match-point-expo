import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../../components/accessibility/AppText'
import { Feather, Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { Header } from '../../components/Header'
import { assets } from '../../theme/assets'
import { ABSOLUTE_FILL, BLUE, GREEN } from '../../theme/colors'
import { styles } from '../../theme/styles'
import { fitValue, isNumericValue, withGriffithsWeight } from '../../theme/typography'
import { loadAthleteApplications, summarizeApplications } from '../applications/athleteApplications'
import { computeMatchScore } from '../../domain/matchScore.js'
import { useFrameSize } from '../../theme/layout'

export function AthleteHomeScreen({ go, repositories, session }) {
  // Em telas um pouco mais baixas que o modelo, os espaços extras cedem (até 80 px)
  // para a tela inicial caber inteira, sem rolagem à toa.
  const frame = useFrameSize()
  const squeeze = Math.min(1, Math.max(0, 874 - frame.height) / 40)
  const fit = (value, reduction) => Math.round(value - reduction * squeeze)
  // Os dois cartões do topo cabem lado a lado em qualquer largura (antes o segundo ficava cortado).
  const topCardsWidth = frame.width - 32 - 9
  const profileCardWidth = Math.round(Math.min(150, topCardsWidth * 0.37))
  const performanceCardWidth = topCardsWidth - profileCardWidth
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [opportunity, setOpportunity] = useState(null)
  const [opportunityScore, setOpportunityScore] = useState(null)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        const athleteResult = await repositories.users.obterPerfilAtletaPorUsuario(session?.id)
        if (!active) return

        if (athleteResult?.ok) {
          setProfile(athleteResult.data)
          // Atletas cadastrados antes de o nome ir para o perfil esportivo: grava agora,
          // para o responsável ver o nome na lista de vinculados.
          if (!athleteResult.data.nome && session?.nome && repositories.users.atualizarPerfilAtleta) {
            repositories.users.atualizarPerfilAtleta(athleteResult.data.id, { nome: session.nome }).catch(() => null)
          }
        }

        // Mesma lista da tela Candidaturas (com os exemplos): os números da home sempre batem.
        const [applicationsList, opportunitiesResult] = await Promise.all([
          loadAthleteApplications(repositories, session?.id).catch(() => []),
          repositories.opportunities.listarOportunidades({ status: 'ativa', prazoAberto: true }),
        ])
        if (!active) return
        setApplications(applicationsList)

        let openOpportunities = opportunitiesResult?.ok ? opportunitiesResult.data ?? [] : []
        if (openOpportunities.length === 0 && repositories.demo) {
          const demoResult = await repositories.demo.opportunities.listarOportunidades({ status: 'ativa', prazoAberto: true })
          openOpportunities = demoResult?.ok ? demoResult.data ?? [] : []
        }
        if (!active) return

        // Destaca a oportunidade mais compatível com o perfil de quem está logado.
        const ranked = athleteResult?.ok
          ? openOpportunities
            .map((item) => ({ item, score: computeMatchScore(athleteResult.data, item).percentualTotal }))
            .sort((first, second) => second.score - first.score)
          : openOpportunities.map((item) => ({ item, score: null }))
        setOpportunity(ranked[0]?.item ?? null)
        setOpportunityScore(ranked[0]?.score ?? null)
      } catch {
        // Preserva fallback limpo em caso de erro
      }
    }

    loadData()
    return () => { active = false }
  }, [repositories, session?.id])

  const applicationsSummary = summarizeApplications(applications)

  const hasRanking = Boolean(profile?.ranking)
  // O ranking pode ser digitado como frase ("Não possuo ranking"): aí não leva # nem "de 146".
  const numericRanking = hasRanking && isNumericValue(String(profile.ranking).replace(/[º°]/g, ''))
  const rankingDisplay = hasRanking
    ? (numericRanking ? `#${String(profile.ranking).replace(/[#º°]/g, '').trim()}` : String(profile.ranking).trim())
    : '#24'
  // Dado não informado vira exemplo; dado informado (mesmo "Não possuo ranking") vale como está.
  const rankingTotal = hasRanking
    ? (numericRanking ? `de ${profile.totalRanking || 146}` : '')
    : 'de 146'

  // Exemplos coerentes com o perfil: quem informou que não disputou torneios fica com 0 a 0;
  // com um número de torneios, o exemplo nunca passa desse total.
  const tournamentsText = String(profile?.torneiosDisputados ?? '').trim()
  const tournaments = /^\d+$/.test(tournamentsText) ? Number(tournamentsText) : null
  const noTournaments = tournaments === 0 || (tournamentsText !== '' && tournaments === null)
  const exampleWins = noTournaments ? 0 : Math.min(3, tournaments ?? 3)
  const exampleLosses = noTournaments ? 0 : Math.min(1, Math.max(0, (tournaments ?? 4) - exampleWins))
  const vitorias = profile?.vitorias ?? exampleWins
  const derrotas = profile?.derrotas ?? exampleLosses

  const profileCompletionPercent = (() => {
    if (!profile) return null
    const relevantFields = [
      'modalidade', 'categoria', 'posicao', 'maoDominante', 'equipeAtual',
      'tempoDePratica', 'localizacao', 'biografia', 'ranking', 'torneiosDisputados',
      'titulos', 'dataNascimento',
    ]
    const filled = relevantFields.filter((key) => Boolean(profile[key] && String(profile[key]).trim())).length
    if (filled === 0) return 82
    return Math.round((filled / relevantFields.length) * 100)
  })()

  const displayedCompletion = profileCompletionPercent !== null
    ? `${profileCompletionPercent}%`
    : '—'

  const displayedScore = opportunityScore !== null
    ? `${opportunityScore}%`
    : (opportunity ? '94%' : '—')

  const displayedAppsCount = applicationsSummary.total
  const displayedUnderReview = applicationsSummary.underReview
  const displayedRejected = applicationsSummary.rejected

  return (
    <View style={styles.home}>
      <Header
        initials={(session?.nome || 'Atleta').slice(0, 2)}
        name={session?.nome || 'Atleta'}
        photoUrl={session?.fotoUrl}
        subtitle="Atleta"
        go={go}
        repositories={repositories}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[localStyles.scrollContent, { paddingTop: fit(10, 6), gap: fit(9, 4) }]}>
        {/* Carrossel de Cards: Desempenho e Perfil */}
        <View style={localStyles.carouselContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={localStyles.carouselContent}
            decelerationRate="fast"
            snapToInterval={292}
            snapToAlignment="start"
          >
            {/* Card 1: Seu desempenho */}
            <View style={[localStyles.whiteCard, localStyles.performanceCard, { width: performanceCardWidth }]}>
              <View style={localStyles.cardHeading}>
                <View style={localStyles.cardIconCircle}>
                  <View style={localStyles.barChartIcon}>
                    <View style={[localStyles.barItem, { height: 12 }]} />
                    <View style={[localStyles.barItem, { height: 17 }]} />
                    <View style={[localStyles.barItem, { height: 9 }]} />
                  </View>
                </View>
                <Text style={[localStyles.cardScript, localStyles.topCardScript]}>Seu desempenho</Text>
              </View>

              <View style={localStyles.performanceBody}>
                <Text style={localStyles.rankingLabel}>Ranking Regional</Text>
                <View style={localStyles.rankingRow}>
                  <Text numberOfLines={2} style={[localStyles.rankingValue, fitValue(rankingDisplay, 34, { fits: 5, textSize: 16 })]}>{rankingDisplay}</Text>
                  {rankingTotal ? <Text style={localStyles.rankingTotal}>{rankingTotal}</Text> : null}
                </View>

                <View style={localStyles.statsRow}>
                  <View style={localStyles.statCol}>
                    <Text style={localStyles.statLabel}>Vitórias</Text>
                    <Text numberOfLines={2} style={[localStyles.statNumber, fitValue(vitorias, 24, { fits: 3, textSize: 13 })]}>{vitorias}</Text>
                  </View>
                  <View style={localStyles.statCol}>
                    <Text style={localStyles.statLabel}>Derrotas</Text>
                    <Text numberOfLines={2} style={[localStyles.statNumber, fitValue(derrotas, 24, { fits: 3, textSize: 13 })]}>{derrotas}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Card 2: Seu perfil */}
            <View style={[localStyles.whiteCard, localStyles.profileCard, { width: profileCardWidth }]}>
              <View style={localStyles.cardHeading}>
                <Text style={[localStyles.cardScript, localStyles.topCardScript]}>Seu perfil</Text>
              </View>

              <View style={localStyles.gaugeWrapper}>
                <View style={localStyles.gaugeRing} />
                <View style={localStyles.gaugeCenter}>
                  <Text numberOfLines={1} style={[localStyles.gaugeValue, fitValue(displayedCompletion, 20, { fits: 3 })]}>{displayedCompletion}</Text>
                  <Text style={localStyles.gaugeLabel}>completo</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Card: Oportunidades para você */}
        <View style={[localStyles.whiteCard, localStyles.oppCard, { minHeight: fit(178, 18) }]}>
          <View style={localStyles.cardHeading}>
            <View style={localStyles.cardIconCircle}>
              <Ionicons name="star" size={17} color={BLUE} />
            </View>
            <Text numberOfLines={1} style={[localStyles.cardScript, localStyles.oppHeading]}>Oportunidades</Text>
          </View>

          <View style={localStyles.matchBadge}>
            <Text fixedSize style={localStyles.matchBadgeLabel}>Match{'\n'}Score</Text>
            <Text fixedSize numberOfLines={1} style={[localStyles.matchBadgeValue, fitValue(displayedScore, 31, { fits: 3 })]}>{displayedScore}</Text>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel={`Ver Match Score de ${opportunity?.titulo || 'Bolsa de Estudos'}`} onPress={() => (opportunity?.id ? go('matchScore', { opportunityId: opportunity.id }) : go('opportunitiesAthlete'))} style={localStyles.oppRow}>
            <Image source={assets.opportunityMountains} style={[localStyles.oppImage, { width: fit(98, 22), height: fit(98, 22) }]} />
            <View style={localStyles.oppCopy}>
              <Text numberOfLines={2} style={localStyles.oppTitle}>
                {opportunity?.titulo || 'Bolsa de Estudos'}
              </Text>
              <View style={localStyles.oppMetaRow}>
                <Feather name="briefcase" size={12} color={BLUE} style={localStyles.metaIcon} />
                <Text numberOfLines={2} style={localStyles.oppMetaText}>
                  {opportunity?.instituicao
                    ? `${opportunity.instituicao}${opportunity.categoria ? ` - ${opportunity.categoria}` : ''}`
                    : opportunity ? (opportunity.categoria || 'Instituição não informada') : 'Instituto Atleta do Futuro - Universitário'}
                </Text>
              </View>
              <View style={localStyles.oppMetaRow}>
                <Feather name="map-pin" size={12} color={BLUE} style={localStyles.metaIcon} />
                <Text numberOfLines={2} style={localStyles.oppMetaText}>
                  {opportunity ? (opportunity.localizacao || 'Local não informado') : 'Suzano - SP'}
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver todas as oportunidades"
            onPress={() => go('opportunitiesAthlete')}
            style={localStyles.oppSeeAllContainer}
          >
            <Text style={localStyles.oppSeeAll}>Ver todas</Text>
          </Pressable>
        </View>

        {/* Card: Minhas candidaturas */}
        <View style={[localStyles.whiteCard, localStyles.applicationsCard, { minHeight: fit(110, 10) }]}>
          <View style={localStyles.cardHeading}>
            <View style={localStyles.cardIconCircle}>
              <Feather name="calendar" size={17} color={BLUE} />
            </View>
            <Text numberOfLines={1} style={localStyles.cardScript}>Candidaturas</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver todas as candidaturas"
              onPress={() => go('applications')}
              style={localStyles.seeAllRightButton}
            >
              <Text style={localStyles.seeAllRight}>Ver todos</Text>
            </Pressable>
          </View>

          <View style={localStyles.applicationsStatsRow}>
            <View style={localStyles.appStatCol}>
              <Text style={localStyles.appStatNumber}>{displayedAppsCount}</Text>
              <Text numberOfLines={1} style={localStyles.appStatLabel}>Candidaturas</Text>
            </View>
            <View style={localStyles.vDivider} />
            <View style={localStyles.appStatCol}>
              <Text style={localStyles.appStatNumber}>{displayedUnderReview}</Text>
              <Text numberOfLines={1} style={localStyles.appStatLabel}>Em análise</Text>
            </View>
            <View style={localStyles.vDivider} />
            <View style={localStyles.appStatCol}>
              <Text style={localStyles.appStatNumber}>{displayedRejected}</Text>
              <Text numberOfLines={1} style={localStyles.appStatLabel}>Não selecionadas</Text>
            </View>
          </View>
        </View>

        {/* Hero Banner: Mulheres no esporte */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Saiba mais sobre Mulheres no esporte"
          onPress={() => go('women')}
          style={[localStyles.heroBanner, { minHeight: fit(126, 12) }]}
        >
          <Text numberOfLines={1} style={localStyles.bannerTitle}>Mulheres no esporte</Text>
          <Text style={localStyles.bannerCopy}>Incentivando talentos.{'\n'}Transformando o futuro</Text>
          <View style={localStyles.bannerCtaBadge}>
            <Text fixedSize style={localStyles.bannerCtaText}>Saiba mais</Text>
          </View>
          <Image source={assets.athleteBanner} style={localStyles.bannerPerson} resizeMode="contain" />
        </Pressable>
      </ScrollView>
      <BottomNav go={go} active="home" />
    </View>
  )
}

const localStyles = StyleSheet.create(withGriffithsWeight({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 94,
    gap: 9,
  },
  topCardScript: { fontSize: 20, lineHeight: 26, paddingRight: 14 },
  carouselContainer: {
    marginHorizontal: -16,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: 9,
  },
  whiteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
  },
  // Altura mínima: com texto maior (acessibilidade) o cartão cresce em vez de cortar.
  performanceCard: {
    width: 280,
    minHeight: 140,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  profileCard: {
    width: 185,
    minHeight: 140,
    paddingHorizontal: 10,
    paddingVertical: 8,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 36,
    overflow: 'visible',
  },
  oppHeading: {
    flex: 1,
    minWidth: 0,
    paddingRight: 76,
  },
  cardIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barChartIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2.2,
    height: 17,
    justifyContent: 'center',
  },
  barItem: {
    width: 3.2,
    backgroundColor: BLUE,
    borderRadius: 1.6,
  },
  cardScript: {
    fontFamily: 'Griffiths',
    color: BLUE,
    fontSize: 40,
    lineHeight: 46,
    flexShrink: 1,
    paddingTop: 3,
    paddingBottom: 3,
    // Folga para o último traço inclinado da fonte não ser cortado.
    paddingRight: 6,
  },
  performanceBody: {
    marginTop: -3,
  },
  rankingLabel: {
    color: BLUE,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14, lineHeight: 18,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: -1,
  },
  rankingValue: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 34,
    lineHeight: 34,
  },
  rankingTotal: {
    color: '#6d7884',
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    marginLeft: 6,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 92,
    marginTop: 0,
  },
  statCol: {
    gap: 1,
  },
  statLabel: {
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11, lineHeight: 14,
  },
  statNumber: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    lineHeight: 25,
  },
  gaugeWrapper: {
    width: 84,
    height: 84,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
    position: 'relative',
  },
  gaugeRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4.5,
    borderColor: BLUE,
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-35deg' }],
  },
  gaugeCenter: {
    ...ABSOLUTE_FILL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValue: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  gaugeLabel: {
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11, lineHeight: 13,
    textAlign: 'center',
    marginTop: -1,
  },
  oppCard: {
    padding: 10,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 178,
  },
  matchBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 82,
    height: 100,
    backgroundColor: GREEN,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
  },
  matchBadgeLabel: {
    color: BLUE,
    fontFamily: 'Poppins_500Medium',
    fontSize: 18,
    lineHeight: 17,
    textAlign: 'center',
  },
  matchBadgeValue: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 31,
    lineHeight: 34,
    textAlign: 'center',
  },
  oppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 7,
    paddingRight: 80,
  },
  oppImage: {
    width: 98,
    height: 98,
    borderRadius: 10,
  },
  oppCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  oppTitle: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 19,
    marginBottom: 1,
  },
  metaIcon: {
    marginTop: 2,
  },
  oppMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 1,
  },
  oppMetaText: {
    color: '#4a6175',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 17,
    flex: 1,
  },
  oppSeeAllContainer: {
    marginTop: 6,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oppSeeAll: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
  },
  applicationsCard: {
    padding: 10,
    minHeight: 110,
  },
  seeAllRightButton: {
    marginLeft: 'auto',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  seeAllRight: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  applicationsStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 7,
    marginBottom: 0,
  },
  appStatCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appStatNumber: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    lineHeight: 30,
  },
  appStatLabel: {
    color: '#4a6175',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 0,
  },
  vDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#e2e7eb',
  },
  // Altura mínima (não fixa): título, texto e botão nunca se sobrepõem em telas baixas.
  heroBanner: {
    minHeight: 126,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffffff',
    overflow: 'hidden',
    backgroundColor: '#06477f',
    padding: 10,
    position: 'relative',
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
    fontSize: 14,
    lineHeight: 17,
    marginTop: 2,
  },
  bannerCtaBadge: {
    zIndex: 2,
    marginTop: 5,
    borderRadius: 10,
    backgroundColor: GREEN,
    paddingHorizontal: 10,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  bannerCtaText: {
    color: BLUE,
    fontFamily: 'Poppins_500Medium',
    fontSize: 9, lineHeight: 12,
  },
  bannerPerson: {
    position: 'absolute',
    right: -4,
    bottom: -6,
    width: 140,
    height: 132,
    opacity: 0.95,
  },
}))
