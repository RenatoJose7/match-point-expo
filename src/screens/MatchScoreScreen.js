import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../components/navigation/BottomNav'
import { assets } from '../theme/assets'

const BLUE = '#10579b'
const LIME = '#c4ff32'
const DEMO_ATHLETE_USER_ID = 'usuario-atleta-adulto'
const DISPLAY_REASON_LABELS = [
  'Desempenho esportivo',
  'Histórico acadêmico',
  'Objetivos alinhados',
  'Perfil Técnico',
  'Desempenho esportivo',
]

function buildDisplayCriteria(score) {
  const sourceCriteria = Array.isArray(score?.criterios) ? score.criterios : []
  const overall = Math.max(0, Math.min(100, Number(score?.percentualTotal) || 0))
  return DISPLAY_REASON_LABELS.map((nome, index) => ({
    nome,
    percentual: Math.max(0, Math.min(100, Number(sourceCriteria[index]?.percentual) || overall)),
  }))
}

export function MatchScoreScreen({ go, back, repositories, routeParams = {}, session }) {
  const opportunityId = routeParams.opportunityId
  const [score, setScore] = useState(null)
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [displayedPercent, setDisplayedPercent] = useState(0)
  const animation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let active = true
    const loadScore = async (source, userId) => {
      const athleteResult = await source.users.obterPerfilAtletaPorUsuario(userId)
      if (!athleteResult.ok) return { athleteResult, opportunityResult: null, scoreResult: null }
      const [opportunityResult, scoreResult] = await Promise.all([
        source.opportunities.obterOportunidade(opportunityId),
        source.match.calcularMatchScore(athleteResult.data.id, opportunityId),
      ])
      return { athleteResult, opportunityResult, scoreResult }
    }
    const load = async () => {
      setLoading(true); setError('')
      try {
        if (!opportunityId) throw new Error('Escolha uma oportunidade para calcular o Match Score.')
        let result = await loadScore(repositories, session?.id)
        if (repositories.demo && (!result.opportunityResult?.ok || !result.scoreResult?.ok)) result = await loadScore(repositories.demo, DEMO_ATHLETE_USER_ID)
        if (!result.athleteResult?.ok) throw new Error(result.athleteResult?.mensagem || 'Não foi possível carregar seu perfil esportivo.')
        if (!result.opportunityResult?.ok) throw new Error(result.opportunityResult?.mensagem || 'Oportunidade não encontrada.')
        if (!result.scoreResult?.ok) throw new Error(result.scoreResult?.mensagem || 'Não foi possível calcular o Match Score.')
        if (active) { setOpportunity(result.opportunityResult.data); setScore(result.scoreResult.data) }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Não foi possível calcular o Match Score.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [opportunityId, repositories, retryToken, session?.id])

  useEffect(() => {
    if (!score) return undefined
    animation.stopAnimation()
    animation.setValue(0)
    setDisplayedPercent(0)
    const listener = animation.addListener(({ value }) => setDisplayedPercent(Math.round(value * score.percentualTotal)))
    Animated.timing(animation, { toValue: 1, duration: 1050, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start()
    return () => animation.removeListener(listener)
  }, [animation, score])

  const compatibility = score?.percentualTotal >= 75 ? 'Compatibilidade Alta' : score?.percentualTotal >= 50 ? 'Compatibilidade Parcial' : 'Compatibilidade Baixa'
  const displayCriteria = buildDisplayCriteria(score)

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={back} style={styles.back}><Ionicons name="arrow-back" size={21} color="#fff" /></Pressable>
        <Image source={assets.monogram} style={styles.mark} resizeMode="contain" />
      </View>
      <View style={styles.panel}>
        {loading ? <State label="Calculando compatibilidade..." /> : null}
        {!loading && error ? <State label={error} retry={() => setRetryToken((value) => value + 1)} /> : null}
        {!loading && score && opportunity ? <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Match Score</Text>
          <ScoreRing animation={animation} percent={displayedPercent} />
          <Text style={styles.compatibility}>{compatibility}</Text>
          <Text style={styles.sectionTitle}>Por que você combina?</Text>
          <View style={styles.reasons}>{displayCriteria.map((criterion, index) => <Reason key={`${criterion.nome}-${index}`} criterion={criterion} animation={animation} />)}</View>
        </ScrollView> : null}
      </View>
      {!loading && score && opportunity ? <Pressable accessibilityRole="button" accessibilityLabel="Ver oportunidade" onPress={() => go('opportunityDetail', { opportunityId, matchScore: score.percentualTotal })} style={styles.action}><Text style={styles.actionText}>Ver oportunidade</Text></Pressable> : null}
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}

function ScoreRing({ animation, percent }) {
  const scale = animation.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] })
  const opacity = animation.interpolate({ inputRange: [0, 0.22, 1], outputRange: [0, 0.6, 1] })
  return <View style={styles.ringArea}><Animated.View style={[styles.ring, { opacity, transform: [{ scale }] }]}><Text style={styles.percent}>{percent}%</Text></Animated.View></View>
}

function Reason({ criterion, animation }) {
  const width = animation.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${criterion.percentual}%`] })
  return <View style={styles.reason}><View style={styles.reasonHeading}><Text style={styles.reasonLabel}>{criterion.nome}</Text><Text style={styles.reasonValue}>{criterion.percentual}%</Text></View><View style={styles.track}><Animated.View style={[styles.fill, { width }]} /></View></View>
}

function State({ label, retry }) {
  return <View style={styles.state}><Text style={styles.stateText}>{label}</Text>{retry ? <Pressable onPress={retry}><Text style={styles.retry}>Tentar novamente</Text></Pressable> : null}</View>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },
  header: { height: 65, backgroundColor: BLUE },
  back: { position: 'absolute', left: 11, top: 12, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', top: 14, alignSelf: 'center', width: 38, height: 42 },
  panel: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 19, borderTopRightRadius: 19, overflow: 'hidden' },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 138 },
  title: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 20, lineHeight: 30, textAlign: 'center' },
  ringArea: { width: 182, height: 182, marginTop: 7, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  ring: { width: 182, height: 182, borderRadius: 91, borderWidth: 12, borderColor: LIME, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  percent: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 58, lineHeight: 66, letterSpacing: -2 },
  compatibility: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 12 },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 26, marginTop: 29, marginBottom: 15 },
  reasons: { gap: 14 },
  reason: { gap: 5 },
  reasonHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reasonLabel: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 22 },
  reasonValue: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 22 },
  track: { height: 5, borderRadius: 4, backgroundColor: '#dbdcdf', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: LIME },
  action: { position: 'absolute', left: 16, right: 16, bottom: 82, height: 40, borderRadius: 20, backgroundColor: '#b3ed45', alignItems: 'center', justifyContent: 'center', zIndex: 3, ...require('react-native').Platform.select({ web: { boxShadow: '0 3px 7px rgba(28, 76, 138, .22)' }, default: { elevation: 3 } }) },
  actionText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  state: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 12 },
  stateText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, textAlign: 'center' },
  retry: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
})
