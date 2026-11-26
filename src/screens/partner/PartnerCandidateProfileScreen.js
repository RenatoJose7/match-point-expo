import React, { useEffect, useState } from 'react'
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../../components/accessibility/AppText'
import { Ionicons } from '@expo/vector-icons'
import { BottomNav } from '../../components/navigation/BottomNav'
import { documentLabel } from '../../components/ui/documentLabels'
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
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pendingDecision, setPendingDecision] = useState(null)
  const [evaluations, setEvaluations] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewer, setViewer] = useState(null)
  const [openingDocument, setOpeningDocument] = useState('')

  // Documento enviado pelo atleta: link abre fora do app; foto abre aqui mesmo.
  const openDocument = async (item) => {
    setError('')
    if (item.arquivoUrl) {
      Linking.openURL(item.arquivoUrl).catch(() => setError('Não foi possível abrir este link.'))
      return
    }
    const fileId = item.arquivoId ?? item.id
    if (!fileId || !repositories.applications.obterArquivoCandidatura) {
      setError('Este documento não tem arquivo para abrir.')
      return
    }
    setOpeningDocument(fileId)
    try {
      const result = await repositories.applications.obterArquivoCandidatura(fileId)
      if (!result.ok || !result.data?.conteudo) throw new Error(result.mensagem || 'Não foi possível abrir o documento.')
      setViewer({ title: documentLabel(item.tipo ?? item.nome), uri: result.data.conteudo })
    } catch (openError) {
      setError(openError.message || 'Não foi possível abrir o documento.')
    } finally {
      setOpeningDocument('')
    }
  }

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
        const [profileResult, applicationsResult] = await Promise.all([
          repositories.applications.obterPerfilPublicoCandidato(opportunityId, athleteId),
          repositories.applications.listarCandidatosDaOportunidade(opportunityId),
        ])
        if (!profileResult.ok) throw new Error(profileResult.mensagem || 'O perfil público do candidato não está disponível.')
        if (!applicationsResult.ok) throw new Error(applicationsResult.mensagem || 'Não foi possível carregar a candidatura.')
        const candidateApplication = applicationsResult.data.find((item) => item.atletaId === athleteId)
        if (!candidateApplication) throw new Error('A candidatura deste atleta não foi encontrada nesta oportunidade.')
        // Pareceres técnicos já enviados por treinadores sobre este candidato nesta oportunidade.
        const evaluationsResult = partner.tipo === 'instituicao' && repositories.evaluations?.listarAvaliacoesDaInstituicao
          ? await repositories.evaluations.listarAvaliacoesDaInstituicao(partner.id).catch(() => null)
          : null
        if (active) {
          setProfile(profileResult.data)
          setApplication(candidateApplication)
          setEvaluations(evaluationsResult?.ok ? evaluationsResult.data.filter((item) => item.atletaId === athleteId && (!item.oportunidadeId || item.oportunidadeId === opportunityId)) : [])
        }
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

  const updateStatus = async (nextStatus) => {
    if (!application || saving) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const result = await repositories.applications.atualizarStatusDaCandidatura(application.id, nextStatus)
      if (!result.ok) throw new Error(result.mensagem || 'Não foi possível atualizar a candidatura.')
      setApplication(result.data)
      setPendingDecision(null)
      setNotice(nextStatus === 'em_analise'
        ? 'Candidatura encaminhada para análise.'
        : nextStatus === 'aprovada'
          ? 'Candidatura aprovada. O atleta poderá acompanhar a decisão no histórico.'
          : 'Candidatura rejeitada. O atleta poderá acompanhar a decisão no histórico.')
    } catch (updateError) {
      setError(updateError.message || 'Não foi possível atualizar a candidatura.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={partnerStyles.page}>
      <PartnerHeader title="Perfil esportivo" subtitle="Dados compartilhados nesta candidatura" onBack={back} />
      {loading ? (
        <LoadingState label="Carregando perfil esportivo..." />
      ) : error && !profile ? (
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
                  <Ionicons name={field.icon} size={17} color={partnerColors.ink} />
                  <View style={styles.fieldCopy}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldValue}>{String(profile[field.key])}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={partnerStyles.card}>
              <Text style={partnerStyles.emptyText}>Nenhuma informação esportiva foi compartilhada.</Text>
            </View>
          )}

          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={17} color={partnerColors.greenDark} />
            <Text style={styles.privacyText}>Este retrato contém apenas informações esportivas compartilhadas na candidatura.</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={partnerStyles.sectionTitle}>Documentos enviados</Text>
            <Text style={styles.fieldCount}>{application?.documentos?.length ?? 0}</Text>
          </View>
          {application?.documentos?.length ? (
            <View style={styles.documentsList}>
              {application.documentos.map((item, index) => {
                const fileId = item.arquivoId ?? item.id
                return (
                  <Pressable key={fileId ?? index} accessibilityRole="button" accessibilityLabel={`Abrir ${documentLabel(item.tipo ?? item.nome)}`} onPress={() => openDocument(item)} style={styles.documentItem}>
                    <Ionicons name={item.arquivoUrl ? 'logo-youtube' : 'document-text-outline'} size={20} color={partnerColors.ink} />
                    <View style={styles.fieldCopy}>
                      <Text style={styles.fieldValue}>{documentLabel(item.tipo ?? item.nome)}</Text>
                      <Text style={styles.fieldLabel}>{openingDocument === fileId ? 'Abrindo...' : item.arquivoUrl ? 'Abrir link' : 'Ver foto do documento'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={partnerColors.muted} />
                  </Pressable>
                )
              })}
            </View>
          ) : (
            <View style={partnerStyles.card}>
              <Text style={partnerStyles.emptyText}>O atleta ainda não enviou documentos.</Text>
            </View>
          )}

          <View style={styles.decisionCard}>
              {role === 'institution' ? <>
                {evaluations.map((evaluation) => (
                  <View key={evaluation.id} style={styles.evaluationBox}>
                    <Text style={styles.fieldValue}>Parecer técnico recebido</Text>
                    <Text style={styles.fieldLabel}>Técnica {evaluation.notaTecnica}/5 · Físico {evaluation.notaFisica}/5 · Tática {evaluation.notaTatica}/5</Text>
                    {evaluation.parecer ? <Text style={partnerStyles.body}>{evaluation.parecer}</Text> : null}
                  </View>
                ))}
                <Text style={partnerStyles.sectionTitle}>Avaliação técnica externa</Text>
                <Text style={styles.decisionCopy}>Solicite um parecer estruturado a um treinador antes da decisão.</Text>
                <Pressable accessibilityRole="button" onPress={() => go('technicalEvaluations', { opportunityId, athleteId, applicationId: application?.id, athleteName: profile?.nome || '', opportunityTitle: routeParams.opportunityTitle || '' })} style={partnerStyles.secondaryButton}>
                  <Text style={partnerStyles.secondaryButtonText}>Solicitar avaliação</Text>
                </Pressable>
              </> : <Text style={partnerStyles.sectionTitle}>Apoio ao atleta</Text>}
              <Pressable accessibilityRole="button" onPress={() => go('operations', { opportunityId, athleteId, candidateName: profile?.nome || '' })} style={partnerStyles.secondaryButton}>
                <Text style={partnerStyles.secondaryButtonText}>Registrar apoio concedido</Text>
              </Pressable>
          </View>

          {notice ? <FeedbackMessage tone="success">{notice}</FeedbackMessage> : null}
          {error ? <FeedbackMessage>{error}</FeedbackMessage> : null}

          {application?.status === 'inscrita' || application?.status === 'documentos_enviados' ? (
            <View style={styles.decisionCard}>
              <Text style={partnerStyles.sectionTitle}>Próximo passo</Text>
              <Text style={styles.decisionCopy}>Confirme que este perfil será avaliado pela sua organização.</Text>
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => updateStatus('em_analise')}
                style={[partnerStyles.primaryButton, saving && partnerStyles.primaryButtonDisabled]}
              >
                <Text style={partnerStyles.primaryButtonText}>{saving ? 'Atualizando...' : 'Enviar para análise'}</Text>
              </Pressable>
            </View>
          ) : null}

          {application?.status === 'em_analise' ? (
            <View style={styles.decisionCard}>
              <Text style={partnerStyles.sectionTitle}>Decisão institucional</Text>
              <Text style={styles.decisionCopy}>A decisão encerra esta candidatura e é registrada no histórico do atleta.</Text>
              {pendingDecision ? (
                <View style={styles.confirmation}>
                  <Text style={styles.confirmationText}>Confirmar candidatura {pendingDecision === 'aprovada' ? 'aprovada' : 'rejeitada'}?</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={saving}
                    onPress={() => updateStatus(pendingDecision)}
                    style={[partnerStyles.primaryButton, pendingDecision === 'rejeitada' && styles.rejectButton, saving && partnerStyles.primaryButtonDisabled]}
                  >
                    <Text style={partnerStyles.primaryButtonText}>{saving ? 'Registrando...' : 'Confirmar decisão'}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" disabled={saving} onPress={() => setPendingDecision(null)} style={partnerStyles.secondaryButton}>
                    <Text style={partnerStyles.secondaryButtonText}>Cancelar</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.decisionActions}>
                  <Pressable accessibilityRole="button" disabled={saving} onPress={() => setPendingDecision('aprovada')} style={partnerStyles.primaryButton}>
                    <Text style={partnerStyles.primaryButtonText}>Aprovar candidatura</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" disabled={saving} onPress={() => setPendingDecision('rejeitada')} style={[partnerStyles.secondaryButton, styles.rejectOutline]}>
                    <Text style={styles.rejectText}>Rejeitar candidatura</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}

          {application?.status === 'aprovada' || application?.status === 'rejeitada' ? (
            <View style={[styles.finalStatus, application.status === 'aprovada' ? styles.approved : styles.rejected]}>
              <Text style={[styles.finalStatusText, application.status === 'aprovada' ? styles.approvedText : styles.rejectedText]}>
                Candidatura {application.status === 'aprovada' ? 'aprovada' : 'rejeitada'} e registrada no histórico.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
      <BottomNav go={go} role={role} active="opportunities" />
      <Modal visible={Boolean(viewer)} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={styles.viewerBackdrop}>
          <View style={styles.viewerHeader}>
            <Text numberOfLines={1} style={styles.viewerTitle}>{viewer?.title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar documento" hitSlop={10} onPress={() => setViewer(null)}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>
          </View>
          {viewer ? <Image source={{ uri: viewer.uri }} style={styles.viewerImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  documentsList: { gap: 8 },
  evaluationBox: { gap: 4, padding: 12, borderRadius: 10, backgroundColor: partnerColors.greenLight, borderWidth: 1, borderColor: '#d7ef9e' },
  documentItem: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: partnerColors.white, borderWidth: 1, borderColor: partnerColors.border, borderRadius: 10 },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(5, 20, 38, 0.96)', paddingTop: 36, paddingBottom: 24 },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 12 },
  viewerTitle: { flex: 1, color: '#ffffff', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  viewerImage: { flex: 1, width: '100%' },
  stateContent: { flex: 1, justifyContent: 'center', padding: 20, gap: 14 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 108, gap: 14 },
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: partnerColors.greenLight },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1, minWidth: 0, gap: 6 },
  name: { color: partnerColors.ink, fontSize: 20, lineHeight: 24, fontFamily: 'Poppins_600SemiBold' },
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  completeText: { color: partnerColors.greenDark, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  incompleteText: { color: partnerColors.muted, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldCount: { color: partnerColors.muted, fontSize: 13, fontFamily: 'Poppins_500Medium' },
  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fieldItem: { width: '48%', minHeight: 76, flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: partnerColors.white, borderWidth: 1, borderColor: partnerColors.border, borderRadius: 8 },
  fieldCopy: { flex: 1, minWidth: 0, gap: 4 },
  fieldLabel: { color: partnerColors.muted, fontSize: 13, lineHeight: 22, fontFamily: 'Poppins_400Regular' },
  fieldValue: { color: partnerColors.ink, fontSize: 14, lineHeight: 22, fontFamily: 'Poppins_600SemiBold' },
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 14, backgroundColor: partnerColors.greenLight },
  privacyText: { flex: 1, color: partnerColors.greenDark, fontSize: 13, lineHeight: 22, fontFamily: 'Poppins_400Regular' },
  decisionCard: { gap: 10, padding: 14, borderRadius: 16, backgroundColor: partnerColors.white, borderWidth: 1, borderColor: partnerColors.border },
  decisionCopy: { color: partnerColors.muted, fontSize: 14, lineHeight: 22, fontFamily: 'Poppins_400Regular' },
  decisionActions: { gap: 8 },
  confirmation: { gap: 8, padding: 12, borderRadius: 7, backgroundColor: partnerColors.amberLight },
  confirmationText: { color: partnerColors.ink, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  rejectButton: { backgroundColor: partnerColors.red },
  rejectOutline: { borderColor: '#efc7c1' },
  rejectText: { color: partnerColors.red, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  finalStatus: { padding: 13, borderRadius: 8 },
  finalStatusText: { fontSize: 14, lineHeight: 18, fontFamily: 'Poppins_500Medium' },
  approved: { backgroundColor: partnerColors.greenLight },
  approvedText: { color: partnerColors.greenDark },
  rejected: { backgroundColor: partnerColors.redLight },
  rejectedText: { color: partnerColors.red },
})
