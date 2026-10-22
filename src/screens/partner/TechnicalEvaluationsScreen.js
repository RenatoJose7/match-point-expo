import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BottomNav } from '../../components/navigation/BottomNav'
import { FeedbackMessage, getPartnerProfile, LoadingState, PartnerHeader, partnerColors, partnerStyles } from './partnerOpportunityUi'

const scoreFields = [
  ['notaTecnica', 'Técnica'],
  ['notaFisica', 'Físico'],
  ['notaTatica', 'Tática'],
]

export function TechnicalEvaluationsScreen({ go, back, repositories, session, routeParams = {} }) {
  const isTrainer = session?.tipo === 'treinador'
  const [partner, setPartner] = useState(null)
  const [trainers, setTrainers] = useState([])
  const [requests, setRequests] = useState([])
  const [selectedTrainerId, setSelectedTrainerId] = useState('')
  const [scores, setScores] = useState({ notaTecnica: '', notaFisica: '', notaTatica: '' })
  const [parecer, setParecer] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const ownProfile = await getPartnerProfile(repositories, session)
      setPartner(ownProfile)
      if (isTrainer) {
        const result = await repositories.evaluations.listarSolicitacoesDoTreinador(ownProfile.id)
        if (!result.ok) throw new Error(result.mensagem)
        setRequests(result.data)
      } else {
        const result = await repositories.users.listarParceiros({ tipo: 'treinador', verificado: true })
        if (!result.ok) throw new Error(result.mensagem)
        setTrainers(result.data)
      }
    } catch (loadError) { setError(loadError.message || 'Não foi possível carregar as avaliações.') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [repositories, session])

  const requestEvaluation = async () => {
    if (!selectedTrainerId || saving) return
    setSaving(true); setError(''); setNotice('')
    const result = await repositories.evaluations.solicitarAvaliacao({
      instituicaoId: partner.id,
      treinadorId: selectedTrainerId,
      atletaId: routeParams.athleteId,
      oportunidadeId: routeParams.opportunityId,
      candidaturaId: routeParams.applicationId,
    })
    setSaving(false)
    if (!result.ok) return setError(result.mensagem || 'Não foi possível solicitar a avaliação.')
    setNotice('Solicitação enviada ao treinador. A avaliação ficará disponível assim que ele registrar o parecer.')
    setSelectedTrainerId('')
  }

  const submitEvaluation = async (request) => {
    if (saving) return
    setSaving(true); setError(''); setNotice('')
    const result = await repositories.evaluations.registrarAvaliacao({
      solicitacaoId: request.id,
      treinadorId: partner.id,
      notaTecnica: scores.notaTecnica,
      notaFisica: scores.notaFisica,
      notaTatica: scores.notaTatica,
      parecer,
      recomendacao: 'desenvolver',
    })
    setSaving(false)
    if (!result.ok) return setError(result.mensagem || 'Não foi possível registrar a avaliação.')
    setNotice('Avaliação registrada e encaminhada à instituição.')
    setScores({ notaTecnica: '', notaFisica: '', notaTatica: '' }); setParecer(''); load()
  }

  return (
    <View style={partnerStyles.page}>
      <PartnerHeader title={isTrainer ? 'Avaliações técnicas' : 'Solicitar avaliação'} subtitle={isTrainer ? 'Demandas enviadas por instituições' : 'Escolha um treinador verificado'} onBack={back} />
      {loading ? <LoadingState label="Carregando avaliações..." /> : (
        <ScrollView style={partnerStyles.scroll} contentContainerStyle={styles.content}>
          {error ? <FeedbackMessage>{error}</FeedbackMessage> : null}
          {notice ? <FeedbackMessage tone="success">{notice}</FeedbackMessage> : null}
          {isTrainer ? (
            requests.length ? requests.map((request) => (
              <View key={request.id} style={partnerStyles.card}>
                <Text style={partnerStyles.sectionTitle}>Atleta {request.atletaId}</Text>
                <Text style={styles.copy}>Solicitação da instituição · {request.status}</Text>
                {request.status === 'pendente' ? <>
                  <View style={styles.scores}>{scoreFields.map(([key, label]) => <View key={key} style={styles.scoreField}><Text style={partnerStyles.fieldLabel}>{label} (1–5)</Text><TextInput value={scores[key]} onChangeText={(value) => setScores((current) => ({ ...current, [key]: value }))} keyboardType="number-pad" maxLength={1} style={partnerStyles.input} /></View>)}</View>
                  <Text style={partnerStyles.fieldLabel}>Parecer técnico</Text>
                  <TextInput value={parecer} onChangeText={setParecer} multiline style={[partnerStyles.input, partnerStyles.multilineInput]} placeholder="Pontos fortes e próximos passos" placeholderTextColor={partnerColors.muted} />
                  <Pressable disabled={saving} onPress={() => submitEvaluation(request)} style={[partnerStyles.primaryButton, saving && partnerStyles.primaryButtonDisabled]}><Text style={partnerStyles.primaryButtonText}>{saving ? 'Registrando...' : 'Registrar avaliação'}</Text></Pressable>
                </> : <Text style={styles.done}>Avaliação concluída</Text>}
              </View>
            )) : <View style={partnerStyles.card}><Text style={partnerStyles.sectionTitle}>Nenhuma avaliação pendente</Text><Text style={styles.copy}>As solicitações de instituições aparecerão aqui.</Text></View>
          ) : !routeParams.athleteId ? <View style={partnerStyles.card}><Text style={partnerStyles.sectionTitle}>Selecione um candidato</Text><Text style={styles.copy}>Abra o perfil de um candidato para solicitar uma avaliação técnica.</Text></View> : (
            <View style={partnerStyles.card}><Text style={partnerStyles.sectionTitle}>Treinadores verificados</Text><Text style={styles.copy}>A avaliação será associada apenas a este candidato e à oportunidade atual.</Text>{trainers.map((trainer) => <Pressable key={trainer.id} onPress={() => setSelectedTrainerId(trainer.id)} style={[styles.trainerChoice, selectedTrainerId === trainer.id && styles.selected]}><Text style={styles.choiceTitle}>{trainer.nomeExibicao || 'Treinador'}</Text><Text style={styles.copy}>{trainer.localizacao || 'Treinador verificado'}</Text></Pressable>)}<Pressable disabled={!selectedTrainerId || saving} onPress={requestEvaluation} style={[partnerStyles.primaryButton, (!selectedTrainerId || saving) && partnerStyles.primaryButtonDisabled]}><Text style={partnerStyles.primaryButtonText}>{saving ? 'Enviando...' : 'Solicitar avaliação'}</Text></Pressable></View>
          )}
        </ScrollView>
      )}
      <BottomNav go={go} role={isTrainer ? 'trainer' : 'institution'} active="opportunities" />
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 28, gap: 12 }, copy: { color: partnerColors.muted, fontSize: 12, lineHeight: 18, fontFamily: 'Poppins_400Regular', marginTop: 5, marginBottom: 10 }, scores: { flexDirection: 'row', gap: 8, marginBottom: 12 }, scoreField: { flex: 1, gap: 5 }, trainerChoice: { padding: 12, borderWidth: 1, borderColor: partnerColors.border, borderRadius: 7, marginBottom: 8 }, selected: { borderColor: partnerColors.green, backgroundColor: partnerColors.greenLight }, choiceTitle: { color: partnerColors.ink, fontSize: 13, fontFamily: 'Poppins_600SemiBold' }, done: { color: partnerColors.greenDark, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
})
