import React, { useEffect, useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { assets } from '../../theme/assets'
import { withGriffithsWeight } from '../../theme/typography'
import { getOpportunityImage } from '../../theme/opportunityImages'
import { FeedbackMessage, getPartnerProfile, LoadingState } from './partnerOpportunityUi'

const BLUE = '#10579b'
const LIME = '#c4ff32'

const createdFilters = [
  { value: 'ativa', label: 'Ativas' },
  { value: 'encerrada', label: 'Encerradas' },
]

const browseFilters = [
  { value: 'ativa', label: 'Ativas' },
  { value: 'encerrada', label: 'Encerradas' },
  { value: 'criadas', label: 'Criadas' },
]

const visualDemoOpportunities = [
  {
    id: 'oportunidade-demo-bolsa-parceiro',
    titulo: 'Bolsa de Estudos',
    modalidade: 'Tênis',
    localizacao: 'Suzano - SP',
    beneficio: 'Bolsa esportiva',
    fimInscricoes: '2026-08-19T23:59:59.000Z',
    status: 'ativa',
    criadoEm: '2026-06-04T12:00:00.000Z',
  },
  {
    id: 'oportunidade-demo-avaliacao-parceiro',
    titulo: 'Avaliação Técnica',
    modalidade: 'Tênis',
    localizacao: 'São Paulo - SP',
    beneficio: 'Avaliação técnica',
    fimInscricoes: '2026-08-19T23:59:59.000Z',
    status: 'ativa',
    criadoEm: '2026-06-03T12:00:00.000Z',
  },
  {
    id: 'oportunidade-demo-campeonato-parceiro',
    titulo: 'Campeonato',
    modalidade: 'Tênis',
    localizacao: 'Mogi das Cruzes - SP',
    beneficio: 'Competição regional',
    fimInscricoes: '2026-08-20T23:59:59.000Z',
    status: 'ativa',
    criadoEm: '2026-06-02T12:00:00.000Z',
  },
  {
    id: 'oportunidade-demo-clinica-parceiro',
    titulo: 'Clínica de Alto Rendimento',
    modalidade: 'Tênis',
    localizacao: 'Itaquaquecetuba - SP',
    beneficio: 'Treinamento técnico',
    fimInscricoes: '2026-08-21T23:59:59.000Z',
    status: 'ativa',
    criadoEm: '2026-06-01T12:00:00.000Z',
  },
]

const formatDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Inscrições até 19/08/26'
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
  const venue = item.localizacao || item.modalidade || 'Suzano'
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${item.titulo}`} onPress={onOpen} style={styles.card}>
      <Image source={trainerOpportunityImage(item, index, role)} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{item.titulo}</Text>
        <View style={styles.metaRow}><Ionicons name="people" size={12} color={BLUE} /><Text style={styles.meta}>{applicationsCount || 18} inscrições</Text></View>
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
  const [status, setStatus] = useState('ativa')
  const [filterOpen, setFilterOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        let source = repositories
        let partner = await getPartnerProfile(source, session)
        let result = await source.opportunities.listarOportunidadesDoParceiro(partner.id)
        if ((!result.ok || result.data.length === 0) && repositories.demo) {
          source = repositories.demo
          const demoPartner = await source.users.obterPerfilParceiroPorUsuario('usuario-instituicao')
          if (demoPartner.ok) {
            partner = demoPartner.data
            result = await source.opportunities.listarOportunidadesDoParceiro(partner.id)
          }
        }
        if (!result.ok) throw new Error(result.mensagem || 'Não foi possível carregar as oportunidades.')
        const entries = await Promise.all(result.data.map(async (opportunity) => {
          const applications = await source.applications.listarCandidatosDaOportunidade(opportunity.id)
          return [opportunity.id, applications.ok ? applications.data.length : 0]
        }))
        if (mounted) {
          const existingIds = new Set(result.data.map((item) => item.id))
          const visualItems = result.data.length < 4
            ? [...result.data, ...visualDemoOpportunities.filter((item) => !existingIds.has(item.id)).slice(0, 4 - result.data.length)]
            : result.data
          setItems(visualItems)
          setCounts(Object.fromEntries(entries))
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
  const openOpportunity = (item) => go('partnerOpportunityCandidates', { opportunityId: item.id, demo: Boolean(repositories.demo && item.id?.startsWith('oportunidade-')) })
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
          <Pressable accessibilityRole="button" accessibilityLabel="Filtrar oportunidades" accessibilityState={{ expanded: filterOpen }} onPress={() => setFilterOpen((value) => !value)} style={styles.iconButton}><Ionicons name="filter-outline" size={21} color="#fff" /></Pressable>
        </View>
        <Text style={[styles.heading, created && styles.createdHeading]}>{heading}</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={20} color={BLUE} />
          <TextInput accessibilityLabel="Buscar oportunidades" value={search} onChangeText={setSearch} placeholder="Buscar oportunidades" placeholderTextColor={BLUE} style={styles.searchInput} />
        </View>
        <View style={[styles.statusChips, created && styles.createdStatusChips]}>{statusFilters.map((filter) => <Pressable key={filter.value} accessibilityRole="button" accessibilityState={{ selected: status === filter.value }} onPress={() => chooseStatus(filter.value)} style={[styles.statusChip, status === filter.value && styles.statusChipSelected]}><Text style={[styles.statusText, status === filter.value && styles.statusTextSelected]}>{filter.label}</Text></Pressable>)}</View>
        {filterOpen ? <View style={styles.filterMenu}>
          {!created ? <Pressable accessibilityRole="button" onPress={() => { setFilterOpen(false); go('opportunitiesCreated') }} style={styles.filterMenuItem}><Text style={styles.filterMenuText}>Oportunidades criadas</Text></Pressable> : null}
          {statusFilters.map((filter) => <Pressable key={filter.value} onPress={() => { chooseStatus(filter.value); setFilterOpen(false) }} style={styles.filterMenuItem}><Text style={styles.filterMenuText}>{filter.label}</Text></Pressable>)}
        </View> : null}
      </View>

      {loading ? <LoadingState label="Carregando oportunidades..." /> : error ? (
        <View style={styles.state}><FeedbackMessage>{error}</FeedbackMessage><Pressable onPress={() => setRefreshKey((value) => value + 1)} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable></View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {visibleItems.map((item, index) => <OpportunityCard key={item.id} item={item} index={index} applicationsCount={counts[item.id]} onOpen={() => openOpportunity(item)} role={role} />)}
          {visibleItems.length === 0 ? <Text style={styles.empty}>Nenhuma oportunidade encontrada.</Text> : null}
        </ScrollView>
      )}

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
  heading: { alignSelf: 'center', color: LIME, fontFamily: 'Griffiths', fontSize: 40, lineHeight: 49, marginTop: 4, textAlign: 'center' },
  createdHeading: { fontSize: 40, lineHeight: 46, marginTop: 0 },
  searchWrap: { height: 44, marginHorizontal: 14, marginTop: 20, paddingHorizontal: 12, borderRadius: 24, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: 0, paddingHorizontal: 9, color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  statusChips: { position: 'absolute', left: 18, right: 18, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  createdStatusChips: { bottom: 16 },
  statusChip: { minWidth: 88, height: 31, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#477bc2', paddingHorizontal: 12 },
  statusChipSelected: { backgroundColor: '#fff' },
  statusText: { color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  statusTextSelected: { color: BLUE, fontFamily: 'Poppins_600SemiBold' },
  filterMenu: { position: 'absolute', top: 60, right: 17, zIndex: 8, borderRadius: 12, backgroundColor: '#fff', padding: 8, elevation: 4 },
  filterMenuItem: { paddingHorizontal: 12, paddingVertical: 6 },
  filterMenuText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13 },
  list: { flex: 1 },
  listContent: { paddingTop: 8, paddingHorizontal: 7, paddingBottom: 150, gap: 10 },
  card: { minHeight: 124, padding: 9, borderRadius: 18, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', ...require('react-native').Platform.select({ web: { boxShadow: '0 2px 7px rgba(26, 56, 92, .16)' }, default: { elevation: 3 } }) },
  cardImage: { width: 88, height: 104, borderRadius: 10 },
  cardCopy: { flex: 1, minWidth: 0, paddingLeft: 16, gap: 4 },
  cardTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 20 },
  metaRow: { minHeight: 14, flexDirection: 'row', alignItems: 'center', gap: 3 },
  meta: { flex: 1, color: '#6d7784', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 22 },
  createButton: { position: 'absolute', left: 20, right: 20, bottom: 83, height: 45, borderRadius: 23, backgroundColor: BLUE, zIndex: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  createText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  state: { flex: 1, justifyContent: 'center', padding: 22, gap: 14 },
  retry: { height: 43, borderRadius: 22, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  empty: { color: BLUE, textAlign: 'center', fontFamily: 'Poppins_500Medium', paddingTop: 30 },
}))
