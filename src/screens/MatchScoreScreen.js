import React, { useEffect, useState } from 'react'
import { Image, ScrollView, Text, View } from 'react-native'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { Button } from '../components/ui/Button'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

export function MatchScoreScreen({ go, back, repositories, routeParams = {}, session }) {
  const opportunityId = routeParams.opportunityId
  const [score, setScore] = useState(null)
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        if (!opportunityId) throw new Error('Escolha uma oportunidade para calcular o Match Score.')
        const athleteResult = await repositories.users.obterPerfilAtletaPorUsuario(session?.id)
        if (!athleteResult.ok) throw new Error(athleteResult.mensagem || 'Não foi possível carregar seu perfil esportivo.')
        const [opportunityResult, scoreResult] = await Promise.all([
          repositories.opportunities.obterOportunidade(opportunityId),
          repositories.match.calcularMatchScore(athleteResult.data.id, opportunityId),
        ])
        if (!opportunityResult.ok) throw new Error(opportunityResult.mensagem || 'Oportunidade não encontrada.')
        if (!scoreResult.ok) throw new Error(scoreResult.mensagem || 'Não foi possível calcular o Match Score.')
        if (active) {
          setOpportunity(opportunityResult.data)
          setScore(scoreResult.data)
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

  return (
    <View style={styles.flowScreen}>
      <View style={styles.flowHeader}>
        <BackButton onPress={back} />
        <Image source={assets.monogram} style={styles.flowHeaderMark} resizeMode="contain" />
      </View>

      <ScrollView style={styles.flowBody} contentContainerStyle={styles.matchContent} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={styles.matchCaption}>Calculando compatibilidade...</Text> : null}
        {!loading && error ? <View style={styles.flowAction}><Text accessibilityRole="alert" style={styles.matchCaption}>{error}</Text><Button wide onPress={() => setRetryToken((value) => value + 1)}>Tentar novamente</Button></View> : null}
        {!loading && score && opportunity ? <>
          <Text style={styles.matchTitle}>Match Score</Text>
          <Text style={styles.matchCaption}>{opportunity.titulo}</Text>
          <View style={styles.matchCircle}><Text style={styles.matchPercent}>{score.percentualTotal}%</Text></View>
          <Text style={styles.matchCaption}>{score.percentualTotal >= 75 ? 'Compatibilidade alta' : score.percentualTotal >= 50 ? 'Compatibilidade parcial' : 'Compatibilidade baixa'}</Text>
          <Text style={styles.matchSectionTitle}>Critérios avaliados</Text>
          <View style={styles.matchReasons}>
            {score.criterios.map((criterion) => <View key={criterion.nome}>
              <View style={styles.matchReasonHeading}><Text style={styles.matchReasonLabel}>{criterion.nome}</Text><Text style={styles.matchReasonValue}>{criterion.percentual}%</Text></View>
              <View style={styles.matchTrack}><View style={[styles.matchFill, { width: `${criterion.percentual}%` }]} /></View>
            </View>)}
          </View>
          <View style={styles.flowAction}><Button wide onPress={() => go('opportunityDetail', { opportunityId, matchScore: score.percentualTotal })}>Ver oportunidade</Button></View>
        </> : null}
      </ScrollView>
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}
