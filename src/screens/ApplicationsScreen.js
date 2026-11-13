import React, { useEffect, useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../components/navigation/BottomNav'
import { assets } from '../theme/assets'
import { getOpportunityImage } from '../theme/opportunityImages'
import { withGriffithsWeight } from '../theme/typography'

const BLUE = '#10579b'
const LIME = '#c4ff32'
const filters = [
  { id: 'todos', label: 'Todos' },
  { id: 'tecnicos', label: 'Técnicos' },
  { id: 'bolsas', label: 'Bolsas' },
]

const sampleExtra = {
  id: 'demonstracao-apoio-financeiro',
  status: 'nao_selecionado',
  demo: true,
  opportunity: {
    titulo: 'Apoio Financeiro',
    modalidade: 'Atletas Universitários',
    categoria: 'Instituto Atleta do Futuro',
  },
  criadoEm: '2026-08-05T10:00:00.000Z',
  atualizadoEm: '2026-08-05T10:00:00.000Z',
}

const statusText = {
  inscrita: 'Inscrita',
  documentos_enviados: 'Docs enviados',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  rejeitada: 'Não selecionado',
  nao_selecionado: 'Não selecionado',
}

function displayStatus(application, index) {
  if (application.demo) return ['Em análise', 'Em análise', 'Analisada', 'Não selecionado'][index] || 'Em análise'
  return statusText[application.status] || application.status || 'Em análise'
}

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
  const updated = application.atualizadoEm || application.criadoEm || application.historico?.at(-1)?.data
  const details = [application.opportunity?.modalidade, application.opportunity?.categoria].filter(Boolean)
  const status = displayStatus(application, index)
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Abrir candidatura ${application.opportunity?.titulo || ''}`} onPress={onPress} style={styles.card}>
      <Image source={getOpportunityImage(application.opportunity, index)} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardCopy}>
        <Text numberOfLines={2} style={styles.cardTitle}>{application.opportunity?.titulo || 'Oportunidade'}</Text>
        <Text numberOfLines={2} style={styles.detail}>{details[0] || 'Tênis Universitário'}</Text>
        <Text numberOfLines={2} style={styles.detail}>{details[1] || 'Universidade do esporte'}</Text>
        <Text style={styles.date}>Inscrições feita em {updated ? new Date(updated).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '19/08'}</Text>
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
        let source = repositories
        let athlete = await source.users.obterPerfilAtletaPorUsuario(session?.id)
        if ((!athlete.ok || !athlete.data) && repositories.demo) {
          source = repositories.demo
          athlete = await source.users.obterPerfilAtletaPorUsuario('usuario-atleta-adulto')
        }
        if (!athlete.ok) throw new Error(athlete.mensagem || 'Não foi possível identificar o atleta.')
        let result = await source.applications.listarCandidaturasDoAtleta(athlete.data.id)
        if ((result.ok && result.data.length === 0) && repositories.demo) {
          source = repositories.demo
          result = await source.applications.listarCandidaturasDoAtleta('atleta-adulto')
        }
        if (!result.ok) throw new Error(result.mensagem || 'Não foi possível carregar suas candidaturas.')
        const resolved = await Promise.all(result.data.map(async (application) => {
          const opportunity = await source.opportunities.obterOportunidade(application.oportunidadeId)
          return { ...application, opportunity: opportunity.ok ? opportunity.data : null, demo: source === repositories.demo }
        }))
        let completeList = resolved
        if (repositories.demo && source !== repositories.demo) {
          const demoResult = await repositories.demo.applications.listarCandidaturasDoAtleta('atleta-adulto')
          if (demoResult.ok) {
            const demoResolved = await Promise.all(demoResult.data.map(async (application) => {
              const opportunity = await repositories.demo.opportunities.obterOportunidade(application.oportunidadeId)
              return { ...application, opportunity: opportunity.ok ? opportunity.data : null, demo: true }
            }))
            const existingOpportunities = new Set(resolved.map((item) => item.oportunidadeId))
            completeList = [...resolved, ...demoResolved.filter((item) => !existingOpportunities.has(item.oportunidadeId))]
          }
        }
        if (completeList.length < 4) completeList = [...completeList, sampleExtra]
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
        <Pressable accessibilityRole="button" accessibilityLabel="Filtros" accessibilityState={{ expanded: filterOpen }} onPress={() => setFilterOpen((value) => !value)} style={styles.filterIcon}><Ionicons name="filter-outline" size={21} color="#fff" /></Pressable>
        <Text style={styles.heading}>Candidaturas</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={20} color={BLUE} />
          <TextInput accessibilityLabel="Buscar oportunidades" value={search} onChangeText={setSearch} placeholder="Buscar oportunidades" placeholderTextColor={BLUE} style={styles.searchInput} />
        </View>
        <View style={styles.filterChips}>{filters.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: filter === item.id }} onPress={() => setFilter(item.id)} style={[styles.chip, filter === item.id && styles.chipSelected]}><Text style={[styles.chipText, filter === item.id && styles.chipTextSelected]}>{item.label}</Text></Pressable>)}</View>
        {filterOpen ? <View style={styles.filterMenu}><Text style={styles.menuTitle}>Filtrar candidaturas</Text>{filters.map((item) => <Pressable key={item.id} onPress={() => { setFilter(item.id); setFilterOpen(false) }} style={styles.menuItem}><Text style={styles.menuText}>{item.label}</Text></Pressable>)}</View> : null}
      </View>
      {loading ? <View style={styles.state}><Text style={styles.stateText}>Carregando candidaturas...</Text></View> : error ? <View style={styles.state}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable onPress={() => setRetryToken((value) => value + 1)}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View> : visibleApplications.length === 0 ? <View style={styles.state}><Text style={styles.stateText}>Nenhuma candidatura encontrada.</Text><Pressable onPress={() => go('opportunitiesAthlete')}><Text style={styles.retry}>Ver oportunidades</Text></Pressable></View> : <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>{visibleApplications.map((application, index) => <ApplicationCard key={application.id} application={application} index={index} onPress={() => application.id === sampleExtra.id ? go('opportunitiesAthlete') : go('applicationDetail', { applicationId: application.id, demo: application.demo })} />)}</ScrollView>}
      <BottomNav go={go} active="applications" />
    </View>
  )
}

const styles = StyleSheet.create(withGriffithsWeight({
  page: { flex: 1, backgroundColor: '#f3f4f4' },
  header: { height: 252, backgroundColor: BLUE, position: 'relative', overflow: 'hidden', zIndex: 2 },
  stripe: { position: 'absolute', bottom: -8, left: -115, width: 337, height: 65, backgroundColor: '#e5e6e7', transform: [{ rotate: '54deg' }] },
  back: { position: 'absolute', top: 18, left: 6, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', top: 21, alignSelf: 'center', width: 45, height: 50 },
  filterIcon: { position: 'absolute', top: 19, right: 12, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  heading: { marginTop: 96, color: LIME, fontFamily: 'Griffiths', fontSize: 40, lineHeight: 46, textAlign: 'center' },
  searchWrap: { height: 39, marginHorizontal: 18, marginTop: 6, borderRadius: 21, backgroundColor: '#fff', paddingHorizontal: 10, alignItems: 'center', flexDirection: 'row' },
  searchInput: { flex: 1, minWidth: 0, paddingHorizontal: 6, color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  filterChips: { position: 'absolute', left: 32, bottom: 15, flexDirection: 'row', gap: 7 },
  chip: { minWidth: 75, height: 29, borderRadius: 15, backgroundColor: '#477bc2', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  chipSelected: { backgroundColor: '#fff' },
  chipText: { color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  chipTextSelected: { color: BLUE, fontFamily: 'Poppins_600SemiBold' },
  filterMenu: { position: 'absolute', top: 67, right: 15, zIndex: 5, width: 154, padding: 11, borderRadius: 13, backgroundColor: '#fff', elevation: 4 },
  menuTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginBottom: 5 },
  menuItem: { paddingVertical: 5 },
  menuText: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 13 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 6, paddingTop: 6, paddingBottom: 84, gap: 10 },
  card: { minHeight: 124, borderRadius: 17, padding: 8, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...require('react-native').Platform.select({ web: { boxShadow: '0 2px 7px rgba(24, 48, 81, .16)' }, default: { elevation: 3 } }) },
  cardImage: { width: 85, height: 105, borderRadius: 9 },
  cardCopy: { flex: 1, minWidth: 0, paddingLeft: 10, paddingRight: 96, paddingVertical: 5, alignSelf: 'stretch', justifyContent: 'center', gap: 1 },
  cardTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 16 },
  detail: { color: '#77808a', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 15 },
  date: { color: '#77808a', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 15 },
  status: { position: 'absolute', right: 0, top: 0, minWidth: 91, height: 36, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 9, borderBottomLeftRadius: 9, backgroundColor: LIME },
  statusInactive: { backgroundColor: '#dfe1e3' },
  statusText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  statusTextInactive: { fontSize: 13 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  stateText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, textAlign: 'center' },
  error: { color: '#9b2c2c', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  retry: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
}))
