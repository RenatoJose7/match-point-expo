import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import {
  EmptyState,
  FeedbackMessage,
  getPartnerProfile,
  LoadingState,
  opportunityStatus,
  partnerColors,
  partnerStyles,
} from './partnerOpportunityUi'

const statusFilters = [
  { value: 'todas', label: 'Todas' },
  { value: 'ativa', label: 'Ativas' },
  { value: 'rascunho', label: 'Rascunhos' },
  { value: 'encerrada', label: 'Encerradas' },
]

function OpportunityCard({ opportunity, onOpen, onEdit }) {
  const status = opportunityStatus(opportunity.status)
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.cardMain}>
        <View style={styles.cardTopline}>
          <View style={[partnerStyles.statusBadge, { backgroundColor: status.backgroundColor }]}>
            <Text style={[partnerStyles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.cardDate}>{opportunity.fimInscricoes ? `Até ${new Date(opportunity.fimInscricoes).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : 'Sem prazo'}</Text>
        </View>
        <Text numberOfLines={2} style={styles.cardTitle}>{opportunity.titulo}</Text>
        <Text numberOfLines={1} style={styles.cardMeta}>{[opportunity.modalidade, opportunity.categoria].filter(Boolean).join(' · ') || 'Modalidade não informada'}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={partnerColors.muted} />
          <Text numberOfLines={1} style={styles.locationText}>{opportunity.localizacao || 'Localização não informada'}</Text>
        </View>
      </Pressable>
      <View style={styles.cardFooter}>
        <Pressable accessibilityRole="button" onPress={onOpen} style={styles.openButton}>
          <Text style={styles.openButtonText}>Ver detalhes</Text>
          <Ionicons name="arrow-forward" size={15} color={partnerColors.green} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${opportunity.titulo}`} onPress={onEdit} style={styles.editButton}>
          <Ionicons name="create-outline" size={18} color={partnerColors.ink} />
        </Pressable>
      </View>
    </View>
  )
}

export function PartnerOpportunitiesScreen({ go, repositories, session, routeParams = {} }) {
  const role = session?.tipo === 'treinador' ? 'trainer' : 'institution'
  const [partner, setPartner] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todas')
  const [refreshKey, setRefreshKey] = useState(0)
  const [successMessage, setSuccessMessage] = useState(routeParams.flashMessage ?? '')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    Promise.resolve()
      .then(async () => {
        const partnerProfile = await getPartnerProfile(repositories, session)
        const result = await repositories.opportunities.listarOportunidadesDoParceiro(partnerProfile.id)
        if (!result.ok) throw new Error(result.mensagem || 'Não foi possível carregar suas oportunidades.')
        if (active) {
          setPartner(partnerProfile)
          setOpportunities(result.data)
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Não foi possível carregar suas oportunidades.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [repositories, session, refreshKey])

  useEffect(() => {
    if (routeParams.flashMessage) setSuccessMessage(routeParams.flashMessage)
  }, [routeParams.flashMessage])

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const filteredOpportunities = opportunities
    .filter((item) => statusFilter === 'todas' || item.status === statusFilter)
    .filter((item) => !normalizedSearch || `${item.titulo} ${item.descricao} ${item.modalidade} ${item.localizacao}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
    .sort((first, second) => new Date(second.atualizadoEm ?? second.criadoEm ?? 0) - new Date(first.atualizadoEm ?? first.criadoEm ?? 0))

  const openCreate = () => go('partnerOpportunityForm', {})

  return (
    <View style={partnerStyles.page}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={partnerStyles.eyebrow}>MatchPoint · Parceiros</Text>
          <Text style={partnerStyles.pageTitle}>Oportunidades</Text>
          <Text style={partnerStyles.subtitle}>{partner?.nomeExibicao || 'Gerencie suas publicações'}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Criar oportunidade" onPress={openCreate} style={partnerStyles.headerAction}>
          <Ionicons name="add" size={24} color={partnerColors.white} />
        </Pressable>
      </View>

      {successMessage ? (
        <View style={styles.messageWrap}>
          <FeedbackMessage tone="success">{successMessage}</FeedbackMessage>
        </View>
      ) : null}

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={partnerColors.muted} />
        <TextInput
          accessibilityLabel="Buscar oportunidades"
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por título, modalidade ou local"
          placeholderTextColor="#849188"
          style={styles.searchInput}
          returnKeyType="search"
        />
        {search ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={partnerColors.muted} />
          </Pressable>
        ) : null}
      </View>

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
        <LoadingState label="Buscando oportunidades do parceiro..." />
      ) : error ? (
        <View style={styles.stateContent}>
          <FeedbackMessage>{error}</FeedbackMessage>
          <Pressable accessibilityRole="button" onPress={() => setRefreshKey((value) => value + 1)} style={partnerStyles.primaryButton}>
            <Ionicons name="refresh" size={16} color={partnerColors.white} />
            <Text style={partnerStyles.primaryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon="trophy-outline"
          title="Nenhuma oportunidade por aqui"
          description="Crie sua primeira oportunidade para começar a receber candidaturas."
          action={(
            <Pressable accessibilityRole="button" onPress={openCreate} style={partnerStyles.primaryButton}>
              <Ionicons name="add" size={18} color={partnerColors.white} />
              <Text style={partnerStyles.primaryButtonText}>Criar oportunidade</Text>
            </Pressable>
          )}
        />
      ) : filteredOpportunities.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Nenhum resultado"
          description="Ajuste a busca ou o filtro de status para encontrar uma oportunidade."
          action={(
            <Pressable accessibilityRole="button" onPress={() => { setSearch(''); setStatusFilter('todas') }} style={partnerStyles.secondaryButton}>
              <Text style={partnerStyles.secondaryButtonText}>Limpar filtros</Text>
            </Pressable>
          )}
        />
      ) : (
        <ScrollView style={partnerStyles.scroll} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.listSummary}>
            <Text style={styles.summaryCount}>{filteredOpportunities.length}</Text>
            <Text style={styles.summaryLabel}>{filteredOpportunities.length === 1 ? 'oportunidade' : 'oportunidades'}</Text>
            <View style={{ flex: 1 }} />
            <Pressable accessibilityRole="button" accessibilityLabel="Atualizar lista" onPress={() => setRefreshKey((value) => value + 1)}>
              <Ionicons name="refresh-outline" size={19} color={partnerColors.green} />
            </Pressable>
          </View>
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onOpen={() => go('partnerOpportunityDetail', { opportunityId: opportunity.id })}
              onEdit={() => go('partnerOpportunityForm', { opportunityId: opportunity.id })}
            />
          ))}
        </ScrollView>
      )}

      <BottomNav go={go} role={role} active="opportunities" />
    </View>
  )
}

const styles = StyleSheet.create({
  header: { ...partnerStyles.header, paddingBottom: 8 },
  headerCopy: { ...partnerStyles.headerCopy },
  messageWrap: { paddingHorizontal: 20, paddingBottom: 10 },
  searchWrap: { marginHorizontal: 20, marginTop: 8, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, borderWidth: 1, borderColor: partnerColors.border, borderRadius: 7, backgroundColor: partnerColors.white },
  searchInput: { flex: 1, minWidth: 0, color: partnerColors.ink, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  filters: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 13, gap: 8 },
  filter: { minHeight: 34, paddingHorizontal: 13, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: partnerColors.white, borderWidth: 1, borderColor: partnerColors.border },
  filterSelected: { backgroundColor: partnerColors.greenDark, borderColor: partnerColors.greenDark },
  filterText: { color: partnerColors.muted, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  filterTextSelected: { color: partnerColors.white },
  stateContent: { flex: 1, justifyContent: 'center', padding: 20, gap: 14 },
  listContent: { paddingHorizontal: 20, paddingBottom: 22, gap: 11 },
  listSummary: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 1 },
  summaryCount: { color: partnerColors.ink, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  summaryLabel: { color: partnerColors.muted, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  card: { backgroundColor: partnerColors.white, borderColor: partnerColors.border, borderWidth: 1, borderRadius: 8, padding: 14 },
  cardMain: { gap: 6 },
  cardTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardDate: { color: partnerColors.muted, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  cardTitle: { color: partnerColors.ink, fontSize: 15, lineHeight: 21, fontFamily: 'Poppins_600SemiBold' },
  cardMeta: { color: partnerColors.green, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { flex: 1, color: partnerColors.muted, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  cardFooter: { marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: partnerColors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  openButton: { minHeight: 35, flexDirection: 'row', alignItems: 'center', gap: 7 },
  openButtonText: { color: partnerColors.green, fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  editButton: { width: 36, height: 36, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: partnerColors.canvas },
})