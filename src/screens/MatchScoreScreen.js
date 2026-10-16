import React, { useEffect, useState } from 'react'
import { Image, ScrollView, Text, View } from 'react-native'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { Button } from '../components/ui/Button'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

function compatibilityLabel(score) {
  if (score >= 80) return 'Compatibilidade alta'
  if (score >= 60) return 'Compatibilidade média'
  return 'Compatibilidade baixa'
}

export function MatchScoreScreen({ go, back, repositories, routeParams = {} }) {
  const { atletaId, oportunidadeId } = routeParams
  const [matchScore, setMatchScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let active = true

    const loadMatchScore = async () => {
      setLoading(true)
      setError('')

      if (!atletaId || !oportunidadeId) {
        setError('Não foi possível identificar o atleta ou a oportunidade.')
        setLoading(false)
        return
      }

      try {
        const result = await repositories.match.calcularMatchScore(atletaId, oportunidadeId)
        if (!active) return
        if (!result.ok) {
          setError(result.mensagem || 'Não foi possível calcular a compatibilidade.')
          return
        }
        setMatchScore(result.data)
      } catch {
        if (active) setError('Não foi possível calcular a compatibilidade. Tente novamente.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMatchScore()
    return () => { active = false }
  }, [atletaId, oportunidadeId, repositories, retryToken])

  const openOpportunity = () => go('opportunityDetail', {
    ...routeParams,
    matchScore: matchScore?.percentualTotal,
  })

  return (
    <View style={styles.flowScreen}>
      <View style={styles.flowHeader}>
        <BackButton onPress={back} />
        <Image source={assets.monogram} style={styles.flowHeaderMark} resizeMode="contain" />
      </View>

      <ScrollView style={styles.flowBody} contentContainerStyle={styles.matchContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.matchTitle}>Match Score</Text>
        {loading ? <Text style={styles.matchCaption}>Calculando compatibilidade...</Text> : null}
        {!loading && error ? (
          <View>
            <Text accessibilityRole="alert" style={styles.matchCaption}>{error}</Text>
            <View style={styles.flowAction}>
              <Button wide onPress={() => setRetryToken(value => value + 1)}>Tentar novamente</Button>
              <Button wide variant="blue" onPress={openOpportunity}>Ver oportunidade</Button>
            </View>
          </View>
        ) : null}
        {!loading && matchScore ? (
          <>
            <View style={styles.matchCircle}>
              <Text style={styles.matchPercent}>{matchScore.percentualTotal}%</Text>
            </View>
            <Text style={styles.matchCaption}>{compatibilityLabel(matchScore.percentualTotal)}</Text>

            <Text style={styles.matchSectionTitle}>Critérios de compatibilidade</Text>
            <View style={styles.matchReasons}>
              {matchScore.criterios.map(criterion => (
                <View key={criterion.nome}>
                  <View style={styles.matchReasonHeading}>
                    <Text style={styles.matchReasonLabel}>{criterion.nome}</Text>
                    <Text style={styles.matchReasonValue}>{criterion.percentual}%</Text>
                  </View>
                  <View style={styles.matchTrack}>
                    <View style={[styles.matchFill, { width: `${criterion.percentual}%` }]} />
                  </View>
                </View>
              ))}
              {matchScore.criterios.length === 0 && <Text style={styles.matchCaption}>Sem critérios detalhados para esta oportunidade.</Text>}
            </View>

            <View style={styles.flowAction}>
              <Button wide onPress={openOpportunity}>Ver oportunidade</Button>
            </View>
          </>
        ) : null}
      </ScrollView>
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}
