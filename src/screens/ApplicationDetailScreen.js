import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { Button } from '../components/ui/Button'
import { styles } from '../theme/styles'

const statusLabel = (status) => ({
  inscrita: 'Inscrita',
  documentos_enviados: 'Documentos enviados',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
}[status] ?? status?.replaceAll('_', ' ') ?? 'Não informado')

export function ApplicationDetailScreen({ go, back, repositories, routeParams = {} }) {
  const [application, setApplication] = useState(null)
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const applicationId = routeParams.applicationId

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        if (!applicationId) throw new Error('Não foi possível identificar a candidatura.')
        const applicationResult = await repositories.applications.obterCandidatura(applicationId)
        if (!applicationResult.ok) throw new Error(applicationResult.mensagem || 'Candidatura não encontrada.')
        const opportunityResult = await repositories.opportunities.obterOportunidade(applicationResult.data.oportunidadeId)
        if (!opportunityResult.ok) throw new Error(opportunityResult.mensagem || 'Oportunidade não encontrada.')
        if (active) { setApplication(applicationResult.data); setOpportunity(opportunityResult.data) }
      } catch (loadError) { if (active) setError(loadError.message || 'Não foi possível carregar a candidatura.') } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [applicationId, repositories, reloadKey])

  return (
    <View style={styles.detailScreen}>
      <BackButton onPress={back} />
      {loading ? <View style={styles.detailBody}><Text style={localStyles.state}>Carregando candidatura...</Text></View> : null}
      {!loading && error ? <View style={styles.detailBody}><Text accessibilityRole="alert" style={localStyles.error}>{error}</Text><Button wide onPress={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button></View> : null}
      {!loading && application && opportunity ? <>
      <Text style={styles.detailHeading}>{opportunity.titulo}</Text>
      <Text style={styles.profileRole}>{[opportunity.modalidade, opportunity.categoria].filter(Boolean).join(' · ')}</Text>
      <Text style={styles.statusBadge}>{statusLabel(application.status)}</Text>
      <ScrollView contentContainerStyle={styles.detailBody}>
        <Text style={styles.sectionTitle}>Status da candidatura</Text>
        {(application.historico ?? []).length ? application.historico.map((event) => <Text key={event.id} style={styles.timeline}>✓ {event.descricao || statusLabel(event.statusNovo || event.status)}　{new Date(event.data).toLocaleDateString('pt-BR')}</Text>) : <Text style={styles.document}>Ainda não há movimentações registradas.</Text>}
        <Text style={styles.sectionTitle}>Documentos enviados</Text>
        {(application.documentos ?? []).length ? application.documentos.map((item) => <Text key={item.id} style={styles.document}>{item.nome || item.tipo || 'Documento enviado'}</Text>) : <Text style={styles.document}>Nenhum documento enviado.</Text>}
        <Button wide onPress={() => go('opportunitiesAthlete')}>Ver oportunidades</Button>
      </ScrollView>
      </> : null}
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}

const localStyles = StyleSheet.create({ state: { color: '#526770', fontFamily: 'Poppins_400Regular', textAlign: 'center' }, error: { color: '#9b2c2c', fontFamily: 'Poppins_500Medium', textAlign: 'center' } })
