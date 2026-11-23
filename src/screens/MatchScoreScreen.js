import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../components/accessibility/AppText'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../components/navigation/BottomNav'
import { computeMatchScore, evaluateMatchEligibility } from '../domain/matchScore.js'
import { assets } from '../theme/assets'
import { useReduceMotion } from '../components/accessibility/AccessibilityContext'

const BLUE = '#10579b'
const LIME = '#c4ff32'
const TRACK = '#e6eef5'
const RING_SIZE = 196
const RING_STROKE = 16
const DEMO_ATHLETE_USER_ID = 'usuario-atleta-adulto'

// Mostra os critérios que o cálculo realmente usou, com o nome, a nota e o motivo de cada um.
function buildDisplayCriteria(score, eligibility) {
  const sourceCriteria = Array.isArray(score?.criterios) ? score.criterios : []
  return sourceCriteria
    .filter((criterion) => criterion?.nome)
    .map((criterion, index) => ({
      nome: criterion.nome,
      atendido: Boolean(criterion.atendido),
      motivo: eligibility?.criterios?.[index]?.motivo,
      percentual: Math.max(0, Math.min(100, Math.round(Number(criterion.percentual) || 0))),
    }))
}

function compatibilityLabel(percent) {
  if (percent >= 75) return 'Compatibilidade Alta'
  if (percent >= 50) return 'Compatibilidade Parcial'
  return 'Compatibilidade Baixa'
}

export function MatchScoreScreen({ go, back, repositories, routeParams = {}, session }) {
  const opportunityId = routeParams.opportunityId
  const [score, setScore] = useState(null)
  const [eligibility, setEligibility] = useState(null)
  const [opportunity, setOpportunity] = useState(null)
  const [usingOwnProfile, setUsingOwnProfile] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [displayedPercent, setDisplayedPercent] = useState(0)
  const animation = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0)).current
  const reduceMotion = useReduceMotion()

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        if (!opportunityId) throw new Error('Escolha uma oportunidade para calcular o Match Score.')

        // A oportunidade pode estar no banco ou na vitrine de demonstração.
        let opportunityResult = await repositories.opportunities.obterOportunidade(opportunityId)
        if (!opportunityResult.ok && repositories.demo) opportunityResult = await repositories.demo.opportunities.obterOportunidade(opportunityId)
        if (!opportunityResult.ok) throw new Error(opportunityResult.mensagem || 'Oportunidade não encontrada.')

        // O cálculo usa o perfil de quem está logado; o atleta de demonstração só entra sem perfil próprio.
        let athleteResult = await repositories.users.obterPerfilAtletaPorUsuario(session?.id)
        let ownProfile = athleteResult.ok
        if (!athleteResult.ok && repositories.demo) athleteResult = await repositories.demo.users.obterPerfilAtletaPorUsuario(DEMO_ATHLETE_USER_ID)
        if (!athleteResult.ok && !repositories.demo) athleteResult = await repositories.users.obterPerfilAtletaPorUsuario(DEMO_ATHLETE_USER_ID).catch(() => athleteResult)
        if (!athleteResult.ok) throw new Error(athleteResult.mensagem || 'Complete seu perfil esportivo para ver a compatibilidade.')
        ownProfile = ownProfile && athleteResult.data?.usuarioId === session?.id

        const result = computeMatchScore(athleteResult.data, opportunityResult.data)
        if (active) {
          setOpportunity(opportunityResult.data)
          setEligibility(evaluateMatchEligibility(athleteResult.data, opportunityResult.data))
          setScore(result)
          setUsingOwnProfile(ownProfile)
        }
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
    // Com "Reduzir animações" o resultado aparece pronto, sem o anel se preencher.
    if (reduceMotion) {
      animation.setValue(1)
      pulse.setValue(0)
      setDisplayedPercent(score.percentualTotal)
      return undefined
    }
    animation.setValue(0)
    pulse.setValue(0)
    setDisplayedPercent(0)
    const listener = animation.addListener(({ value }) => setDisplayedPercent(Math.round(value * score.percentualTotal)))
    const sequence = Animated.sequence([
      Animated.timing(animation, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ])
    sequence.start()
    return () => {
      sequence.stop()
      animation.removeListener(listener)
    }
  }, [animation, pulse, reduceMotion, score])

  const displayCriteria = buildDisplayCriteria(score, eligibility)
  const partnerName = opportunity?.instituicao || opportunity?.nomeParceiro

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} onPress={back} style={styles.back}><Ionicons name="arrow-back" size={22} color="#fff" /></Pressable>
        <Image source={assets.monogram} style={styles.mark} resizeMode="contain" />
      </View>
      <View style={styles.panel}>
        {loading ? <State label="Calculando compatibilidade..." /> : null}
        {!loading && error ? <State label={error} retry={() => setRetryToken((value) => value + 1)} /> : null}
        {!loading && score && opportunity ? <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Match Score</Text>
          <Text numberOfLines={1} style={styles.subtitle}>{[opportunity.titulo, partnerName].filter(Boolean).join(' · ')}</Text>
          <ScoreRing animation={animation} pulse={pulse} fraction={score.percentualTotal / 100} percent={displayedPercent} />
          <Text style={styles.compatibility}>{compatibilityLabel(score.percentualTotal)}</Text>
          {!usingOwnProfile ? <Text style={styles.notice}>Exemplo com o atleta de demonstração. Complete seu perfil para ver o seu resultado.</Text> : null}
          {displayCriteria.length > 0 ? <Text style={styles.sectionTitle}>Por que você combina?</Text> : null}
          <View style={styles.reasons}>{displayCriteria.map((criterion, index) => <Reason key={`${criterion.nome}-${index}`} criterion={criterion} animation={animation} index={index} />)}</View>
        </ScrollView> : null}
      </View>
      {!loading && score && opportunity ? <Pressable accessibilityRole="button" accessibilityLabel="Ver oportunidade" onPress={() => go('opportunityDetail', { opportunityId, matchScore: score.percentualTotal })} style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}><Text style={styles.actionText}>Ver oportunidade</Text></Pressable> : null}
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}

// Anel que se preenche no sentido horário até o percentual, feito com duas metades que giram.
function ScoreRing({ animation, pulse, fraction, percent }) {
  const progress = Animated.multiply(animation, fraction)
  const rightRotation = progress.interpolate({ inputRange: [0, 0.5], outputRange: ['45deg', '225deg'], extrapolate: 'clamp' })
  const leftRotation = progress.interpolate({ inputRange: [0.5, 1], outputRange: ['225deg', '405deg'], extrapolate: 'clamp' })
  const leftOpacity = progress.interpolate({ inputRange: [0.5, 0.5001], outputRange: [0, 1], extrapolate: 'clamp' })
  const entrance = animation.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.84, 1.02, 1] })
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] })
  const glowOpacity = pulse.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] })
  const popScale = pulse.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 1.06, 1] })

  return (
    <View style={styles.ringArea}>
      <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
      <Animated.View style={[styles.ringBox, { transform: [{ scale: entrance }] }]}>
        <View style={styles.track} />
        <View style={[styles.halfClip, styles.rightClip]}>
          <Animated.View style={[styles.halfRing, styles.rightRing, { transform: [{ rotate: rightRotation }] }]} />
        </View>
        <View style={[styles.halfClip, styles.leftClip]}>
          <Animated.View style={[styles.halfRing, { opacity: leftOpacity, transform: [{ rotate: leftRotation }] }]} />
        </View>
        <Animated.View style={[styles.ringCenter, { transform: [{ scale: popScale }] }]}>
          <Text style={styles.percent}>{percent}%</Text>
        </Animated.View>
      </Animated.View>
    </View>
  )
}

function Reason({ criterion, animation, index }) {
  const start = Math.min(0.15 + index * 0.12, 0.6)
  const grow = animation.interpolate({ inputRange: [0, start, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' })
  const width = grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${criterion.percentual}%`] })
  const opacity = animation.interpolate({ inputRange: [0, start, Math.min(start + 0.2, 1)], outputRange: [0, 0, 1], extrapolate: 'clamp' })
  return (
    <Animated.View style={[styles.reason, { opacity }]}>
      <View style={styles.reasonHeading}>
        <View style={[styles.reasonIcon, !criterion.atendido && styles.reasonIconPartial]}>
          <Ionicons name={criterion.atendido ? 'checkmark' : 'remove'} size={13} color={BLUE} />
        </View>
        <Text style={styles.reasonLabel}>{criterion.nome}</Text>
        <Text style={styles.reasonValue}>{criterion.percentual}%</Text>
      </View>
      <View style={styles.barTrack}><Animated.View style={[styles.fill, { width }]} /></View>
      {!criterion.atendido && criterion.motivo ? <Text style={styles.reasonMotive}>{criterion.motivo}</Text> : null}
    </Animated.View>
  )
}

function State({ label, retry }) {
  return <View style={styles.state}><Text style={styles.stateText}>{label}</Text>{retry ? <Pressable accessibilityRole="button" onPress={retry}><Text style={styles.retry}>Tentar novamente</Text></Pressable> : null}</View>
}

const halfRingBase = {
  position: 'absolute',
  top: 0,
  width: RING_SIZE,
  height: RING_SIZE,
  borderRadius: RING_SIZE / 2,
  borderWidth: RING_STROKE,
  borderTopColor: 'transparent',
  borderRightColor: 'transparent',
  borderLeftColor: LIME,
  borderBottomColor: LIME,
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },
  header: { height: 65, backgroundColor: BLUE },
  back: { position: 'absolute', left: 11, top: 12, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', top: 14, alignSelf: 'center', width: 38, height: 42 },
  panel: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 19, borderTopRightRadius: 19, overflow: 'hidden' },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 138 },
  title: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 20, lineHeight: 30, textAlign: 'center' },
  subtitle: { color: '#5d7590', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 1 },
  ringArea: { width: RING_SIZE + 24, height: RING_SIZE + 24, marginTop: 4, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, backgroundColor: LIME },
  ringBox: { width: RING_SIZE, height: RING_SIZE },
  track: { position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: RING_STROKE, borderColor: TRACK, backgroundColor: '#fff' },
  halfClip: { position: 'absolute', top: 0, width: RING_SIZE / 2, height: RING_SIZE, overflow: 'hidden' },
  rightClip: { left: RING_SIZE / 2 },
  leftClip: { left: 0 },
  halfRing: { ...halfRingBase, left: 0 },
  rightRing: { left: -RING_SIZE / 2 },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  percent: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 60, lineHeight: 68, letterSpacing: -2 },
  compatibility: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  notice: { color: '#5d7590', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 6, paddingHorizontal: 12 },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 16, lineHeight: 24, marginTop: 24, marginBottom: 14 },
  reasons: { gap: 14 },
  reason: { gap: 5 },
  reasonHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reasonIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  reasonIconPartial: { backgroundColor: '#e4ebf2' },
  reasonLabel: { flex: 1, color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22 },
  reasonValue: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 16, lineHeight: 22 },
  reasonMotive: { color: '#6b7d8f', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 16, marginLeft: 28 },
  barTrack: { height: 6, borderRadius: 4, backgroundColor: '#dbdcdf', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: LIME },
  action: { position: 'absolute', left: 16, right: 16, bottom: 82, height: 44, borderRadius: 22, backgroundColor: '#b3ed45', alignItems: 'center', justifyContent: 'center', zIndex: 3, ...Platform.select({ web: { boxShadow: '0 3px 7px rgba(28, 76, 138, .22)' }, default: { elevation: 3 } }) },
  actionPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  actionText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  state: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 12 },
  stateText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 14, textAlign: 'center' },
  retry: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
})
