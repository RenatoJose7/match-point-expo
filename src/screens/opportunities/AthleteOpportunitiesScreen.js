import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { ListHeader } from '../../components/ListHeader'
import { BLUE } from '../../theme/colors'
import { getOpportunityImage } from '../../theme/opportunityImages'
import { styles } from '../../theme/styles'
import { withGriffithsWeight } from '../../theme/typography'

const statusFilters = [
  ['Ativas', 'ativa'],
  ['Encerradas', 'encerrada'],
  ['Todas', 'todas'],
]

const opportunityClasses = [
  ['Todos', 'todos'],
  ['Técnicas', 'tecnicas'],
  ['Bolsas', 'bolsas'],
  ['Campeonatos', 'campeonatos'],
]

const normalize = value => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()

const formatDeadline = value => {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Prazo não informado'
  return `Inscrições até ${new Date(value).toLocaleDateString('pt-BR')}`
}

const hasClass = (opportunity, selectedClass) => {
  if (selectedClass === 'todos') return true

  const opportunityText = normalize([
    opportunity.titulo,
    opportunity.descricao,
    opportunity.beneficio,
  ].join(' '))

  const keywords = {
    tecnicas: ['avaliacao', 'tecnica', 'clinica', 'peneira', 'selecao'],
    bolsas: ['bolsa', 'auxilio'],
    campeonatos: ['campeonato', 'torneio', 'circuito', 'competicao'],
  }

  return keywords[selectedClass]?.some(keyword => opportunityText.includes(keyword))
}

export function AthleteOpportunitiesScreen(props) {
  const { repositories, go, back, session } = props
  const [opportunities, setOpportunities] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ativa')
  const [openDeadlineOnly, setOpenDeadlineOnly] = useState(false)
  const [selectedClass, setSelectedClass] = useState('todos')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadOpportunities = async () => {
      setLoading(true)
      setError('')

      try {
        const [result, athleteResult] = await Promise.all([
          repositories.opportunities.listarOportunidades(),
          repositories.users.obterPerfilAtletaPorUsuario(session?.id),
        ])
        if (!active) return
        if (!result?.ok) {
          setError(result?.mensagem || 'Não foi possível carregar as oportunidades.')
          return
        }

        const useDemoFallback = (result.data ?? []).length === 0 && repositories.demo
        const sourceRepositories = useDemoFallback ? repositories.demo : repositories
        const sourceAthlete = useDemoFallback
          ? await sourceRepositories.users.obterPerfilAtletaPorUsuario('usuario-atleta-adulto')
          : athleteResult
        const sourceOpportunities = useDemoFallback
          ? await sourceRepositories.opportunities.listarOportunidades()
          : result
        const listedOpportunities = sourceOpportunities.data ?? []
        const scoredOpportunities = sourceAthlete?.ok
          ? await Promise.all(listedOpportunities.map(async opportunity => {
            try {
              const scoreResult = await sourceRepositories.match.calcularMatchScore(sourceAthlete.data.id, opportunity.id)
              return {
                ...opportunity,
                matchScore: scoreResult?.ok ? scoreResult.data.percentualTotal : null,
                demo: Boolean(useDemoFallback),
              }
            } catch {
              return { ...opportunity, matchScore: null, demo: Boolean(useDemoFallback) }
            }
          }))
          : listedOpportunities.map(opportunity => ({ ...opportunity, matchScore: null, demo: Boolean(useDemoFallback) }))

        if (active) setOpportunities(scoredOpportunities)
      } catch {
        if (active) setError('Não foi possível carregar as oportunidades. Tente novamente.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOpportunities()
    return () => { active = false }
  }, [repositories, session?.id])

  const visibleOpportunities = opportunities.filter(opportunity => {
    if (status !== 'todas' && opportunity.status !== status) return false
    if (!hasClass(opportunity, selectedClass)) return false
    if (search && !normalize([
      opportunity.titulo,
      opportunity.descricao,
      opportunity.beneficio,
      opportunity.modalidade,
      opportunity.categoria,
      opportunity.localizacao,
    ].join(' ')).includes(normalize(search))) return false
    if (openDeadlineOnly && (!opportunity.fimInscricoes || new Date(opportunity.fimInscricoes) < new Date())) return false
    return true
  }).sort((first, second) => {
    const scoreDifference = (second.matchScore ?? -1) - (first.matchScore ?? -1)
    return scoreDifference || String(first.titulo).localeCompare(String(second.titulo), 'pt-BR')
  })

  const hasAdditionalFilters = status !== 'ativa' || openDeadlineOnly

  return (
    <View style={styles.listScreen}>
      <ListHeader
        title="Oportunidades"
        back={back}
        titleStyle={localStyles.headerTitle}
        searchValue={search}
        onSearchChange={setSearch}
        headerBackground={<View pointerEvents="none" style={localStyles.headerDiagonal} />}
        headerOverlay={
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={localStyles.headerClassChips} style={localStyles.headerClassScroll}>
            {opportunityClasses.map(([label, value]) => (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: selectedClass === value }} onPress={() => setSelectedClass(value)} style={[localStyles.classChip, selectedClass === value && localStyles.classChipActive]}>
                <Text style={[localStyles.classChipText, selectedClass === value && localStyles.classChipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        }
        headerAction={<Pressable accessibilityRole="button" accessibilityLabel="Abrir filtros" accessibilityState={{ expanded: filtersOpen }} onPress={() => setFiltersOpen(value => !value)} style={localStyles.headerFilterButton}>
          <Feather name="filter" size={17} color="#ffffff" />
          {hasAdditionalFilters ? <View style={localStyles.filterIndicator} /> : null}
        </Pressable>}
      />
      <ScrollView style={localStyles.scroll} contentContainerStyle={[styles.listContent, localStyles.content]} keyboardShouldPersistTaps="handled">
        {filtersOpen ? (
          <View style={localStyles.filtersPanel}>
            <View style={localStyles.statusFilters}>
              {statusFilters.map(([label, value]) => (
                <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: status === value }} onPress={() => setStatus(value)} style={[localStyles.statusChip, status === value && localStyles.statusChipActive]}>
                  <Text style={[localStyles.statusChipText, status === value && localStyles.statusChipTextActive]}>{label}</Text>
                </Pressable>
              ))}
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: openDeadlineOnly }} onPress={() => setOpenDeadlineOnly(value => !value)} style={[localStyles.deadlineFilter, openDeadlineOnly && localStyles.deadlineFilterActive]}>
                <Text style={localStyles.deadlineFilterText}>{openDeadlineOnly ? '✓ ' : ''}Prazo aberto</Text>
              </Pressable>
            </View>
            {hasAdditionalFilters ? (
              <Pressable accessibilityRole="button" onPress={() => { setStatus('ativa'); setOpenDeadlineOnly(false) }}>
                <Text style={localStyles.clearFilters}>Limpar filtros</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {loading && <Text style={localStyles.stateMessage}>Calculando compatibilidades...</Text>}
        {!loading && error ? <Text accessibilityRole="alert" style={localStyles.errorMessage}>{error}</Text> : null}
        {!loading && !error && visibleOpportunities.length === 0 ? (
          <View style={localStyles.emptyState}>
            <Text style={localStyles.emptyTitle}>{opportunities.length === 0 ? 'Ainda não há oportunidades ativas' : 'Nenhuma oportunidade encontrada'}</Text>
            <Text style={localStyles.stateMessage}>{opportunities.length === 0 ? 'Volte mais tarde para descobrir novas oportunidades.' : 'Ajuste ou limpe os filtros para ampliar a busca.'}</Text>
            {opportunities.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => { setSearch(''); setSelectedClass('todos'); setStatus('ativa'); setOpenDeadlineOnly(false) }}>
                <Text style={localStyles.clearFilters}>Limpar filtros</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!loading && !error && visibleOpportunities.map((opportunity, index) => (
          <Pressable key={opportunity.id} accessibilityRole="button" accessibilityLabel={`${opportunity.titulo}. Compatibilidade ${opportunity.matchScore ?? 'indisponível'} por cento.`} onPress={() => go('matchScore', { opportunityId: opportunity.id })} style={localStyles.opportunityCard}>
            <Image source={getOpportunityImage(opportunity, index)} style={localStyles.opportunityThumb} resizeMode="cover" />
            <View style={localStyles.opportunityCopy}>
              <Text numberOfLines={2} style={localStyles.opportunityName}>{opportunity.titulo}</Text>
              <View style={localStyles.metaRow}><Feather name="briefcase" size={9} color={BLUE} /><Text numberOfLines={2} style={localStyles.opportunityMeta}>{opportunity.instituicao || opportunity.modalidade}</Text></View>
              <View style={localStyles.metaRow}><Feather name="user" size={9} color={BLUE} /><Text numberOfLines={2} style={localStyles.opportunityMeta}>{opportunity.categoria}</Text></View>
              <View style={localStyles.metaRow}><Feather name="map-pin" size={9} color={BLUE} /><Text numberOfLines={2} style={localStyles.opportunityMeta}>{opportunity.localizacao}</Text></View>
              <View style={localStyles.metaRow}><Feather name="calendar" size={9} color={BLUE} /><Text numberOfLines={2} style={localStyles.opportunityMeta}>{formatDeadline(opportunity.fimInscricoes)}</Text></View>
            </View>
            <View style={localStyles.matchBadge}>
              <Text style={localStyles.matchBadgeLabel}>Match{`\n`}Score</Text>
              <Text style={localStyles.matchBadgeValue}>{opportunity.matchScore ?? '—'}{opportunity.matchScore === null ? '' : '%'}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}

const localStyles = StyleSheet.create(withGriffithsWeight({
  scroll: { flex: 1 },
  content: { gap: 10, paddingBottom: 110, paddingTop: 5 },
  headerTitle: { fontFamily: 'Griffiths', fontSize: 40, lineHeight: 46, color: '#c4ff32', textAlign: 'center' },
  headerDiagonal: { backgroundColor: '#e4e6e7', bottom: -17, height: 66, left: -105, position: 'absolute', transform: [{ rotate: '54deg' }], width: 335, zIndex: 0 },
  headerClassScroll: { bottom: 25, left: 14, position: 'absolute', right: 14, zIndex: 6 },
  headerClassChips: { flexGrow: 1, gap: 5, justifyContent: 'space-between' },
  classChip: { backgroundColor: '#3779cb', borderRadius: 20, minWidth: 58, paddingHorizontal: 10, paddingVertical: 7 },
  classChipActive: { backgroundColor: '#ffffff' },
  classChipText: { color: '#ffffff', fontFamily: 'Poppins_500Medium', fontSize: 13, textAlign: 'center' },
  classChipTextActive: { color: BLUE, fontFamily: 'Poppins_600SemiBold' },
  headerFilterButton: { alignItems: 'center', height: 36, justifyContent: 'center', position: 'absolute', right: 17, top: 34, width: 36, zIndex: 6 },
  filterIndicator: { backgroundColor: '#c4ff32', borderColor: BLUE, borderRadius: 5, borderWidth: 1, height: 8, position: 'absolute', right: 4, top: 5, width: 8 },
  filtersPanel: { backgroundColor: '#ffffff', borderRadius: 16, gap: 10, padding: 12 },
  statusFilters: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  statusChip: { borderWidth: 1, borderColor: '#b8cbd5', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  statusChipActive: { borderColor: BLUE, backgroundColor: '#e8f2f8' },
  statusChipText: { color: '#425761', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  statusChipTextActive: { color: BLUE },
  deadlineFilter: { borderWidth: 1, borderColor: '#b8cbd5', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  deadlineFilterActive: { borderColor: BLUE, backgroundColor: '#e8f2f8' },
  deadlineFilterText: { color: '#425761', fontFamily: 'Poppins_500Medium', fontSize: 13 },
  stateMessage: { color: '#425761', fontFamily: 'Poppins_400Regular', paddingVertical: 18, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 18 },
  emptyTitle: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 13, textAlign: 'center' },
  clearFilters: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  errorMessage: { color: '#9b2c2c', fontFamily: 'Poppins_500Medium', paddingVertical: 18, textAlign: 'center' },
  opportunityCard: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, flexDirection: 'row', minHeight: 128, overflow: 'hidden', paddingVertical: 9 },
  opportunityThumb: { borderRadius: 9, height: 110, marginLeft: 10, width: 84 },
  opportunityCopy: { flex: 1, minWidth: 0, paddingLeft: 12, paddingVertical: 3 },
  opportunityName: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 16, paddingRight: 5 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 4, minHeight: 17 },
  opportunityMeta: { color: '#747d86', flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 16, paddingRight: 3 },
  matchBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#c4ff32', borderBottomLeftRadius: 10, height: 84, justifyContent: 'flex-start', marginLeft: 4, paddingTop: 6, width: 78 },
  matchBadgeLabel: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 16, textAlign: 'center' },
  matchBadgeValue: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 28, textAlign: 'center' },
}))
