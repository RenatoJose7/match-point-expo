import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../../components/accessibility/AppText'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { assets } from '../../theme/assets'
import { withGriffithsWeight } from '../../theme/typography'
import { computeMatchScore } from '../../domain/matchScore.js'
import { FeedbackMessage, getOwnedOpportunity, getPartnerProfile, LoadingState } from './partnerOpportunityUi'

const BLUE = '#10579b'
const LIME = '#c4ff32'
const demoCandidates = [
  { id: 'demo-mirra', name: 'Mirra Andrade', category: 'Sub-20', date: 'Inscrição em 28/03/2026', photo: assets.mirra, score: 94 },
  { id: 'demo-ariana', name: 'Ariana Sabalenka', category: 'Sub-25', date: 'Inscrição em 30/03/2026', photo: assets.ariana, score: 88 },
  { id: 'demo-helena', name: 'Helena Rybakina', category: 'Sub-25', date: 'Inscrição em 31/03/2026', photo: assets.helena, score: 80 },
  { id: 'demo-coco', name: 'Coco Gauffina', category: 'Sub-20', date: 'Inscrição em 01/04/2026', photo: assets.coco, score: 76 },
]

function getCandidatePhotoSource(value) {
  const uri = String(value ?? '').trim()
  return /^(https?:|data:image\/|blob:|file:)/i.test(uri) ? { uri } : null
}

function getCandidateInitials(name) {
  return String(name ?? 'Candidato')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'CA'
}

function CandidateCard({ candidate, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Ver perfil de ${candidate.name}`} onPress={onPress} style={styles.card}>
      {candidate.photo ? (
        <Image source={candidate.photo} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoFallback]}>
          <Text style={styles.photoInitials}>{candidate.initials}</Text>
        </View>
      )}
      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.name}>{candidate.name}</Text>
        <Text style={styles.category}>{candidate.category}</Text>
        <View style={styles.dateRow}><Ionicons name="calendar" size={12} color={BLUE} /><Text style={styles.date}>{candidate.date}</Text></View>
      </View>
      {candidate.score ? <View style={styles.score}><Text fixedSize style={styles.scoreCaption}>Match{`\n`}Score</Text><Text fixedSize style={styles.scoreValue}>{candidate.score}%</Text></View> : null}
    </Pressable>
  )
}

// Títulos longos diminuem para caber em até duas linhas sem partir palavras no meio.
function titleSize(text = '') {
  const longestWord = Math.max(...String(text).split(/\s+/).map((word) => word.length), 0)
  const size = text.length <= 18 && longestWord <= 12 ? 46 : text.length <= 30 && longestWord <= 16 ? 38 : longestWord > 18 ? 26 : 32
  return { fontSize: size, lineHeight: Math.round(size * 1.15) }
}

export function PartnerOpportunityCandidatesScreen({ go, back, repositories, session, routeParams = {} }) {
  const role = session?.tipo === 'treinador' ? 'trainer' : 'institution'
  // Candidatos de exemplo só nas oportunidades de exemplo; oportunidade real mostra só os reais.
  const isDemo = Boolean(routeParams.demo)
  const [title, setTitle] = useState(routeParams.title || 'Candidatos')
  const [candidates, setCandidates] = useState(isDemo ? demoCandidates : [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        if (isDemo) {
          if (mounted) setCandidates(demoCandidates)
          return
        }
        const partner = await getPartnerProfile(repositories, session)
        if (!routeParams.opportunityId) throw new Error('Oportunidade não informada.')
        const opportunity = await getOwnedOpportunity(repositories, partner.id, routeParams.opportunityId)
        const result = await repositories.applications.listarCandidatosDaOportunidade(routeParams.opportunityId)
        if (!result.ok) throw new Error(result.mensagem || 'Não foi possível carregar os candidatos.')
        const profiles = await Promise.all(result.data.map(async (application) => {
          const profile = await repositories.applications.obterPerfilPublicoCandidato(routeParams.opportunityId, application.atletaId)
          return { application, profile: profile.ok ? profile.data : null }
        }))
        const mapped = profiles.map(({ application, profile }, index) => ({
          id: application.id,
          athleteId: application.atletaId,
          name: profile?.nome || `Candidato ${index + 1}`,
          category: profile?.categoria || 'Sub-20',
          date: application.criadoEm ? `Inscrição em ${new Date(application.criadoEm).toLocaleDateString('pt-BR')}` : 'Inscrição recente',
          photo: getCandidatePhotoSource(profile?.fotoUrl),
          initials: getCandidateInitials(profile?.nome),
          // Sem score gravado na candidatura, calcula com o perfil público do atleta.
          score: application.matchScore ?? (profile ? computeMatchScore(profile, opportunity).percentualTotal : null),
        }))
        if (mounted) {
          setTitle(opportunity.titulo || 'Candidatos')
          setCandidates(mapped)
        }
      } catch (loadError) {
        if (mounted) setError(loadError.message || 'Não foi possível carregar os candidatos.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [repositories, routeParams.opportunityId, session, refreshKey, isDemo])

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.stripe} />
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} onPress={back} style={styles.back}><Ionicons name="arrow-back" size={22} color="#fff" /></Pressable>
        <Image source={assets.monogram} style={styles.mark} resizeMode="contain" />
        <Pressable accessibilityRole="button" accessibilityLabel="Opções de filtro" accessibilityState={{ expanded: filterOpen }} onPress={() => setFilterOpen((value) => !value)} style={styles.filter}><Ionicons name="funnel-outline" size={22} color="#fff" /></Pressable>
        <Text numberOfLines={2} style={[styles.title, titleSize(title)]}>{title}</Text>
        <Text fixedSize style={styles.pill}>Candidatos</Text>
        {filterOpen ? <View style={styles.filterMenu}><Text style={styles.filterText}>Candidatos mais recentes</Text><Pressable accessibilityRole="button" onPress={() => setRefreshKey((value) => value + 1)}><Text style={styles.filterAction}>Atualizar lista</Text></Pressable></View> : null}
      </View>

      {loading ? <LoadingState label="Carregando candidatos..." /> : error ? <View style={styles.state}><FeedbackMessage>{error}</FeedbackMessage></View> : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {candidates.length === 0 ? <Text style={styles.emptyText}>Nenhum candidato ainda. Quando um atleta se candidatar, ele aparece aqui.</Text> : null}
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onPress={() => role === 'trainer'
                ? go('operations', {
                  opportunityId: routeParams.opportunityId,
                  athleteId: candidate.athleteId || 'atleta-adulto',
                  candidateName: candidate.name,
                })
                : candidate.athleteId
                  ? go('partnerCandidateProfile', { opportunityId: routeParams.opportunityId, athleteId: candidate.athleteId })
                  : undefined}
            />
          ))}
        </ScrollView>
      )}
      <BottomNav go={go} role={role} active="opportunities" />
    </View>
  )
}

const styles = StyleSheet.create(withGriffithsWeight({
  emptyText: { color: '#59626b', fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 24, paddingTop: 32 },
  page: { flex: 1, backgroundColor: '#f3f4f4' },
  header: { minHeight: 243, backgroundColor: BLUE, overflow: 'hidden', position: 'relative', zIndex: 2, paddingBottom: 18 },
  stripe: { position: 'absolute', bottom: -8, left: -115, width: 337, height: 65, backgroundColor: '#e5e6e7', transform: [{ rotate: '54deg' }] },
  back: { position: 'absolute', top: 32, left: 13, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', top: 32, alignSelf: 'center', width: 57, height: 61 },
  filter: { position: 'absolute', top: 35, right: 17, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  title: { color: LIME, fontFamily: 'Griffiths', fontSize: 46, lineHeight: 52, marginTop: 102, textAlign: 'center', paddingHorizontal: 18 },
  pill: { alignSelf: 'center', marginTop: 20, width: 157, height: 33, borderRadius: 18, overflow: 'hidden', backgroundColor: LIME, color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 14, lineHeight: 33, textAlign: 'center' },
  filterMenu: { position: 'absolute', zIndex: 8, top: 70, right: 16, padding: 11, gap: 8, borderRadius: 12, backgroundColor: '#fff', elevation: 4 },
  filterText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13 },
  filterAction: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 8, paddingTop: 20, paddingBottom: 100, gap: 10 },
  card: { minHeight: 133, borderRadius: 17, padding: 9, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', ...require('react-native').Platform.select({ web: { boxShadow: '0 2px 7px rgba(26, 56, 92, .14)' }, default: { elevation: 3 } }) },
  photo: { width: 94, height: 113, borderRadius: 10 },
  photoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f0f8', borderWidth: 1, borderColor: '#d7e4f2' },
  photoInitials: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 18 },
  copy: { flex: 1, minWidth: 0, paddingLeft: 13, justifyContent: 'center' },
  name: { color: '#1878d3', fontFamily: 'Poppins_600SemiBold', fontSize: 16, lineHeight: 19 },
  category: { color: '#1878d3', fontFamily: 'Poppins_400Regular', fontStyle: 'italic', fontSize: 13, lineHeight: 17 },
  dateRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 3 },
  date: { color: '#6d7784', fontFamily: 'Poppins_400Regular', fontSize: 12 },
  score: { alignSelf: 'flex-start', width: 78, height: 88, marginTop: -9, marginRight: -9, paddingTop: 8, alignItems: 'center', backgroundColor: LIME, borderTopRightRadius: 17, borderBottomLeftRadius: 12 },
  scoreCaption: { color: BLUE, fontFamily: 'Poppins_400Regular', fontSize: 18, lineHeight: 16, textAlign: 'center' },
  scoreValue: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 30, lineHeight: 34 },
  state: { flex: 1, justifyContent: 'center', padding: 20 },
}))
