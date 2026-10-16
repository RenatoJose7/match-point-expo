import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import {
  EmptyState,
  FeedbackMessage,
  formatOpportunityDate,
  getOwnedOpportunity,
  getPartnerProfile,
  LoadingState,
  partnerColors,
  PartnerHeader,
  partnerStyles,
} from './partnerOpportunityUi'

const statusFilters = [
  { value: 'todas', label: 'Todas' },
  { value: 'inscrita', label: 'Inscritas' },
  { value: 'documentos_enviados', label: 'Documentos' },
  { value: 'em_analise', label: 'Em análise' },
  { value: 'aprovada', label: 'Aprovadas' },
  { value: 'rejeitada', label: 'Rejeitadas' },
]

const applicationStatus = {
  iniciada: { label: 'Iniciada', backgroundColor: '#eef1ed', color: partnerColors.muted },
  inscrita: { label: 'Inscrita', backgroundColor: partnerColors.greenLight, color: partnerColors.greenDark },
  documentos_enviados: { label: 'Documentos enviados', backgroundColor: '#eaf2fb', color: '#285b88' },
  em_analise: { label: 'Em análise', backgroundColor: partnerColors.amberLight, color: partnerColors.amber },
  aprovada: { label: 'Aprovada', backgroundColor: partnerColors.greenLight, color: partnerColors.greenDark },
  rejeitada: { label: 'Rejeitada', backgroundColor: partnerColors.redLight, color: partnerColors.red },
}

function CandidateCard({ application, profile, number, onOpenProfile }) {
  const status = applicationStatus[application.status] ?? {
    label: application.status || 'Sem status',
    backgroundColor: '#eef1ed',
    color: partnerColors.muted,
  }
  const documentCount = application.documentos?.length ?? 0
  const submittedAt = application.criadoEm ?? application.historico?.[0]?.data
  const updatedAt = application.atualizadoEm ?? application.historico?.at(-1)?.data

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={profile ? `Abrir perfil de ${profile.nome}` : 'Perfil público indisponível'}
      accessibilityState={{ disabled: !profile }}
      disabled={!profile}
      onPress={onOpenProfile}
      style={[styles.card, !profile && styles.cardUnavailable]}
    >
      <View style={styles.cardHeading}>
        <View style={styles.candidateMark}>
          {profile?.fotoUrl ? (
            <Image source={{ uri: profile.fotoUrl }} style={styles.candidatePhoto} />
          ) : (
            <Ionicons name="person-outline" size={18} color={partnerColors.green} />
          )}
        </View>
        <View style={styles.candidateCopy}>
          <Text numberOfLines={1} style={styles.candidateTitle}>
            {profile?.nome ?? `Candidatura ${String(number).padStart(2, '0')}`}
          </Text>
          <Text numberOfLines={1} style={styles.candidateDate}>
            {profile
              ? [profile.modalidade, profile.categoria].filter(Boolean).join(' · ') || 'Modalidade não informada'
              : 'Perfil público indisponível'}
          </Text>
        </View>
        <View style={[partnerStyles.statusBadge, { backgroundColor: status.backgroundColor }]}>
          <Text style={[partnerStyles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {profile?.posicao || profile?.equipeAtual ? (
        <Text numberOfLines={1} style={styles.candidateMeta}>
          {[profile.posicao, profile.equipeAtual].filter(Boolean).join(' · ')}
        </Text>
      ) : null}

      <View style={styles.metrics}>
        {application.matchScore !== undefined && application.matchScore !== null ? (
          <Metric icon="analytics-outline" label="Match Score" value={`${application.matchScore}%`} />
        ) : null}
        <Metric icon="document-text-outline" label="Documentos" value={`${documentCount}`} />
        <Metric icon="time-outline" label="Atualizada" value={formatOpportunityDate(updatedAt)} />
      </View>
    </Pressable>
  )
}

function Metric({ icon, label, value }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={15} color={partnerColors.green} />
      <View style={styles.metricCopy}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  )
}

export function PartnerOpportunityCandidatesScreen({ go, back, repositories, session, routeParams = {} }) {
  const role = session?.tipo === 'treinador' ? 'trainer' : 'institution'
  const opportunityId = routeParams.opportunityId
  const [opportunity, setOpportunity] = useState(null)
  const [applications, setApplications] = useState([])
  const [publicProfiles, setPublicProfiles] = useState({})
  const [statusFilter, setStatusFilter] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    Promise.resolve()
      .then(async () => {
        const partner = await getPartnerProfile(repositories, session)
        if (!opportunityId) throw new Error('O identificador da oportunidade não foi informado.')

        const ownedOpportunity = await getOwnedOpportunity(repositories, partner.id, opportunityId)
        const result = await repositories.applications.listarCandidatosDaOportunidade(opportunityId)
        if (!result.ok) throw new Error(result.mensagem || 'Não foi possível carregar as candidaturas.')
        const profileEntries = await Promise.all(result.data.map(async (application) => {
          try {
            const profileResult = await repositories.applications.obterPerfilPublicoCandidato(
              opportunityId,
              application.atletaId,
            )
            return [application.id, profileResult.ok ? profileResult.data : null]
          } catch {
            return [application.id, null]
          }
        }))

        if (active) {
          setOpportunity(ownedOpportunity)
          setApplications(result.data)
          setPublicProfiles(Object.fromEntries(profileEntries))
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Não foi possível carregar as candidaturas.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [repositories, session, opportunityId, refreshKey])

  const orderedApplications = [...applications].sort((first, second) => (
    new Date(second.criadoEm ?? second.historico?.[0]?.data ?? 0).getTime()
      - new Date(first.criadoEm ?? first.historico?.[0]?.data ?? 0).getTime()
  ))

  const filteredApplications = statusFilter === 'todas'
    ? orderedApplications
    : orderedApplications.filter((application) => application.status === statusFilter)

  return (
    <View style={partnerStyles.page}>
      <PartnerHeader
        title="Candidaturas"
        subtitle={opportunity?.titulo || 'Oportunidade do parceiro'}
        onBack={back}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {statusFilters.map((filter) => {
          const selected = statusFilter === filter.value
          return (
            <Pressable
              key={filter.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setStatusFilter(filter.value)}
              style={[styles.filter, selected && styles.filterSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{filter.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {loading ? (
        <LoadingState label="Carregando candidaturas..." />
      ) : error ? (
        <View style={styles.stateContent}>
          <FeedbackMessage>{error}</FeedbackMessage>
          <Pressable accessibilityRole="button" onPress={() => setRefreshKey((value) => value + 1)} style={partnerStyles.primaryButton}>
            <Ionicons name="refresh" size={16} color={partnerColors.white} />
            <Text style={partnerStyles.primaryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : applications.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Nenhuma candidatura ainda"
          description="Quando atletas se candidatarem a esta oportunidade, elas aparecerão aqui."
        />
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          icon="filter-outline"
          title="Nenhuma candidatura neste status"
          description="Escolha outro status para consultar as candidaturas recebidas."
          action={(
            <Pressable accessibilityRole="button" onPress={() => setStatusFilter('todas')} style={partnerStyles.secondaryButton}>
              <Text style={partnerStyles.secondaryButtonText}>Mostrar todas</Text>
            </Pressable>
          )}
        />
      ) : (
        <ScrollView style={partnerStyles.scroll} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summary}>
            <Text style={styles.summaryCount}>{filteredApplications.length}</Text>
            <Text style={styles.summaryText}>{filteredApplications.length === 1 ? 'candidatura' : 'candidaturas'}</Text>
            <View style={{ flex: 1 }} />
            <Pressable accessibilityRole="button" accessibilityLabel="Atualizar candidaturas" onPress={() => setRefreshKey((value) => value + 1)}>
              <Ionicons name="refresh-outline" size={19} color={partnerColors.green} />
            </Pressable>
          </View>
          {filteredApplications.map((application) => (
            <CandidateCard
              key={application.id}
              application={application}
              profile={publicProfiles[application.id]}
              number={orderedApplications.indexOf(application) + 1}
              onOpenProfile={() => go('partnerCandidateProfile', {
                opportunityId,
                athleteId: application.atletaId,
              })}
            />
          ))}
        </ScrollView>
      )}

      <BottomNav go={go} role={role} active="opportunities" />
    </View>
  )
}

const styles = StyleSheet.create({
  filters: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, gap: 8 },
  filter: { minHeight: 34, paddingHorizontal: 13, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: partnerColors.white, borderWidth: 1, borderColor: partnerColors.border },
  filterSelected: { backgroundColor: partnerColors.greenDark, borderColor: partnerColors.greenDark },
  filterText: { color: partnerColors.muted, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  filterTextSelected: { color: partnerColors.white },
  stateContent: { flex: 1, justifyContent: 'center', padding: 20, gap: 14 },
  listContent: { paddingHorizontal: 20, paddingBottom: 22, gap: 11 },
  summary: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 1 },
  summaryCount: { color: partnerColors.ink, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  summaryText: { color: partnerColors.muted, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  card: { backgroundColor: partnerColors.white, borderColor: partnerColors.border, borderWidth: 1, borderRadius: 8, padding: 14, gap: 13 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  candidateMark: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: partnerColors.greenLight },
  candidatePhoto: { width: 38, height: 38, borderRadius: 19 },
  candidateCopy: { flex: 1, minWidth: 0, gap: 2 },
  candidateTitle: { color: partnerColors.ink, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  candidateDate: { color: partnerColors.muted, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  candidateMeta: { color: partnerColors.muted, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  metrics: { paddingTop: 11, borderTopWidth: 1, borderTopColor: partnerColors.border, flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  metric: { flex: 1, minWidth: 82, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  metricCopy: { flex: 1, minWidth: 0, gap: 2 },
  metricLabel: { color: partnerColors.muted, fontSize: 9, fontFamily: 'Poppins_400Regular' },
  metricValue: { color: partnerColors.ink, fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
})