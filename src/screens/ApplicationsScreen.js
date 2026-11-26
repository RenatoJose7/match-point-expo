import React, { useEffect, useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text, TextInput } from '../components/accessibility/AppText'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../components/navigation/BottomNav'
import { assets } from '../theme/assets'
import { getOpportunityImage } from '../theme/opportunityImages'
import { withGriffithsWeight } from '../theme/typography'
import { displayStatus, loadAthleteApplications, sampleExtra } from './applications/athleteApplications'

const BLUE = '#10579b'
const LIME = '#c4ff32'
const filters = [
  { id: 'todos', label: 'Todos' },
  { id: 'tecnicos', label: 'Técnicos' },
  { id: 'bolsas', label: 'Bolsas' },
]

function isScholarship(application) {
  const text = `${application.opportunity?.titulo || ''} ${application.opportunity?.beneficio || ''}`.toLocaleLowerCase('pt-BR')
  return text.includes('bolsa') || text.includes('financeiro')
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function searchKey(value) {
  return normalize(value).replace(/\b([a-z]{4,})[ao]\b/g, '$1')
}

function ApplicationCard({ application, index, onPress }) {
  // Data da inscrição (e não da última atualização).
  const created = application.criadoEm || application.historico?.[0]?.data || application.atualizadoEm
  const opportunity = application.opportunity ?? {}
  // Só mostra o que a oportunidade tem; nada inventado em candidatura real.
  const sport = [opportunity.modalidade, opportunity.categoria].filter(Boolean).join(' · ')
  const place = opportunity.instituicao || opportunity.localizacao
  const status = displayStatus(application, index)
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Abrir candidatura ${opportunity.titulo || ''}${application.demo ? ' (exemplo)' : ''}`} onPress={onPress} style={styles.card}>
      <Image source={getOpportunityImage(application.opportunity, index)} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardCopy}>
        <Text numberOfLines={2} style={styles.cardTitle}>{opportunity.titulo || 'Oportunidade'}</Text>
        {sport ? <Text numberOfLines={2} style={styles.detail}>{sport}</Text> : null}
        {place ? <Text numberOfLines={2} style={styles.detail}>{place}</Text> : null}
        {created ? <Text style={styles.date}>Inscrição feita em {new Date(created).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text> : null}
        {application.demo ? <Text style={styles.demoTag}>Exemplo</Text> : null}
      </View>
      <View style={[styles.status, status === 'Não selecionado' && styles.statusInactive]}><Text numberOfLines={1} style={[styles.statusText, status === 'Não selecionado' && styles.statusTextInactive]}>{status}</Text></View>
    </Pressable>
  )
}

export function ApplicationsScreen({ go, back, repositories, session }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [filterOpen, setFilterOpen] = useState(false)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const completeList = await loadAthleteApplications(repositories, session?.id)
        if (active) setApplications(completeList)
      } catch (loadError) {
        if (active) setError(loadError.message || 'Não foi possível carregar suas candidaturas.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [repositories, retryToken, session?.id])

  const visibleApplications = useMemo(() => applications
    .filter((item) => filter === 'todos' || (filter === 'bolsas' ? isScholarship(item) : !isScholarship(item)))
    .filter((item) => !search.trim() || searchKey(`${item.opportunity?.titulo || ''} ${item.opportunity?.modalidade || ''} ${item.opportunity?.categoria || ''} ${item.opportunity?.instituicao || ''}`).includes(searchKey(search.trim()))), [applications, filter, search])

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.stripe} />
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} onPress={back} style={styles.back}><Ionicons name="arrow-back" size={22} color="#fff" /></Pressable>
        <Image source={assets.monogram} style={styles.mark} resizeMode="contain" />
        <Pressable accessibilityRole="button" accessibilityLabel="Filtros" accessibilityState={{ expanded: filterOpen }} onPress={() => setFilterOpen((value) => !value)} style={styles.filterIcon}><Ionicons name="funnel-outline" size={22} color="#fff" /></Pressable>
        <Text style={styles.heading}>Candidaturas</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={20} color={BLUE} />
          <TextInput accessibilityLabel="Buscar oportunidades" value={search} onChangeText={setSearch} placeholder="Buscar oportunidades" placeholderTextColor={BLUE} style={styles.searchInput} />
        </View>
        <View style={styles.filterChips}>{filters.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: filter === item.id }} onPress={() => setFilter(item.id)} style={[styles.chip, filter === item.id && styles.chipSelected]}><Text style={[styles.chipText, filter === item.id && styles.chipTextSelected]}>{item.label}</Text></Pressable>)}</View>
        {filterOpen ? <View style={styles.filterMenu}><Text style={styles.menuTitle}>Filtrar candidaturas</Text>{filters.map((item) => <Pressable accessibilityRole="button" key={item.id} onPress={() => { setFilter(item.id); setFilterOpen(false) }} style={styles.menuItem}><Text style={styles.menuText}>{item.label}</Text></Pressable>)}</View> : null}
      </View>
      {loading ? <View style={styles.state}><Text style={styles.stateText}>Carregando candidaturas...</Text></View> : error ? <View style={styles.state}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setRetryToken((value) => value + 1)}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View> : visibleApplications.length === 0 ? <View style={styles.state}><Text style={styles.stateText}>Nenhuma candidatura encontrada.</Text><Pressable accessibilityRole="button" onPress={() => go('opportunitiesAthlete')}><Text style={styles.retry}>Ver oportunidades</Text></Pressable></View> : <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>{visibleApplications.map((application, index) => <ApplicationCard key={application.id} application={application} index={index} onPress={() => application.id === sampleExtra.id ? go('opportunitiesAthlete') : go('applicationDetail', { applicationId: application.id, demo: application.demo })} />)}</ScrollView>}
      <BottomNav go={go} active="applications" />
    </View>
  )
}

const styles = StyleSheet.create(withGriffithsWeight({
  page: { flex: 1, backgroundColor: '#f3f4f4' },
  header: { height: 284, backgroundColor: BLUE, position: 'relative', overflow: 'hidden', zIndex: 2 },
  stripe: { position: 'absolute', bottom: -8, left: -115, width: 337, height: 65, backgroundColor: '#e5e6e7', transform: [{ rotate: '54deg' }] },
  back: { position: 'absolute', top: 33, left: 14, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', top: 40, alignSelf: 'center', width: 52, height: 58 },
  filterIcon: { position: 'absolute', top: 36, right: 22, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  heading: { marginTop: 104, color: LIME, fontFamily: 'Griffiths', fontSize: 48, lineHeight: 54, textAlign: 'center' },
  searchWrap: { height: 44, marginHorizontal: 24, marginTop: 12, borderRadius: 22, backgroundColor: '#fff', paddingHorizontal: 10, alignItems: 'center', flexDirection: 'row' },
  searchInput: { flex: 1, minWidth: 0, paddingHorizontal: 6, color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 14 },
  filterChips: { position: 'absolute', left: 12, right: 12, bottom: 20, flexDirection: 'row', justifyContent: 'center', gap: 7 },
  chip: { flexShrink: 1, minWidth: 0, width: 99, height: 32, borderRadius: 16, backgroundColor: '#477bc2', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  chipSelected: { backgroundColor: '#fff' },
  chipText: { color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 14 },
  chipTextSelected: { color: BLUE, fontFamily: 'Poppins_600SemiBold' },
  filterMenu: { position: 'absolute', top: 67, right: 15, zIndex: 5, width: 154, padding: 11, borderRadius: 13, backgroundColor: '#fff', elevation: 4 },
  menuTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginBottom: 5 },
  menuItem: { paddingVertical: 5 },
  menuText: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 6, paddingTop: 6, paddingBottom: 84, gap: 10 },
  card: { minHeight: 134, borderRadius: 17, padding: 8, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...require('react-native').Platform.select({ web: { boxShadow: '0 2px 7px rgba(24, 48, 81, .16)' }, default: { elevation: 3 } }) },
  cardImage: { width: 94, height: 116, borderRadius: 9 },
  cardCopy: { flex: 1, minWidth: 0, paddingLeft: 10, paddingRight: 96, paddingVertical: 5, alignSelf: 'stretch', justifyContent: 'center', gap: 1 },
  cardTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 16, lineHeight: 20 },
  detail: { color: '#77808a', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 21 },
  date: { color: '#77808a', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 21 },
  demoTag: { alignSelf: 'flex-start', marginTop: 3, paddingHorizontal: 8, borderRadius: 9, overflow: 'hidden', backgroundColor: '#e8f0f8', color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 11, lineHeight: 18 },
  status: { position: 'absolute', right: 0, top: 0, minWidth: 91, height: 36, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 9, borderBottomLeftRadius: 9, backgroundColor: LIME },
  statusInactive: { backgroundColor: '#dfe1e3' },
  statusText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  statusTextInactive: { fontSize: 12 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  stateText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 14, textAlign: 'center' },
  error: { color: '#9b2c2c', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  retry: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
}))
