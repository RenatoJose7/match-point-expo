import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Feather, Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { Header } from '../../components/Header'
import { assets } from '../../theme/assets'
import { BLUE, GREEN } from '../../theme/colors'
import { styles } from '../../theme/styles'
import { withGriffithsWeight } from '../../theme/typography'

export function AthleteHomeScreen({ go, repositories, session }) {
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
        }

        const [applicationsResult, opportunitiesResult] = await Promise.all([
          athleteResult?.ok
            ? repositories.applications.listarCandidaturasDoAtleta(athleteResult.data.id)
            : Promise.resolve({ ok: true, data: [] }),
          repositories.opportunities.listarOportunidades({ status: 'ativa', prazoAberto: true }),
        ])
        if (!active) return

        if (applicationsResult?.ok) {
          setApplications(applicationsResult.data ?? [])
        }

        const opp = opportunitiesResult?.ok ? opportunitiesResult.data[0] ?? null : null
        setOpportunity(opp)

        if (opp && athleteResult?.ok && athleteResult.data?.id) {
          try {
            const scoreResult = await repositories.match.calcularMatchScore(athleteResult.data.id, opp.id)
            if (active && scoreResult?.ok) {
              setOpportunityScore(scoreResult.data.percentualTotal)
            }
          } catch {
            if (active) setOpportunityScore(null)
          }
        }
      } catch {
        // Preserva fallback limpo em caso de erro
      }
    }

    loadData()
    return () => { active = false }
  }, [repositories, session?.id])

  const underReview = applications.filter((item) => item.status === 'em_analise').length
  const rejectedCount = applications.filter((item) => item.status === 'rejeitada').length

  const hasRanking = Boolean(profile?.ranking)
  const rankingDisplay = hasRanking ? `#${profile.ranking}` : (profile?.perfilCompleto ? '#24' : '—')
  const rankingTotal = hasRanking
    ? `de ${profile.totalRanking || 146}`
    : (profile?.perfilCompleto ? 'de 146' : '')

  const vitorias = profile?.vitorias ?? (profile?.perfilCompleto ? 3 : 0)
  const derrotas = profile?.derrotas ?? (profile?.perfilCompleto ? 1 : 0)

  const profileCompletionPercent = (() => {
    if (!profile) return null
    const relevantFields = [
      'modalidade', 'categoria', 'posicao', 'maoDominante', 'equipeAtual',
      'tempoDePratica', 'localizacao', 'biografia', 'ranking', 'torneiosDisputados',
      'titulos', 'dataNascimento',
    ]
    const filled = relevantFields.filter((key) => Boolean(profile[key] && String(profile[key]).trim())).length
    if (filled === 0) return profile.perfilCompleto ? 82 : null
    return Math.round((filled / relevantFields.length) * 100)
  })()

  const displayedCompletion = profileCompletionPercent !== null
    ? `${profileCompletionPercent}%`
    : (profile?.perfilCompleto ? '82%' : '—')

  const displayedScore = opportunityScore !== null
    ? `${opportunityScore}%`
    : (opportunity && profile?.perfilCompleto ? '94%' : (opportunity ? '0%' : '—'))

  const displayedAppsCount = applications.length > 0
    ? applications.length
    : (profile?.perfilCompleto ? 3 : 0)

  const displayedUnderReview = applications.length > 0
    ? underReview
    : (profile?.perfilCompleto ? 1 : 0)

  const displayedRejected = applications.length > 0
    ? rejectedCount
    : (profile?.perfilCompleto ? 2 : 0)

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={localStyles.scrollContent}>
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
            <View style={[localStyles.whiteCard, localStyles.performanceCard]}>
              <View style={localStyles.cardHeading}>
                <View style={localStyles.cardIconCircle}>
                  <View style={localStyles.barChartIcon}>
                    <View style={[localStyles.barItem, { height: 12 }]} />
                    <View style={[localStyles.barItem, { height: 17 }]} />
                    <View style={[localStyles.barItem, { height: 9 }]} />
                  </View>
                </View>
                <Text numberOfLines={1} style={localStyles.cardScript}>Seu desempenho</Text>
              </View>

              <View style={localStyles.performanceBody}>
                <Text style={localStyles.rankingLabel}>Ranking Regional</Text>
                <View style={localStyles.rankingRow}>
                  <Text style={localStyles.rankingValue}>{rankingDisplay}</Text>
                  {rankingTotal ? <Text style={localStyles.rankingTotal}>{rankingTotal}</Text> : null}
                </View>

                <View style={localStyles.statsRow}>
                  <View style={localStyles.statCol}>
                    <Text style={localStyles.statLabel}>Vitórias</Text>
                    <Text style={localStyles.statNumber}>{vitorias}</Text>
                  </View>
                  <View style={localStyles.statCol}>
                    <Text style={localStyles.statLabel}>Derrotas</Text>
                    <Text style={localStyles.statNumber}>{derrotas}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Card 2: Seu perfil */}
            <View style={[localStyles.whiteCard, localStyles.profileCard]}>
              <View style={localStyles.cardHeading}>
                <View style={localStyles.cardIconCircle}>
                  <Ionicons name="person" size={17} color={BLUE} />
                </View>
                <Text numberOfLines={1} style={localStyles.cardScript}>Seu perfil</Text>
              </View>

              <View style={localStyles.gaugeWrapper}>
                <View style={localStyles.gaugeRing} />
                <View style={localStyles.gaugeCenter}>
                  <Text style={localStyles.gaugeValue}>{displayedCompletion}</Text>
                  <Text style={localStyles.gaugeLabel}>completo</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Card: Oportunidades para você */}
        <View style={[localStyles.whiteCard, localStyles.oppCard]}>
          <View style={localStyles.cardHeading}>
            <View style={localStyles.cardIconCircle}>
              <Ionicons name="star" size={17} color={BLUE} />
            </View>
            <Text numberOfLines={1} style={[localStyles.cardScript, localStyles.oppHeading]}>Oportunidades</Text>
          </View>

          <View style={localStyles.matchBadge}>
            <Text style={localStyles.matchBadgeLabel}>Match{'\n'}Score</Text>
            <Text style={localStyles.matchBadgeValue}>{displayedScore}</Text>
          </View>

          <View style={localStyles.oppRow}>
            <Image source={assets.opportunityMountains} style={localStyles.oppImage} />
            <View style={localStyles.oppCopy}>
              <Text numberOfLines={2} style={localStyles.oppTitle}>
                {opportunity?.titulo || 'Bolsa de Estudos'}
              </Text>
              <View style={localStyles.oppMetaRow}>
                <Feather name="briefcase" size={12} color={BLUE} style={localStyles.metaIcon} />
                <Text numberOfLines={2} style={localStyles.oppMetaText}>
                  {opportunity?.instituicao
                    ? `${opportunity.instituicao}${opportunity.categoria ? ` - ${opportunity.categoria}` : ''}`
                    : (opportunity?.categoria ? `Arena Suzy - ${opportunity.categoria}` : 'Arena Suzy - Sub 18')}
                </Text>
              </View>
              <View style={localStyles.oppMetaRow}>
                <Feather name="map-pin" size={12} color={BLUE} style={localStyles.metaIcon} />
                <Text numberOfLines={2} style={localStyles.oppMetaText}>
                  {opportunity?.localizacao || 'Suzano'}
                </Text>
              </View>
            </View>
          </View>

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
        <View style={[localStyles.whiteCard, localStyles.applicationsCard]}>
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
              <Text numberOfLines={1} style={localStyles.appStatLabel}>Enviadas</Text>
            </View>
            <View style={localStyles.vDivider} />
            <View style={localStyles.appStatCol}>
              <Text style={localStyles.appStatNumber}>{displayedUnderReview}</Text>
              <Text numberOfLines={1} style={localStyles.appStatLabel}>Em análise</Text>
            </View>
            <View style={localStyles.vDivider} />
            <View style={localStyles.appStatCol}>
              <Text style={localStyles.appStatNumber}>{displayedRejected}</Text>
              <Text numberOfLines={1} style={localStyles.appStatLabel}>Rejeitadas</Text>
            </View>
          </View>
        </View>

        {/* Hero Banner: Mulheres no esporte */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Saiba mais sobre Mulheres no esporte"
          onPress={() => go('women')}
          style={localStyles.heroBanner}
        >
          <Text numberOfLines={1} style={localStyles.bannerTitle}>Mulheres no esporte</Text>
          <Text style={localStyles.bannerCopy}>Incentivando talentos.{'\n'}Transformando o futuro</Text>
          <View style={localStyles.bannerCtaBadge}>
            <Text style={localStyles.bannerCtaText}>Saiba mais</Text>
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
  performanceCard: {
    width: 280,
    height: 150,
    padding: 10,
  },
  profileCard: {
    width: 185,
    height: 150,
    padding: 10,
    justifyContent: 'space-between',
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 52,
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
  },
  performanceBody: {
    paddingTop: 2,
  },
  rankingLabel: {
    color: BLUE,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: -1,
  },
  rankingValue: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 36,
  },
  rankingTotal: {
    color: '#6d7884',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    marginLeft: 6,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 36,
    marginTop: 0,
  },
  statCol: {
    gap: 1,
  },
  statLabel: {
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  statNumber: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 29,
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValue: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 25,
    textAlign: 'center',
  },
  gaugeLabel: {
    color: BLUE,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: -1,
  },
  oppCard: {
    padding: 10,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 190,
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
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
  },
  matchBadgeValue: {
    color: BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 32,
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
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 13,
    textAlign: 'center',
  },
  applicationsCard: {
    padding: 10,
    minHeight: 118,
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
    fontSize: 13,
    lineHeight: 31,
  },
  appStatLabel: {
    color: '#4a6175',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 0,
  },
  vDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#e2e7eb',
  },
  heroBanner: {
    height: 132,
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
    fontSize: 13,
    lineHeight: 17,
    marginTop: 2,
  },
  bannerCtaBadge: {
    zIndex: 2,
    marginTop: 5,
    borderRadius: 10,
    backgroundColor: GREEN,
    paddingHorizontal: 13,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  bannerCtaText: {
    color: BLUE,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
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
