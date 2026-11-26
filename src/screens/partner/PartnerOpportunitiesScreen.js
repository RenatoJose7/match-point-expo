import React, { useEffect, useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View, RefreshControl } from 'react-native'
import { Text, TextInput } from '../../components/accessibility/AppText'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { assets } from '../../theme/assets'
import { withGriffithsWeight } from '../../theme/typography'
import { getOpportunityImage } from '../../theme/opportunityImages'
import { FeedbackMessage, getPartnerProfile, LoadingState } from './partnerOpportunityUi'
import { loadPartnerOpportunities } from './partnerOpportunitiesData'

const BLUE = '#10579b'
const LIME = '#c4ff32'

// Rascunhos ficam visíveis aqui, junto com as oportunidades publicadas.
const createdFilters = [
  { value: 'ativa', label: 'Ativas' },
  { value: 'rascunho', label: 'Rascunhos' },
  { value: 'encerrada', label: 'Encerradas' },
]

const browseFilters = [
  { value: 'ativa', label: 'Ativas' },
  { value: 'encerrada', label: 'Encerradas' },
  { value: 'criadas', label: 'Criadas' },
]


const formatDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Inscrições abertas'
  return `Inscrições até ${new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' })}`
}

function trainerOpportunityImage(item, index, role) {
  const context = `${item?.titulo ?? ''} ${item?.modalidade ?? ''} ${item?.beneficio ?? ''}`.toLocaleLowerCase('pt-BR')
  if (role === 'trainer') {
    if (context.includes('bolsa')) return assets.opportunityPurpleCourt
    if (context.includes('avaliação') || context.includes('avaliacao')) return assets.opportunityBlueCourt
    if (context.includes('clínica') || context.includes('clinica')) return assets.opportunityMountains
    if (context.includes('circuito') || context.includes('campeonato')) return assets.opportunityClayCourt
  }
  if (context.includes('bolsa')) return assets.opportunityMountains
  if (context.includes('futebol')) return assets.opportunityPurpleCourt
  if (context.includes('avaliação') || context.includes('avaliacao') || context.includes('clínica') || context.includes('clinica')) return assets.opportunityClayCourt
  if (context.includes('circuito') || context.includes('campeonato')) return assets.opportunityBlueCourt
  return getOpportunityImage(item, index)
}

function OpportunityCard({ item, index, applicationsCount, onOpen, role }) {
  const venue = item.localizacao || item.modalidade || 'Local não informado'
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${item.titulo}`} onPress={onOpen} style={styles.card}>
      <Image source={trainerOpportunityImage(item, index, role)} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{item.titulo}</Text>
        <View style={styles.metaRow}><Ionicons name="people" size={12} color={BLUE} /><Text style={styles.meta}>{applicationsCount === 1 ? '1 inscrição' : `${applicationsCount} inscrições`}</Text></View>
        <View style={styles.metaRow}><Ionicons name="briefcase" size={11} color={BLUE} /><Text style={styles.meta}>{venue}</Text></View>
        <View style={styles.metaRow}><Ionicons name="calendar" size={11} color={BLUE} /><Text style={styles.meta}>{formatDate(item.fimInscricoes)}</Text></View>
      </View>
    </Pressable>
  )
}

export function PartnerOpportunitiesScreen({ go, back, repositories, session, routeParams = {}, created = false }) {
  const role = session?.tipo === 'treinador' ? 'trainer' : 'institution'
  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(routeParams.status || 'ativa')
  const [filterOpen, setFilterOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await loadPartnerOpportunities(repositories, session)
        if (mounted) {
          setItems(data.items)
          setCounts(data.counts)
        }
      } catch (loadError) {
        if (mounted) setError(loadError.message || 'Não foi possível carregar as oportunidades.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [repositories, session, refreshKey])

  const visibleItems = useMemo(() => items
    .filter((item) => item.status === status)
    .filter((item) => !search.trim() || `${item.titulo} ${item.modalidade} ${item.localizacao}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
    .sort((a, b) => new Date(b.atualizadoEm ?? b.criadoEm ?? 0) - new Date(a.atualizadoEm ?? a.criadoEm ?? 0)), [items, created, search, status])

  const heading = created ? 'Oportunidades\ncriadas' : 'Oportunidades'
  // Oportunidade real abre o detalhe (editar, publicar rascunho, encerrar, ver candidatos);
  // a de exemplo vai direto para os candidatos de exemplo.
  const openOpportunity = (item) => {
    const demo = Boolean(item.inscricoesExemplo !== undefined || (repositories.demo && item.id?.startsWith('oportunidade-')))
    if (demo) go('partnerOpportunityCandidates', { opportunityId: item.id, title: item.titulo, demo: true, demoCount: item.inscricoesExemplo })
    else go('partnerOpportunityDetail', { opportunityId: item.id })
  }
  const statusFilters = created ? createdFilters : browseFilters
  const chooseStatus = (value) => {
    if (value === 'criadas' && !created) {
      go('opportunitiesCreated')
      return
    }
    setStatus(value)
  }

  return (
    <View style={styles.page}>
      <View style={[styles.header, created && styles.createdHeader]}>
        <View style={styles.headerStripe} />
        <View style={styles.headerTop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} onPress={back} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color="#fff" /></Pressable>
          <Image source={assets.monogram} style={styles.mark} resizeMode="contain" />
          <Pressable accessibilityRole="button" accessibilityLabel="Filtrar oportunidades" accessibilityState={{ expanded: filterOpen }} onPress={() => setFilterOpen((value) => !value)} style={styles.iconButton}><Ionicons name="funnel-outline" size={22} color="#fff" /></Pressable>
        </View>
        <Text style={[styles.heading, created && styles.createdHeading]}>{heading}</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={20} color={BLUE} />
          <TextInput accessibilityLabel="Buscar oportunidades" value={search} onChangeText={setSearch} placeholder="Buscar oportunidades" placeholderTextColor={BLUE} style={styles.searchInput} />
        </View>
        <View style={[styles.statusChips, created && styles.createdStatusChips]}>{statusFilters.map((filter) => <Pressable key={filter.value} accessibilityRole="button" accessibilityState={{ selected: status === filter.value }} onPress={() => chooseStatus(filter.value)} style={[styles.statusChip, status === filter.value && styles.statusChipSelected]}><Text style={[styles.statusText, status === filter.value && styles.statusTextSelected]}>{filter.label}</Text></Pressable>)}</View>
        {filterOpen ? <View style={styles.filterMenu}>
          {!created ? <Pressable accessibilityRole="button" onPress={() => { setFilterOpen(false); go('opportunitiesCreated') }} style={styles.filterMenuItem}><Text style={styles.filterMenuText}>Oportunidades criadas</Text></Pressable> : null}
          {statusFilters.map((filter) => <Pressable accessibilityRole="button" key={filter.value} onPress={() => { chooseStatus(filter.value); setFilterOpen(false) }} style={styles.filterMenuItem}><Text style={styles.filterMenuText}>{filter.label}</Text></Pressable>)}
        </View> : null}
      </View>

      {loading ? <LoadingState label="Carregando oportunidades..." /> : error ? (
        <View style={styles.state}><FeedbackMessage>{error}</FeedbackMessage><Pressable accessibilityRole="button" onPress={() => setRefreshKey((value) => value + 1)} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable></View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={false} onRefresh={() => setRefreshKey((value) => value + 1)} colors={[BLUE]} />}>
          {routeParams.flashMessage ? <FeedbackMessage tone="success">{routeParams.flashMessage}</FeedbackMessage> : null}
          {visibleItems.map((item, index) => <OpportunityCard key={item.id} item={item} index={index} applicationsCount={counts[item.id] ?? item.inscricoesExemplo ?? 0} onOpen={() => openOpportunity(item)} role={role} />)}
          {visibleItems.length === 0 ? <Text style={styles.empty}>Nenhuma oportunidade encontrada.</Text> : null}
        </ScrollView>
      )}

      <View pointerEvents="none" style={styles.createBackdrop} />
      <Pressable accessibilityRole="button" accessibilityLabel="Criar nova oportunidade" onPress={() => go('partnerOpportunityForm')} style={styles.createButton}><Ionicons name="add-circle" size={23} color="#fff" /><Text style={styles.createText}>Criar nova oportunidade</Text></Pressable>
      <BottomNav go={go} role={role} active="opportunities" />
    </View>
  )
}

const styles = StyleSheet.create(withGriffithsWeight({
  page: { flex: 1, backgroundColor: '#f3f4f4' },
  header: { backgroundColor: BLUE, height: 266, overflow: 'hidden', position: 'relative', zIndex: 2 },
  createdHeader: { height: 317 },
  headerStripe: { position: 'absolute', bottom: -38, left: -51, width: 220, height: 104, backgroundColor: '#e6e7e8', transform: [{ rotate: '52deg' }] },
  headerTop: { height: 91, paddingTop: 27, paddingHorizontal: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 56, height: 60 },
  heading: { alignSelf: 'center', color: LIME, fontFamily: 'Griffiths', fontSize: 48, lineHeight: 54, marginTop: 4, textAlign: 'center' },
  createdHeading: { fontSize: 40, lineHeight: 46, marginTop: 0 },
  searchWrap: { height: 44, marginHorizontal: 14, marginTop: 20, paddingHorizontal: 12, borderRadius: 24, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: 0, paddingHorizontal: 9, color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 14 },
  statusChips: { position: 'absolute', left: 18, right: 18, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  createdStatusChips: { bottom: 16 },
  statusChip: { minWidth: 88, height: 31, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#477bc2', paddingHorizontal: 12 },
  statusChipSelected: { backgroundColor: '#fff' },
  statusText: { color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 14 },
  statusTextSelected: { color: BLUE, fontFamily: 'Poppins_600SemiBold' },
  filterMenu: { position: 'absolute', top: 60, right: 17, zIndex: 8, borderRadius: 12, backgroundColor: '#fff', padding: 8, elevation: 4 },
  filterMenuItem: { paddingHorizontal: 12, paddingVertical: 6 },
  filterMenuText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13 },
  list: { flex: 1 },
  listContent: { paddingTop: 8, paddingHorizontal: 7, paddingBottom: 150, gap: 10 },
  card: { minHeight: 124, padding: 9, borderRadius: 18, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', ...require('react-native').Platform.select({ web: { boxShadow: '0 2px 7px rgba(26, 56, 92, .16)' }, default: { elevation: 3 } }) },
  cardImage: { width: 88, height: 104, borderRadius: 10 },
  cardCopy: { flex: 1, minWidth: 0, paddingLeft: 16, gap: 4 },
  cardTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 16, lineHeight: 20 },
  metaRow: { minHeight: 14, flexDirection: 'row', alignItems: 'center', gap: 3 },
  meta: { flex: 1, color: '#6d7784', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18 },
  // Faixa atrás do botão fixo: o cartão que rola some por baixo dela, sem aparecer cortado.
  createBackdrop: { position: 'absolute', left: 0, right: 0, bottom: 72, height: 66, backgroundColor: '#f1f3f3', zIndex: 3 },
  createButton: { position: 'absolute', left: 20, right: 20, bottom: 83, height: 45, borderRadius: 23, backgroundColor: BLUE, zIndex: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  createText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  state: { flex: 1, justifyContent: 'center', padding: 22, gap: 14 },
  retry: { height: 43, borderRadius: 22, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  empty: { color: BLUE, textAlign: 'center', fontFamily: 'Poppins_500Medium', paddingTop: 30 },
}))
