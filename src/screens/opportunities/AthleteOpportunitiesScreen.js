import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BottomNav } from '../../components/navigation/BottomNav'
import { ListHeader } from '../../components/ListHeader'
import { assets } from '../../theme/assets'
import { BLUE } from '../../theme/colors'
import { styles } from '../../theme/styles'

const statusFilters = [
  ['Ativas', 'ativa'],
  ['Encerradas', 'encerrada'],
  ['Todas', 'todas'],
]

const normalize = value => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()

const formatDeadline = value => {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Prazo não informado'
  return `Inscrições até ${new Date(value).toLocaleDateString('pt-BR')}`
}

export function AthleteOpportunitiesScreen(props) {
  const { repositories, go, back } = props
  const [opportunities, setOpportunities] = useState([])
  const [search, setSearch] = useState('')
  const [modality, setModality] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState('ativa')
  const [openDeadlineOnly, setOpenDeadlineOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadOpportunities = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await repositories.opportunities.listarOportunidades()
        if (!active) return
        if (!result?.ok) {
          setError(result?.mensagem || 'Não foi possível carregar as oportunidades.')
          return
        }
        setOpportunities(result.data ?? [])
      } catch {
        if (active) setError('Não foi possível carregar as oportunidades. Tente novamente.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOpportunities()
    return () => { active = false }
  }, [repositories])

  const visibleOpportunities = opportunities.filter(opportunity => {
    if (status !== 'todas' && opportunity.status !== status) return false
    if (search && !normalize([
      opportunity.titulo,
      opportunity.descricao,
      opportunity.beneficio,
      opportunity.modalidade,
      opportunity.categoria,
      opportunity.localizacao,
    ].join(' ')).includes(normalize(search))) return false
    if (modality && !normalize(opportunity.modalidade).includes(normalize(modality))) return false
    if (category && !normalize(opportunity.categoria).includes(normalize(category))) return false
    if (location && !normalize(opportunity.localizacao).includes(normalize(location))) return false
    if (openDeadlineOnly && (!opportunity.fimInscricoes || new Date(opportunity.fimInscricoes) < new Date())) return false
    return true
  })

  return (
    <View style={styles.listScreen}>
      <ListHeader title="Oportunidades" back={back} />
      <ScrollView contentContainerStyle={[styles.listContent, localStyles.content]} keyboardShouldPersistTaps="handled">
        <TextInput
          accessibilityLabel="Buscar oportunidades"
          placeholder="Buscar por título, benefício ou descrição"
          placeholderTextColor="#687b86"
          value={search}
          onChangeText={setSearch}
          style={localStyles.searchInput}
          returnKeyType="search"
        />

        <View style={localStyles.filterFields}>
          <TextInput accessibilityLabel="Filtrar por modalidade" placeholder="Modalidade" placeholderTextColor="#687b86" value={modality} onChangeText={setModality} style={localStyles.filterInput} />
          <TextInput accessibilityLabel="Filtrar por categoria" placeholder="Categoria" placeholderTextColor="#687b86" value={category} onChangeText={setCategory} style={localStyles.filterInput} />
          <TextInput accessibilityLabel="Filtrar por localização" placeholder="Localização" placeholderTextColor="#687b86" value={location} onChangeText={setLocation} style={localStyles.filterInput} />
        </View>

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

        {loading && <Text style={localStyles.stateMessage}>Carregando oportunidades...</Text>}
        {!loading && error ? <Text accessibilityRole="alert" style={localStyles.errorMessage}>{error}</Text> : null}
        {!loading && !error && visibleOpportunities.length === 0 ? (
          <Text style={localStyles.stateMessage}>Nenhuma oportunidade encontrada com esses filtros.</Text>
        ) : null}

        {!loading && !error && visibleOpportunities.map(opportunity => (
          <Pressable key={opportunity.id} onPress={() => go('matchScore')} style={styles.listCard}>
            <Image source={assets.arenaSuzy} style={styles.listThumb} />
            <View style={styles.listCopy}>
              <Text style={styles.listName}>{opportunity.titulo}</Text>
              <Text style={styles.listMeta}>{opportunity.modalidade} · {opportunity.categoria}</Text>
              <Text style={styles.listMeta}>{opportunity.localizacao}</Text>
              <Text style={styles.listMeta}>{formatDeadline(opportunity.fimInscricoes)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 24 },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#b8cbd5',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: '#17313c',
    paddingHorizontal: 14,
    fontFamily: 'Poppins_400Regular',
  },
  filterFields: { gap: 8 },
  filterInput: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#d2dee4',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: '#17313c',
    paddingHorizontal: 12,
    fontFamily: 'Poppins_400Regular',
  },
  statusFilters: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  statusChip: { borderWidth: 1, borderColor: '#b8cbd5', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  statusChipActive: { borderColor: BLUE, backgroundColor: '#e8f2f8' },
  statusChipText: { color: '#425761', fontFamily: 'Poppins_500Medium', fontSize: 12 },
  statusChipTextActive: { color: BLUE },
  deadlineFilter: { borderWidth: 1, borderColor: '#b8cbd5', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  deadlineFilterActive: { borderColor: BLUE, backgroundColor: '#e8f2f8' },
  deadlineFilterText: { color: '#425761', fontFamily: 'Poppins_500Medium', fontSize: 12 },
  stateMessage: { color: '#425761', fontFamily: 'Poppins_400Regular', paddingVertical: 18, textAlign: 'center' },
  errorMessage: { color: '#9b2c2c', fontFamily: 'Poppins_500Medium', paddingVertical: 18, textAlign: 'center' },
})
