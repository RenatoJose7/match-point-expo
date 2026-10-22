import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { BottomNav } from '../../components/navigation/BottomNav'
import { Header } from '../../components/Header'
import { StatIcon } from '../../components/StatIcon'
import { assets } from '../../theme/assets'
import { styles } from '../../theme/styles'

export function AthleteHomeScreen({ go, repositories, session }) {
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [opportunity, setOpportunity] = useState(null)

  useEffect(() => {
    let active = true
    Promise.resolve().then(async () => {
      const athleteResult = await repositories.users.obterPerfilAtletaPorUsuario(session?.id)
      if (!athleteResult.ok || !active) return
      const [applicationsResult, opportunitiesResult] = await Promise.all([
        repositories.applications.listarCandidaturasDoAtleta(athleteResult.data.id),
        repositories.opportunities.listarOportunidades({ status: 'ativa', prazoAberto: true }),
      ])
      if (!active) return
      setProfile(athleteResult.data)
      setApplications(applicationsResult.ok ? applicationsResult.data : [])
      setOpportunity(opportunitiesResult.ok ? opportunitiesResult.data[0] ?? null : null)
    })
    return () => { active = false }
  }, [repositories, session?.id])

  const underReview = applications.filter((item) => item.status === 'em_analise').length

  return (
    <View style={styles.home}>
      <Header initials={(session?.nome || 'Atleta').slice(0, 2)} name={session?.nome || 'Atleta'} subtitle="Atleta" go={go} repositories={repositories} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeScroll}>
        <View style={styles.topCards}>
          <View style={[styles.whiteCard, styles.performance]}>
            <View style={styles.cardHeading}><StatIcon>▥</StatIcon><Text style={styles.cardScript}>Seu desempenho</Text></View>
            <Text style={styles.smallBlue}>Modalidade</Text>
            <Text style={styles.bigNumber}>{profile?.modalidade || '—'}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.smallBlue}>Aprovadas{`\n`}<Text style={styles.statNumber}>{applications.filter((item) => item.status === 'aprovada').length}</Text></Text>
              <Text style={styles.smallBlue}>Em análise{`\n`}<Text style={styles.statNumber}>{underReview}</Text></Text>
            </View>
          </View>
          <View style={[styles.whiteCard, styles.profileCardHome]}>
            <View style={styles.cardHeading}><StatIcon>♟</StatIcon><Text style={styles.cardScript}>Seu perfil</Text></View>
            <View style={styles.progressCircle}><Text style={styles.progressText}>{profile?.perfilCompleto ? '100%' : '—'}</Text><Text style={styles.tiny}>completo</Text></View>
          </View>
        </View>

        <View style={[styles.whiteCard, styles.opportunityCard]}>
          <View style={styles.cardHeading}><StatIcon>★</StatIcon><Text style={styles.cardScript}>Oportunidades para você</Text></View>
          <View style={styles.opportunityRow}>
            <Image source={assets.arenaSuzy} style={styles.opportunityImage} />
            <View>
              <Text style={styles.oppTitle}>{opportunity?.titulo || 'Nenhuma oportunidade aberta'}</Text>
              <Text style={styles.smallBlue}>▣ {opportunity?.categoria || 'Acompanhe novas vagas'}</Text>
              <Text style={styles.smallBlue}>● {opportunity?.localizacao || '—'}</Text>
            </View>
            <View style={styles.score}><Text style={styles.scoreLabel}>Match{`\n`}Score</Text><Text style={styles.scoreValue}>{opportunity ? 'Ver' : '—'}</Text></View>
          </View>
          <Pressable onPress={() => opportunity ? go('matchScore', { opportunityId: opportunity.id }) : go('opportunitiesAthlete')}><Text style={styles.seeAll}>{opportunity ? 'Ver compatibilidade' : 'Ver oportunidades'}</Text></Pressable>
        </View>

        <View style={[styles.whiteCard, styles.applications]}>
          <View style={styles.cardHeading}><StatIcon>▣</StatIcon><Text style={styles.cardScript}>Minhas candidaturas</Text><Pressable onPress={() => go('applications')}><Text style={styles.seeAllRight}>Ver todos</Text></Pressable></View>
          <View style={styles.applicationStats}>
            <Text style={styles.appStat}><Text style={styles.statNumber}>{applications.length}</Text>{`\n`}Candidaturas</Text>
            <Text style={styles.appStat}><Text style={styles.statNumber}>{underReview}</Text>{`\n`}Em análise</Text>
            <Text style={styles.appStat}><Text style={styles.statNumber}>{applications.filter((item) => item.status === 'aprovada').length}</Text>{`\n`}Aprovadas</Text>
          </View>
        </View>

        <Pressable onPress={() => go('women')} style={styles.heroBanner}>
          <Text style={styles.bannerTitle}>Mulheres no esporte</Text>
          <Text style={styles.bannerCopy}>Incentivando talentos.{`\n`}Transformando o futuro</Text>
          <Text style={styles.bannerCta}>Saiba mais</Text>
          <Image source={assets.athleteBanner} style={styles.bannerPerson} resizeMode="contain" />
        </Pressable>
      </ScrollView>
      <BottomNav go={go} />
    </View>
  )
}
