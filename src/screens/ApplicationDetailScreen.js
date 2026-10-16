import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { Button } from '../components/ui/Button'
import { styles } from '../theme/styles'

const statusLabels = {
  iniciada: 'Iniciada',
  inscrita: 'Inscrita',
  documentos_enviados: 'Documentos enviados',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
}

function formatDate(value) {
  if (!value) return 'Data não informada'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Data não informada' : date.toLocaleString('pt-BR')
}

function lastUpdatedAt(application) {
  return application.atualizadoEm
    || application.criadoEm
    || application.historico?.at(-1)?.data
}

export function ApplicationDetailScreen({ go, back, repositories, routeParams = {} }) {
  const { candidaturaId } = routeParams
  const [application, setApplication] = useState(null)
  const [opportunity, setOpportunity] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let active = true

    const loadDetails = async () => {
      setLoading(true)
      setError('')

      if (!candidaturaId) {
        setError('O identificador da candidatura não foi informado.')
        setLoading(false)
        return
      }

      try {
        const applicationResult = await repositories.applications.obterCandidatura(candidaturaId)
        if (!active) return
        if (!applicationResult.ok) {
          setError(applicationResult.mensagem || 'Não foi possível carregar a candidatura.')
          return
        }

        const [opportunityResult, historyResult] = await Promise.all([
          repositories.opportunities.obterOportunidade(applicationResult.data.oportunidadeId),
          repositories.applications.listarHistoricoDaCandidatura(candidaturaId),
        ])
        if (!active) return

        setApplication(applicationResult.data)
        setOpportunity(opportunityResult.ok ? opportunityResult.data : null)
        setHistory(historyResult.ok ? historyResult.data : applicationResult.data.historico ?? [])
      } catch {
        if (active) setError('Não foi possível carregar a candidatura. Tente novamente.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDetails()
    return () => { active = false }
  }, [candidaturaId, repositories, retryToken])

  return (
    <View style={styles.detailScreen}>
      <BackButton onPress={back} />
      {loading ? (
        <Text style={localStyles.state}>Carregando candidatura...</Text>
      ) : error ? (
        <View style={localStyles.stateBlock}>
          <Text accessibilityRole="alert" style={localStyles.error}>{error}</Text>
          <Button wide onPress={() => setRetryToken(value => value + 1)}>Tentar novamente</Button>
        </View>
      ) : application ? (
        <>
          <Text style={styles.detailHeading}>{opportunity?.titulo || 'Candidatura'}</Text>
          <Text style={styles.profileRole}>{[opportunity?.modalidade, opportunity?.categoria].filter(Boolean).join(' · ') || 'Oportunidade indisponível'}</Text>
          <Text style={styles.statusBadge}>{statusLabels[application.status] || application.status}</Text>
          <View style={styles.detailBody}>
            <ScrollView contentContainerStyle={localStyles.content}>
              <Text style={styles.sectionTitle}>Status e histórico</Text>
              {history.length ? history.map(event => (
                <View key={event.id} style={localStyles.event}>
                  <Text style={localStyles.eventStatus}>{statusLabels[event.status] || event.status}</Text>
                  {!!event.descricao && <Text style={localStyles.eventDescription}>{event.descricao}</Text>}
                  <Text style={localStyles.eventDate}>{formatDate(event.data)}</Text>
                </View>
              )) : <Text style={localStyles.empty}>Ainda não há eventos no histórico.</Text>}

              <Text style={styles.sectionTitle}>Documentos enviados</Text>
              {application.documentos?.length ? application.documentos.map(document => (
                <View key={document.id} style={localStyles.documentRow}>
                  <Text style={localStyles.documentName}>{document.nome || document.tipo || 'Documento'}</Text>
                  <Text style={localStyles.documentStatus}>{document.status || 'Enviado'}</Text>
                </View>
              )) : <Text style={localStyles.empty}>Nenhum documento enviado.</Text>}

              <Text style={localStyles.updated}>Última atualização: {formatDate(lastUpdatedAt(application))}</Text>
              <Button wide onPress={() => go('opportunitiesAthlete')}>Ver oportunidades</Button>
            </ScrollView>
          </View>
        </>
      ) : null}
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  content: { flexGrow: 1, gap: 8, paddingBottom: 24 },
  event: { borderLeftWidth: 3, borderLeftColor: '#73b94c', gap: 3, marginBottom: 8, paddingLeft: 10, paddingVertical: 4 },
  eventStatus: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  eventDescription: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 12 },
  eventDate: { color: '#65777e', fontFamily: 'Poppins_400Regular', fontSize: 10 },
  documentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomColor: '#e0e6e8', borderBottomWidth: 1, paddingVertical: 8 },
  documentName: { flex: 1, color: '#17313c', fontFamily: 'Poppins_500Medium', fontSize: 12 },
  documentStatus: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 10 },
  empty: { color: '#65777e', fontFamily: 'Poppins_400Regular', fontSize: 12, paddingVertical: 6 },
  updated: { color: '#65777e', fontFamily: 'Poppins_400Regular', fontSize: 10, marginTop: 8 },
  stateBlock: { flex: 1, justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
  state: { color: '#526770', fontFamily: 'Poppins_400Regular', paddingVertical: 24, textAlign: 'center' },
  error: { color: '#b42318', fontFamily: 'Poppins_400Regular', textAlign: 'center' },
})
