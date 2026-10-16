import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import {
  FeedbackMessage,
  getOwnedOpportunity,
  getPartnerProfile,
  LoadingState,
  partnerColors,
  PartnerHeader,
  partnerStyles,
} from './partnerOpportunityUi'

const profileFields = [
  { key: 'modalidade', label: 'Modalidade', icon: 'tennisball-outline' },
  { key: 'categoria', label: 'Categoria', icon: 'ribbon-outline' },
  { key: 'posicao', label: 'Posição', icon: 'locate-outline' },
  { key: 'maoDominante', label: 'Mão dominante', icon: 'hand-left-outline' },
  { key: 'equipeAtual', label: 'Equipe atual', icon: 'people-outline' },
  { key: 'tempoDePratica', label: 'Tempo de prática', icon: 'time-outline' },
  { key: 'ranking', label: 'Ranking', icon: 'podium-outline' },
  { key: 'torneiosDisputados', label: 'Torneios disputados', icon: 'trophy-outline' },
  { key: 'titulos', label: 'Títulos', icon: 'medal-outline' },
]

export function PartnerCandidateProfileScreen({ go, back, repositories, session, routeParams = {} }) {
  const role = session?.tipo === 'treinador' ? 'trainer' : 'institution'
  const opportunityId = routeParams.opportunityId
  const athleteId = routeParams.athleteId
  const [profile, setProfile] = useState(null)
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
        if (!opportunityId || !athleteId) {
          throw new Error('Não foi possível identificar a oportunidade e o candidato.')
        }
        await getOwnedOpportunity(repositories, partner.id, opportunityId)
        const result = await repositories.applications.obterPerfilPublicoCandidato(opportunityId, athleteId)
        if (!result.ok) throw new Error(result.mensagem || 'O perfil público do candidato não está disponível.')
        if (active) setProfile(result.data)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Não foi possível carregar o perfil do candidato.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [repositories, session, opportunityId, athleteId, refreshKey])

  const visibleFields = profileFields.filter((field) => (
    profile?.[field.key] !== undefined && profile[field.key] !== null && profile[field.key] !== ''
  ))

  return (
    <View style={partnerStyles.page}>
      <PartnerHeader title="Perfil esportivo" subtitle="Dados compartilhados nesta candidatura" onBack={back} />
      {loading ? (
        <LoadingState label="Carregando perfil esportivo..." />
      ) : error ? (
        <View style={styles.stateContent}>
          <FeedbackMessage>{error}</FeedbackMessage>
          <Pressable accessibilityRole="button" onPress={() => setRefreshKey((value) => value + 1)} style={partnerStyles.primaryButton}>
            <Ionicons name="refresh" size={16} color={partnerColors.white} />
            <Text style={partnerStyles.primaryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : profile ? (
        <ScrollView style={partnerStyles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[partnerStyles.card, styles.identityCard]}>
            {profile.fotoUrl ? (
              <Image source={{ uri: profile.fotoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person-outline" size={30} color={partnerColors.green} />
              </View>
            )}
            <View style={styles.identityCopy}>
              <Text style={styles.name}>{profile.nome}</Text>
              {profile.perfilCompleto ? (
                <View style={styles.completeBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={partnerColors.greenDark} />
                  <Text style={styles.completeText}>Perfil completo</Text>
                </View>
              ) : (
                <Text style={styles.incompleteText}>Perfil em preenchimento</Text>
              )}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={partnerStyles.sectionTitle}>Informações esportivas</Text>
            <Text style={styles.fieldCount}>{visibleFields.length}</Text>
          </View>

          {visibleFields.length ? (
            <View style={styles.fieldsGrid}>
              {visibleFields.map((field) => (
                <View key={field.key} style={styles.fieldItem}>
                  <Ionicons name={field.icon} size={17} color={partnerColors.green} />
                  <View style={styles.fieldCopy}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldValue}>{String(profile[field.key])}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={partnerStyles.card}>
              <Text style={partnerStyles.subtitle}>Nenhuma informação esportiva foi compartilhada.</Text>
            </View>
          )}

          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={17} color={partnerColors.greenDark} />
            <Text style={styles.privacyText}>Este retrato contém apenas informações esportivas compartilhadas na candidatura.</Text>
          </View>
        </ScrollView>
      ) : null}
      <BottomNav go={go} role={role} active="opportunities" />
    </View>
  )
}

const styles = StyleSheet.create({
  stateContent: { flex: 1, justifyContent: 'center', padding: 20, gap: 14 },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: partnerColors.greenLight },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1, minWidth: 0, gap: 6 },
  name: { color: partnerColors.ink, fontSize: 18, lineHeight: 24, fontFamily: 'Poppins_600SemiBold' },
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  completeText: { color: partnerColors.greenDark, fontSize: 10, fontFamily: 'Poppins_500Medium' },
  incompleteText: { color: partnerColors.muted, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldCount: { color: partnerColors.muted, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fieldItem: { width: '48%', minHeight: 76, flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: partnerColors.white, borderWidth: 1, borderColor: partnerColors.border, borderRadius: 8 },
  fieldCopy: { flex: 1, minWidth: 0, gap: 4 },
  fieldLabel: { color: partnerColors.muted, fontSize: 10, lineHeight: 14, fontFamily: 'Poppins_400Regular' },
  fieldValue: { color: partnerColors.ink, fontSize: 12, lineHeight: 17, fontFamily: 'Poppins_600SemiBold' },
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 8, backgroundColor: partnerColors.greenLight },
  privacyText: { flex: 1, color: partnerColors.greenDark, fontSize: 10, lineHeight: 16, fontFamily: 'Poppins_400Regular' },
})