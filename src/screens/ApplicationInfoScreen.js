import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { Button } from '../components/ui/Button'
import { assets } from '../theme/assets'
import { USER_TYPES } from '../domain/contracts.js'
import { styles } from '../theme/styles'

function formatDate(value) {
  if (!value) return 'Prazo não informado'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Prazo não informado' : date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function ApplicationInfoScreen({ go, back, repositories, session, routeParams = {} }) {
  const { oportunidadeId, atletaId: requestedAthleteId } = routeParams
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(oportunidadeId ?? '')
  const [availableOpportunities, setAvailableOpportunities] = useState([])
  const [opportunity, setOpportunity] = useState(null)
  const [athlete, setAthlete] = useState(null)
  const [eligibility, setEligibility] = useState(null)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const currentOpportunityId = oportunidadeId || selectedOpportunityId

  useEffect(() => {
    let active = true

    const loadApplicationContext = async () => {
      setLoading(true)
      setError('')
      setApplication(null)

      if (session?.tipo !== USER_TYPES.ATHLETE || !session.id) {
        setError('Não foi possível identificar a sessão do atleta.')
        setLoading(false)
        return
      }

      try {
        const athleteResult = await repositories.users.obterPerfilAtletaPorUsuario(session.id)
        if (!active) return

        if (!athleteResult.ok) {
          setError(athleteResult.mensagem || 'Não foi possível carregar seu perfil esportivo.')
          return
        }
        if (requestedAthleteId && requestedAthleteId !== athleteResult.data.id) {
          setError('O perfil informado não pertence à sessão atual.')
          return
        }

        setAthlete(athleteResult.data)

        if (!currentOpportunityId) {
          const opportunitiesResult = await repositories.opportunities.listarOportunidades({
            status: 'ativa',
            prazoAberto: true,
          })
          if (!active) return
          if (!opportunitiesResult.ok) {
            setError(opportunitiesResult.mensagem || 'Não foi possível carregar as oportunidades abertas.')
            return
          }

          setOpportunity(null)
          setAvailableOpportunities(opportunitiesResult.data ?? [])
          setAlreadyApplied(false)
          setEligibility(null)
          return
        }

        const opportunityResult = await repositories.opportunities.obterOportunidade(currentOpportunityId)
        if (!active) return
        if (!opportunityResult.ok) {
          setError(opportunityResult.mensagem || 'Não foi possível carregar a oportunidade.')
          return
        }

        const [duplicateResult, eligibilityResult] = await Promise.all([
          repositories.applications.verificarCandidaturaExistente(currentOpportunityId, athleteResult.data.id),
          repositories.match.avaliarElegibilidade(athleteResult.data.id, currentOpportunityId),
        ])
        if (!active) return
        if (!duplicateResult.ok) {
          setError(duplicateResult.mensagem || 'Não foi possível verificar candidaturas anteriores.')
          return
        }
        if (!eligibilityResult.ok) {
          setError(eligibilityResult.mensagem || 'Não foi possível verificar sua elegibilidade.')
          return
        }

        setOpportunity(opportunityResult.data)
        setAvailableOpportunities([])
        setAlreadyApplied(duplicateResult.data)
        setEligibility(eligibilityResult.data)
      } catch {
        if (active) setError('Não foi possível preparar a candidatura. Tente novamente.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadApplicationContext()
    return () => { active = false }
  }, [repositories, session?.id, session?.tipo, currentOpportunityId, requestedAthleteId, retryToken])

  const opportunityClosed = opportunity && (
    opportunity.status !== 'ativa'
    || (opportunity.fimInscricoes && new Date(opportunity.fimInscricoes) < new Date())
  )

  const submitApplication = async () => {
    if (!athlete || !opportunity || saving || alreadyApplied || !eligibility?.elegivel || opportunityClosed) return

    setSaving(true)
    setError('')

    try {
      const result = await repositories.applications.criarCandidatura(
        opportunity.id,
        athlete.id,
        { responsavelId: session.id },
      )

      if (!result.ok) {
        if (result.codigo === 'CANDIDATURA_DUPLICADA') setAlreadyApplied(true)
        setError(result.mensagem || 'Não foi possível enviar sua candidatura.')
        return
      }

      setApplication(result.data)
    } catch {
      setError('Não foi possível enviar sua candidatura. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.flowScreen}>
      <View style={styles.flowHeader}>
        <BackButton onPress={back} />
        <Image source={assets.monogram} style={styles.flowHeaderMark} resizeMode="contain" />
      </View>

      <ScrollView style={styles.flowBody} contentContainerStyle={styles.applicationFormContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {loading ? <Text style={localStyles.state}>Carregando dados da candidatura...</Text> : null}
        {!loading && error && !opportunity ? (
          <View style={styles.flowAction}>
            <Text accessibilityRole="alert" style={localStyles.error}>{error}</Text>
            <Button wide onPress={() => setRetryToken(value => value + 1)}>Tentar novamente</Button>
            <Button wide variant="blue" onPress={() => go('opportunitiesAthlete')}>Voltar para oportunidades</Button>
          </View>
        ) : null}
        {!loading && !error && !opportunity && athlete && !currentOpportunityId ? (
          <>
            <Text style={styles.applicationFormTitle}>Escolha uma oportunidade</Text>
            <Text style={styles.applicationFormSubtitle}>Selecione uma oportunidade aberta para continuar.</Text>
            {availableOpportunities.map(item => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => setSelectedOpportunityId(item.id)}
                style={localStyles.opportunityPickerCard}
              >
                <Text style={localStyles.value}>{item.titulo}</Text>
                <Text style={localStyles.label}>{[item.modalidade, item.categoria, item.localizacao].filter(Boolean).join(' · ')}</Text>
              </Pressable>
            ))}
            {availableOpportunities.length === 0 && <Text style={localStyles.state}>Não há oportunidades abertas no momento.</Text>}
          </>
        ) : null}
        {!loading && opportunity && athlete && !application ? (
          <>
            <Text style={styles.applicationFormTitle}>{opportunity.titulo}</Text>
            <Text style={styles.applicationFormSubtitle}>{[opportunity.modalidade, opportunity.categoria].filter(Boolean).join(' · ')}</Text>
            <View style={styles.applicationProgressTrack}>
              <View style={styles.applicationProgressFill} />
              <View style={styles.applicationProgressDot} />
            </View>

            <Text style={styles.applicationFormSection}>Revisão da candidatura</Text>
            <View style={localStyles.summaryRow}>
              <Text style={localStyles.label}>Atleta</Text>
              <Text style={localStyles.value}>{session.nome || 'Perfil do atleta'}</Text>
            </View>
            <View style={localStyles.summaryRow}>
              <Text style={localStyles.label}>Modalidade</Text>
              <Text style={localStyles.value}>{athlete.modalidade || 'Não informada'}</Text>
            </View>
            <View style={localStyles.summaryRow}>
              <Text style={localStyles.label}>Prazo</Text>
              <Text style={localStyles.value}>{formatDate(opportunity.fimInscricoes)}</Text>
            </View>

            {alreadyApplied && <Text accessibilityRole="alert" style={localStyles.error}>Você já tem uma candidatura para esta oportunidade.</Text>}
            {opportunityClosed && <Text accessibilityRole="alert" style={localStyles.error}>As inscrições desta oportunidade estão encerradas.</Text>}
            {!alreadyApplied && !opportunityClosed && eligibility && !eligibility.elegivel && (
              <View style={localStyles.feedbackBlock}>
                <Text accessibilityRole="alert" style={localStyles.error}>Seu perfil ainda não atende aos critérios obrigatórios.</Text>
                {eligibility.motivosBloqueio.map(reason => <Text key={reason} style={localStyles.reason}>{reason}</Text>)}
              </View>
            )}
            {!alreadyApplied && !opportunityClosed && eligibility?.elegivel && <Text style={localStyles.success}>Seu perfil atende aos critérios obrigatórios.</Text>}
            {!!error && <Text accessibilityRole="alert" style={localStyles.error}>{error}</Text>}

            <View style={styles.flowAction}>
              <Button
                wide
                disabled={saving || alreadyApplied || opportunityClosed || !eligibility?.elegivel}
                onPress={submitApplication}
              >
                {saving ? 'Enviando...' : 'Confirmar candidatura'}
              </Button>
            </View>
          </>
        ) : null}
        {!loading && application ? (
          <View style={localStyles.successBlock}>
            <Text style={styles.applicationFormTitle}>Candidatura enviada</Text>
            <Text style={localStyles.success}>Sua candidatura para {opportunity.titulo} foi registrada.</Text>
            <Text style={localStyles.state}>Número da candidatura: {application.id}</Text>
            <Button wide onPress={() => go('opportunitiesAthlete')}>Voltar para oportunidades</Button>
          </View>
        ) : null}
      </ScrollView>
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  summaryRow: { borderBottomColor: '#d8e1e3', borderBottomWidth: 1, gap: 3, paddingVertical: 10 },
  label: { color: '#65777e', fontFamily: 'Poppins_400Regular', fontSize: 12 },
  value: { color: '#17313c', fontFamily: 'Poppins_500Medium', fontSize: 14 },
  state: { color: '#526770', fontFamily: 'Poppins_400Regular', marginVertical: 12, textAlign: 'center' },
  error: { color: '#b42318', fontFamily: 'Poppins_400Regular', marginVertical: 10, textAlign: 'center' },
  success: { color: '#126b35', fontFamily: 'Poppins_500Medium', marginVertical: 10, textAlign: 'center' },
  feedbackBlock: { gap: 2, marginTop: 8 },
  reason: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 12 },
  successBlock: { flex: 1, justifyContent: 'center', gap: 10, paddingVertical: 50 },
  opportunityPickerCard: { gap: 4, marginTop: 8, padding: 12, borderBottomColor: '#d8e1e3', borderBottomWidth: 1 },
})
