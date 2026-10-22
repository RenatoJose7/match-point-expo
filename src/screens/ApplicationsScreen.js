import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BottomNav } from '../components/navigation/BottomNav'
import { ListHeader } from '../components/ListHeader'
import { styles } from '../theme/styles'

const labelForStatus = (status) => ({ inscrita: 'Inscrita', documentos_enviados: 'Documentos enviados', em_analise: 'Em análise', aprovada: 'Aprovada', rejeitada: 'Rejeitada' }[status] || status)

export function ApplicationsScreen({ go, back, repositories, session }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const athleteResult = await repositories.users.obterPerfilAtletaPorUsuario(session?.id)
        if (!athleteResult.ok) throw new Error(athleteResult.mensagem || 'Não foi possível identificar o atleta.')
        const applicationsResult = await repositories.applications.listarCandidaturasDoAtleta(athleteResult.data.id)
        if (!applicationsResult.ok) throw new Error(applicationsResult.mensagem || 'Não foi possível carregar suas candidaturas.')
        const resolved = await Promise.all(applicationsResult.data.map(async (application) => {
          const opportunityResult = await repositories.opportunities.obterOportunidade(application.oportunidadeId)
          return { ...application, opportunity: opportunityResult.ok ? opportunityResult.data : null }
        }))
        if (active) setApplications(resolved)
      } catch (loadError) {
        if (active) setError(loadError.message || 'Não foi possível carregar suas candidaturas.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [repositories, retryToken, session?.id])

  return (
    <View style={styles.listScreen}>
      <ListHeader title="Candidaturas" back={back} />
      <ScrollView contentContainerStyle={styles.listContent}>
        {loading ? <Text style={localStyles.state}>Carregando candidaturas...</Text> : null}
        {!loading && error ? <View style={localStyles.state}><Text accessibilityRole="alert" style={localStyles.error}>{error}</Text><Pressable onPress={() => setRetryToken((value) => value + 1)}><Text style={localStyles.retry}>Tentar novamente</Text></Pressable></View> : null}
        {!loading && !error && applications.length === 0 ? <View style={localStyles.state}><Text style={localStyles.emptyTitle}>Você ainda não tem candidaturas</Text><Text style={localStyles.emptyCopy}>Explore oportunidades compatíveis para iniciar uma candidatura.</Text><Pressable onPress={() => go('opportunitiesAthlete')}><Text style={localStyles.retry}>Ver oportunidades</Text></Pressable></View> : null}
        {!loading && !error && applications.map((application) => (
          <Pressable key={application.id} onPress={() => go('applicationDetail', { applicationId: application.id })} style={localStyles.card}>
            <View style={localStyles.cardHead}><Text style={localStyles.title}>{application.opportunity?.titulo || 'Oportunidade indisponível'}</Text><Text style={localStyles.status}>{labelForStatus(application.status)}</Text></View>
            <Text style={localStyles.meta}>{[application.opportunity?.modalidade, application.opportunity?.categoria].filter(Boolean).join(' · ') || 'Detalhes não informados'}</Text>
            <Text style={localStyles.meta}>Atualizada em {new Date(application.atualizadoEm || application.criadoEm).toLocaleDateString('pt-BR')}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <BottomNav go={go} active="applications" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  state: { alignItems: 'center', gap: 9, paddingVertical: 32 },
  error: { color: '#9b2c2c', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  retry: { color: '#126b35', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  emptyTitle: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  emptyCopy: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 12, textAlign: 'center' },
  card: { gap: 6, padding: 14, borderRadius: 9, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d5e0dc' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  status: { color: '#126b35', fontFamily: 'Poppins_600SemiBold', fontSize: 11 },
  meta: { color: '#526770', fontFamily: 'Poppins_400Regular', fontSize: 11 },
})
