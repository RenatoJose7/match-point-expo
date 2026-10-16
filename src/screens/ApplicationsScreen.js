import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BottomNav } from '../components/navigation/BottomNav'
import { ListHeader } from '../components/ListHeader'
import { Button } from '../components/ui/Button'
import { USER_TYPES } from '../domain/contracts.js'
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
  return Number.isNaN(date.getTime()) ? 'Data não informada' : date.toLocaleDateString('pt-BR')
}

function lastUpdatedAt(application) {
  return application.atualizadoEm
    || application.criadoEm
    || application.historico?.at(-1)?.data
}

export function ApplicationsScreen({ go, back, repositories, session }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let active = true

    const loadApplications = async () => {
      setLoading(true)
      setError('')

      if (session?.tipo !== USER_TYPES.ATHLETE || !session.id) {
        setError('Não foi possível identificar a sessão do atleta.')
        setLoading(false)
        return
      }

      try {
        const profileResult = await repositories.users.obterPerfilAtletaPorUsuario(session.id)
        if (!active) return
        if (!profileResult.ok) {
          setError(profileResult.mensagem || 'Não foi possível carregar o perfil esportivo.')
          return
        }

        const applicationsResult = await repositories.applications.listarCandidaturasDoAtleta(profileResult.data.id)
        if (!active) return
        if (!applicationsResult.ok) {
          setError(applicationsResult.mensagem || 'Não foi possível carregar suas candidaturas.')
          return
        }

        const entries = await Promise.all(applicationsResult.data.map(async application => {
          const opportunityResult = await repositories.opportunities.obterOportunidade(application.oportunidadeId)
          return {
            ...application,
            opportunity: opportunityResult.ok ? opportunityResult.data : null,
          }
        }))
        if (active) setApplications(entries)
      } catch {
        if (active) setError('Não foi possível carregar suas candidaturas. Tente novamente.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadApplications()
    return () => { active = false }
  }, [repositories, session?.id, session?.tipo, retryToken])

  return (
    <View style={styles.listScreen}>
      <ListHeader title="Candidaturas" back={back} />
      <ScrollView contentContainerStyle={[styles.listContent, localStyles.content]}>
        {loading && <Text style={localStyles.state}>Carregando candidaturas...</Text>}
        {!loading && error ? (
          <View style={localStyles.stateBlock}>
            <Text accessibilityRole="alert" style={localStyles.error}>{error}</Text>
            <Button wide onPress={() => setRetryToken(value => value + 1)}>Tentar novamente</Button>
          </View>
        ) : null}
        {!loading && !error && applications.length === 0 ? (
          <Text style={localStyles.state}>Você ainda não tem candidaturas.</Text>
        ) : null}
        {!loading && !error && applications.map(application => (
          <Pressable
            key={application.id}
            accessibilityRole="button"
            accessibilityLabel={`Ver candidatura para ${application.opportunity?.titulo || 'oportunidade'}`}
            onPress={() => go('applicationDetail', {
              candidaturaId: application.id,
              oportunidadeId: application.oportunidadeId,
              atletaId: application.atletaId,
            })}
            style={localStyles.applicationCard}
          >
            <View style={localStyles.cardHeading}>
              <Text style={localStyles.applicationTitle}>{application.opportunity?.titulo || 'Oportunidade indisponível'}</Text>
              <Text style={localStyles.matchScore}>{Number.isFinite(application.matchScore) ? `${application.matchScore}%` : ''}</Text>
            </View>
            <Text style={localStyles.metadata}>
              {[application.opportunity?.modalidade, application.opportunity?.categoria, application.opportunity?.localizacao].filter(Boolean).join(' · ') || 'Detalhes indisponíveis'}
            </Text>
            <View style={localStyles.footer}>
              <Text style={localStyles.status}>{statusLabels[application.status] || application.status}</Text>
              <Text style={localStyles.date}>Atualizada {formatDate(lastUpdatedAt(application))}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <BottomNav go={go} active="applications" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  content: { gap: 10, paddingBottom: 24 },
  applicationCard: { gap: 6, borderBottomColor: '#d6e0e3', borderBottomWidth: 1, paddingVertical: 12 },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  applicationTitle: { flex: 1, color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  matchScore: { color: '#126b35', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  metadata: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginTop: 3 },
  status: { color: '#1f5894', fontFamily: 'Poppins_500Medium', fontSize: 12 },
  date: { color: '#65777e', fontFamily: 'Poppins_400Regular', fontSize: 10 },
  stateBlock: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  state: { color: '#526770', fontFamily: 'Poppins_400Regular', paddingVertical: 20, textAlign: 'center' },
  error: { color: '#b42318', fontFamily: 'Poppins_400Regular', textAlign: 'center' },
})
