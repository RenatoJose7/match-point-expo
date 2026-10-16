import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import {
  FeedbackMessage,
  formatOpportunityDate,
  getOwnedOpportunity,
  getPartnerProfile,
  LoadingState,
  opportunityStatus,
  partnerColors,
  PartnerHeader,
  partnerStyles,
} from './partnerOpportunityUi'

export function PartnerOpportunityDetailScreen({ go, back, repositories, session, routeParams = {} }) {
  const role = session?.tipo === 'treinador' ? 'trainer' : 'institution'
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(routeParams.flashMessage ?? '')
  const [confirmClose, setConfirmClose] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.resolve()
      .then(async () => {
        const partner = await getPartnerProfile(repositories, session)
        const id = routeParams.opportunityId
        if (!id) throw new Error('O identificador da oportunidade não foi informado.')
        const result = await getOwnedOpportunity(repositories, partner.id, id)
        if (active) setOpportunity(result)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Não foi possível carregar a oportunidade.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [repositories, routeParams.opportunityId, session, refreshKey])

  const closeOpportunity = async () => {
    if (!opportunity || saving) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const result = await repositories.opportunities.encerrarOportunidade(opportunity.id)
      if (!result.ok) throw new Error(result.mensagem || 'Não foi possível encerrar a oportunidade.')
      setOpportunity(result.data)
      setMessage('Oportunidade encerrada.')
      setConfirmClose(false)
    } catch (closeError) {
      setError(closeError.message || 'Não foi possível encerrar a oportunidade.')
    } finally {
      setSaving(false)
    }
  }

  const status = opportunityStatus(opportunity?.status)

  return (
    <View style={partnerStyles.page}>
      <PartnerHeader title="Detalhes" subtitle="Oportunidade do parceiro" onBack={back} />
      {loading ? (
        <LoadingState label="Carregando detalhes..." />
      ) : error && !opportunity ? (
        <View style={styles.stateContent}>
          <FeedbackMessage>{error}</FeedbackMessage>
          <Pressable accessibilityRole="button" onPress={() => setRefreshKey((value) => value + 1)} style={partnerStyles.primaryButton}>
            <Ionicons name="refresh" size={16} color={partnerColors.white} />
            <Text style={partnerStyles.primaryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : opportunity ? (
        <ScrollView style={partnerStyles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {message ? <FeedbackMessage tone="success">{message}</FeedbackMessage> : null}
          {error ? <FeedbackMessage>{error}</FeedbackMessage> : null}

          <View style={partnerStyles.card}>
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <View style={[partnerStyles.statusBadge, { backgroundColor: status.backgroundColor }]}>
                  <Text style={[partnerStyles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
                <Text style={styles.title}>{opportunity.titulo}</Text>
                <Text style={styles.meta}>{[opportunity.modalidade, opportunity.categoria].filter(Boolean).join(' · ')}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Editar oportunidade" onPress={() => go('partnerOpportunityForm', { opportunityId: opportunity.id })} style={styles.iconButton}>
                <Ionicons name="create-outline" size={19} color={partnerColors.ink} />
              </Pressable>
            </View>
            <View style={styles.rule} />
            <Text style={partnerStyles.sectionTitle}>Descrição</Text>
            <Text style={partnerStyles.body}>{opportunity.descricao || 'Nenhuma descrição informada.'}</Text>
            <View style={styles.infoGrid}>
              <Info label="Localização" value={opportunity.localizacao || 'Não informada'} icon="location-outline" />
              <Info label="Benefício" value={opportunity.beneficio || 'Não informado'} icon="gift-outline" />
              <Info label="Inscrições a partir de" value={formatOpportunityDate(opportunity.inicioInscricoes)} icon="calendar-outline" />
              <Info label="Prazo final" value={formatOpportunityDate(opportunity.fimInscricoes)} icon="time-outline" />
            </View>
          </View>

          <ListSection title="Requisitos" values={opportunity.requisitos} empty="Nenhum requisito informado." />
          <ListSection title="Documentos necessários" values={opportunity.documentosNecessarios} empty="Nenhum documento exigido." />

          {confirmClose ? (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Encerrar esta oportunidade?</Text>
              <Text style={styles.confirmCopy}>Ela deixará de aceitar novas candidaturas. Essa ação não poderá ser desfeita por esta tela.</Text>
              <View style={styles.confirmActions}>
                <Pressable accessibilityRole="button" onPress={() => setConfirmClose(false)} disabled={saving} style={partnerStyles.secondaryButton}>
                  <Text style={partnerStyles.secondaryButtonText}>Manter ativa</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={closeOpportunity} disabled={saving} style={[partnerStyles.primaryButton, styles.closeButton, saving && partnerStyles.primaryButtonDisabled]}>
                  {saving ? <Ionicons name="sync" size={16} color={partnerColors.white} /> : <Ionicons name="lock-closed-outline" size={16} color={partnerColors.white} />}
                  <Text style={partnerStyles.primaryButtonText}>{saving ? 'Encerrando...' : 'Confirmar encerramento'}</Text>
                </Pressable>
              </View>
            </View>
          ) : opportunity.status !== 'encerrada' ? (
            <Pressable accessibilityRole="button" onPress={() => setConfirmClose(true)} style={styles.closeTrigger}>
              <Ionicons name="close-circle-outline" size={18} color={partnerColors.red} />
              <Text style={styles.closeTriggerText}>Encerrar oportunidade</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      ) : null}
      <BottomNav go={go} role={role} active="opportunities" />
    </View>
  )
}

function Info({ label, value, icon }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={15} color={partnerColors.green} />
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  )
}

function ListSection({ title, values = [], empty }) {
  return (
    <View style={[partnerStyles.card, styles.listCard]}>
      <Text style={partnerStyles.sectionTitle}>{title}</Text>
      {values.length ? values.map((value, index) => (
        <View key={`${value}-${index}`} style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={16} color={partnerColors.green} />
          <Text style={[partnerStyles.body, styles.listText]}>{value}</Text>
        </View>
      )) : <Text style={partnerStyles.subtitle}>{empty}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  stateContent: { flex: 1, justifyContent: 'center', padding: 20, gap: 14 },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  titleRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  titleCopy: { flex: 1, gap: 6 },
  title: { color: partnerColors.ink, fontSize: 20, lineHeight: 27, fontFamily: 'Poppins_600SemiBold' },
  meta: { color: partnerColors.green, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  iconButton: { width: 40, height: 40, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: partnerColors.canvas },
  rule: { height: 1, backgroundColor: partnerColors.border, marginVertical: 14 },
  infoGrid: { marginTop: 17, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoItem: { width: '47%', minHeight: 48, flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  infoCopy: { flex: 1, gap: 2 },
  infoLabel: { color: partnerColors.muted, fontSize: 10, fontFamily: 'Poppins_400Regular' },
  infoValue: { color: partnerColors.ink, fontSize: 11, lineHeight: 16, fontFamily: 'Poppins_500Medium' },
  listCard: { gap: 10 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  listText: { flex: 1 },
  confirmBox: { padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#f1cfca', backgroundColor: partnerColors.redLight, gap: 10 },
  confirmTitle: { color: partnerColors.red, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  confirmCopy: { color: partnerColors.ink, fontSize: 11, lineHeight: 17, fontFamily: 'Poppins_400Regular' },
  confirmActions: { gap: 8 },
  closeButton: { backgroundColor: partnerColors.red },
  closeTrigger: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  closeTriggerText: { color: partnerColors.red, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
})