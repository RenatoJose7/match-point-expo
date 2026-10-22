import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { Header } from '../../components/Header'
import { StatIcon } from '../../components/StatIcon'
import { assets } from '../../theme/assets'
import { BLUE } from '../../theme/colors'
import { styles } from '../../theme/styles'

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
        <Header initials={initials} name={displayName} subtitle="Bem-vindo de volta" go={go} repositories={repositories} trainer />
        <ScrollView contentContainerStyle={styles.trainerHomeScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.trainerOpportunityCard}>
            <View style={styles.trainerCardHeading}>
              <View style={styles.trainerCardIcon}><Ionicons name="stats-chart" size={18} color={BLUE} /></View>
              <Text style={styles.trainerCardTitle}>Oportunidades</Text>
              <Pressable onPress={() => go(opportunitiesTarget)} hitSlop={10} style={styles.trainerSeeAllButton}>
                <Text style={styles.trainerSeeAll}>Ver mais</Text>
              </Pressable>
            </View>

            <View style={styles.trainerOpportunityBody}>
              <View style={styles.trainerCountBlock}>
                <Text style={styles.trainerCountLabel}>Oportunidades{`\n`}ativas</Text>
                <Text style={styles.trainerCountValue}>{summary.activeCount}</Text>
              </View>
              <View style={styles.trainerCardDivider} />
              <View style={styles.trainerStatusList}>
                <View style={styles.trainerStatusRow}>
                  <View style={[styles.trainerStatusDot, styles.trainerStatusDotGreen]} />
                  <Text style={styles.trainerStatusNumber}>{summary.activeCount}</Text>
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

          <Pressable onPress={() => go(opportunitiesTarget)} style={styles.trainerCandidatesCard}>
            <View style={styles.trainerCardHeading}>
              <View style={styles.trainerCardIcon}><Ionicons name="people" size={20} color={BLUE} /></View>
              <Text style={styles.trainerCardTitle}>Candidatos</Text>
              <Text style={styles.trainerSeeAll}>Ver mais</Text>
            </View>
            <View style={styles.trainerCandidatesBody}>
              <View>
                <Text style={styles.trainerCountLabel}>Candidatos{`\n`}recebidos</Text>
                <Text style={styles.trainerCountValue}>{summary.candidateCount}</Text>
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

          <Pressable onPress={() => go('technicalEvaluations')} style={styles.trainerCandidatesCard}>
            <View style={styles.trainerCardHeading}>
              <View style={styles.trainerCardIcon}><Ionicons name="clipboard" size={20} color={BLUE} /></View>
              <Text style={styles.trainerCardTitle}>Avaliações técnicas</Text>
              <Text style={styles.trainerSeeAll}>Ver demandas</Text>
            </View>
            <Text style={styles.trainerCandidateCaption}>Registre pareceres estruturados enviados por instituições verificadas.</Text>
          </Pressable>

          <Banner {...(bannerPressable ? { onPress: () => go(bannerTarget) } : {})} style={styles.trainerTalentBanner}>
            <Text style={styles.trainerBannerTitle}>Transforme talentos</Text>
            <Text style={styles.trainerBannerCopy}>Acompanhe, avalie e{`\n`}descubra o próximo{`\n`}destaque do esporte.</Text>
            <Text style={styles.trainerBannerCta}>Saiba mais</Text>
            <Image source={assets.trainerBanner} style={styles.trainerBannerPerson} resizeMode="contain" />
          </Banner>
        </ScrollView>
        <BottomNav go={go} role="trainer" />
      </View>
    )
  }

  return (
    <View style={styles.home}>
      <Header initials={initials} name={displayName} subtitle="Bem-vindo de volta" go={go} repositories={repositories} trainer />
      <ScrollView contentContainerStyle={styles.homeScroll}>
        <View style={[styles.whiteCard, styles.trainerCard]}>
          <View style={styles.cardHeading}>
            <StatIcon>▥</StatIcon>
            <Text style={styles.cardScript}>Oportunidades</Text>
            <Pressable onPress={() => go(opportunitiesTarget)} hitSlop={10} style={styles.seeAllPressable}>
              <Text style={styles.seeAllRight}>Ver mais</Text>
            </Pressable>
          </View>
          <View style={styles.trainerStats}>
            <Text style={styles.smallBlue}>Oportunidades{`\n`}ativas{`\n`}<Text style={styles.bigNumber}>{summary.activeCount}</Text></Text>
            <Text style={styles.smallBlue}>●　<Text style={styles.statNumber}>{summary.activeCount}</Text> Divulgadas{`\n`}●　<Text style={styles.statNumber}>{summary.candidateCount}</Text> Candidatos{`\n`}●　<Text style={styles.statNumber}>—</Text> Dados adicionais</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Criar oportunidade" onPress={() => go(createTarget)} style={styles.createOpportunityShortcut}>
              <Text style={styles.createOpportunityShortcutPlus}>+</Text>
              <Text style={styles.createOpportunityShortcutLabel}>Criar</Text>
            </Pressable>
          </View>
        </View>
        <Pressable onPress={() => go(opportunitiesTarget)} style={[styles.whiteCard, styles.trainerCard]}>
          <View style={styles.cardHeading}><StatIcon>♟</StatIcon><Text style={styles.cardScript}>Candidatos</Text><Text style={styles.seeAllRight}>Ver mais</Text></View>
          <View style={styles.trainerStats}>
            <Text style={styles.smallBlue}>Candidatos{`\n`}recebidos{`\n`}<Text style={styles.bigNumber}>{summary.candidateCount}</Text></Text>
            <Text style={styles.candidateFaces}>● ● ●　<Text style={styles.muted}>+{summary.candidateCount}</Text>{`\n`}<Text style={styles.tiny}>Candidatos nas oportunidades da conta</Text></Text>
          </View>
        </Pressable>
        <Banner {...(bannerPressable ? { onPress: () => go(bannerTarget) } : {})} style={[styles.heroBanner, styles.trainerBanner]}>
          <Text style={styles.bannerTitle}>Transforme talentos</Text>
          <Text style={styles.bannerCopy}>Acompanhe, avalie e{`\n`}descubra o próximo{`\n`}destaque do esporte.</Text>
          <Text style={styles.bannerCta}>Saiba mais</Text>
          <Image source={assets.trainerBanner} style={styles.bannerPerson} resizeMode="contain" />
        </Banner>
      </ScrollView>
      <BottomNav go={go} role={role} />
    </View>
  )
}
