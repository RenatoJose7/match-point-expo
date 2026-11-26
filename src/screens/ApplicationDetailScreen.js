import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../components/accessibility/AppText'
import { Ionicons } from '@expo/vector-icons'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { documentLabel } from '../components/ui/documentLabels'
import { Button } from '../components/ui/Button'
import { BLUE, GREEN } from '../theme/colors'

const statusLabel = (status) => ({
  inscrita: 'Inscrita',
  documentos_enviados: 'Documentos enviados',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  rejeitada: 'Não selecionado',
  nao_selecionado: 'Não selecionado',
}[status] ?? status?.replaceAll('_', ' ') ?? 'Não informado')

const statusOrder = ['inscrita', 'documentos_enviados', 'em_analise', 'resultado']
const demoDocuments = ['Currículo esportivo', 'Histórico escolar', 'Vídeo de apresentação', 'Comprovante de residência']


function formatDate(value) {
  if (!value) return 'Aguardando'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Aguardando' : date.toLocaleDateString('pt-BR')
}

function timelineDate(application, status) {
  if (status === 'inscrita') return formatDate(application.criadoEm)
  if (status === 'resultado') {
    return ['aprovada', 'rejeitada'].includes(application.status)
      ? formatDate(application.atualizadoEm)
      : 'Aguardando'
  }

  const event = (application.historico ?? []).find(item => (item.statusNovo ?? item.status) === status)
  if (event?.data) return formatDate(event.data)

  const effectiveStatus = ['aprovada', 'rejeitada'].includes(application.status)
    ? 'resultado'
    : application.status

  return statusOrder.indexOf(effectiveStatus) >= statusOrder.indexOf(status)
    ? formatDate(application.atualizadoEm)
    : 'Aguardando'
}

function buildTimeline(application, opportunity) {
  // Oportunidade sem documentos exigidos: a etapa não fica "Aguardando" para sempre.
  const noDocuments = Boolean(opportunity) && (opportunity.documentosNecessarios ?? []).length === 0
  const current = ['aprovada', 'rejeitada'].includes(application.status) ? 'resultado' : application.status
  const currentIndex = Math.max(statusOrder.indexOf(current), 0)

  return [
    { key: 'inscrita', label: 'Inscrição realizada' },
    { key: 'documentos_enviados', label: 'Documentos enviados' },
    { key: 'em_analise', label: 'Em análise' },
    { key: 'resultado', label: 'Resultado final' },
  ].map((step, index) => {
    const done = index <= currentIndex
    const date = timelineDate(application, step.key)
    // Etapa concluída sem data registrada não deve aparecer como "Aguardando".
    if (noDocuments && step.key === 'documentos_enviados') return { ...step, done: true, current: false, date: 'Não exigido' }
    return { ...step, done, current: index === currentIndex, date: done && date === 'Aguardando' ? '' : date }
  })
}

export function ApplicationDetailScreen({ go, back, repositories, routeParams = {} }) {
  const [application, setApplication] = useState(null)
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const applicationId = routeParams.applicationId

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        if (!applicationId) throw new Error('Não foi possível identificar a candidatura.')
        let sourceRepositories = routeParams.demo && repositories.demo ? repositories.demo : repositories
        let applicationResult = await sourceRepositories.applications.obterCandidatura(applicationId)
        if (!applicationResult.ok && sourceRepositories !== repositories.demo && repositories.demo) {
          sourceRepositories = repositories.demo
          applicationResult = await sourceRepositories.applications.obterCandidatura(applicationId)
        }
        if (!applicationResult.ok) throw new Error(applicationResult.mensagem || 'Candidatura não encontrada.')
        const opportunityResult = await sourceRepositories.opportunities.obterOportunidade(applicationResult.data.oportunidadeId)
        if (!opportunityResult.ok) throw new Error(opportunityResult.mensagem || 'Oportunidade não encontrada.')
        if (active) {
          setApplication(applicationResult.data)
          setOpportunity(opportunityResult.data)
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Não foi possível carregar a candidatura.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [applicationId, repositories, reloadKey])

  const timeline = application ? buildTimeline(application, opportunity) : []
  const documents = application?.documentos?.filter(item => item.status !== 'pendente') ?? []
  // Sem registro de arquivos, a lista só aparece se a etapa de documentos já foi concluída.
  const documentsStepDone = timeline.some(step => step.key === 'documentos_enviados' && step.done)
  // Candidatura real só lista os arquivos realmente enviados; a lista pronta é só do exemplo.
  const fallbackDocuments = routeParams.demo ? demoDocuments : []
  // Candidatura real ainda inscrita com documentos faltando: o atleta volta para enviar.
  const pendingDocuments = !routeParams.demo && application?.status === 'inscrita'
    ? (opportunity?.documentosNecessarios ?? []).filter((type) => !(application.documentos ?? []).some((item) => item.tipo === type))
    : []
  const visibleDocuments = documents.length || !documentsStepDone
    ? documents
    : fallbackDocuments.map((name, index) => ({ id: `${name}-${index}`, nome: name }))

  return (
    <View style={localStyles.screen}>
      <BackButton onPress={back} />
      <View style={localStyles.header}>
        {opportunity ? (
          <>
            <View style={localStyles.headerCopy}>
              <Text numberOfLines={2} style={localStyles.opportunityTitle}>{opportunity.titulo}</Text>
              <Text numberOfLines={2} style={localStyles.opportunitySubtitle}>{[opportunity.modalidade, opportunity.categoria].filter(Boolean).join(' - ')}</Text>
            </View>
            <View style={localStyles.badge}>
              <Text style={localStyles.badgeText}>{statusLabel(application?.status)}</Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={localStyles.body}>
        {loading ? <View style={localStyles.centerState}><Text style={localStyles.state}>Carregando candidatura...</Text></View> : null}
        {!loading && error ? (
          <View style={localStyles.centerState}>
            <Text accessibilityRole="alert" style={localStyles.error}>{error}</Text>
            <Button wide onPress={() => setReloadKey(value => value + 1)}>Tentar novamente</Button>
          </View>
        ) : null}
        {!loading && application && opportunity ? (
          <ScrollView contentContainerStyle={localStyles.content} showsVerticalScrollIndicator={false}>
            <View style={localStyles.timelineCard}>
              <Text style={localStyles.sectionTitle}>Status da candidatura</Text>
              {timeline.map((step, index) => (
                <View key={step.key} style={[localStyles.step, index === timeline.length - 1 && localStyles.lastStep]}>
                  {index < timeline.length - 1 && <View style={localStyles.stepLine} />}
                  <View style={[localStyles.stepIcon, !step.done && localStyles.stepIconPending]}>
                    {step.done && <Ionicons name="checkmark" size={15} color={BLUE} />}
                  </View>
                  <Text style={[localStyles.stepLabel, step.current && localStyles.stepCurrent]}>{step.label}</Text>
                  <Text style={localStyles.stepDate}>{step.key === 'em_analise' && step.done && step.date ? `Desde ${step.date}` : step.date}</Text>
                </View>
              ))}
            </View>

            <Text style={localStyles.documentsTitle}>Documentos enviados</Text>
            <View style={localStyles.documentsList}>
              {visibleDocuments.length ? visibleDocuments.map((item, index) => (
                <Text key={item.id ?? item.nome ?? index} style={localStyles.document}>{documentLabel(item.tipo ?? item.nome ?? 'Documento enviado')}</Text>
              )) : <Text style={localStyles.emptyDocuments}>{(opportunity.documentosNecessarios ?? []).length === 0 ? 'Esta oportunidade não exige documentos.' : 'Nenhum documento enviado.'}</Text>}
            </View>

            {pendingDocuments.length ? (
              <Pressable accessibilityRole="button" onPress={() => go('applicationInfo', { oportunidadeId: application.oportunidadeId })} style={localStyles.action}>
                <Text style={localStyles.actionText}>Enviar documentos ({pendingDocuments.length})</Text>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => go('opportunitiesAthlete')} style={localStyles.action}>
                <Text style={localStyles.actionText}>Ver oportunidades</Text>
              </Pressable>
            )}
          </ScrollView>
        ) : null}
      </View>
      <BottomNav go={go} active="applications" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },
  // Mais alto que antes: a seta de voltar ficava por cima do título.
  header: { height: 186, backgroundColor: BLUE, justifyContent: 'flex-end', paddingBottom: 26, paddingHorizontal: 20 },
  headerCopy: { paddingRight: 132 },
  opportunityTitle: { color: '#ffffff', fontFamily: 'Poppins_600SemiBold', fontSize: 19, lineHeight: 24 },
  opportunitySubtitle: { color: '#ffffff', fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 19, marginTop: 2 },
  badge: { position: 'absolute', right: 14, bottom: 62, minWidth: 120, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN, borderRadius: 6, paddingHorizontal: 12 },
  badgeText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  body: { position: 'absolute', top: 172, bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  content: { flexGrow: 1, paddingBottom: 91 },
  timelineCard: { marginHorizontal: 7, minHeight: 280, borderRadius: 17, backgroundColor: '#ffffff', paddingHorizontal: 13, paddingTop: 20, paddingBottom: 8, shadowColor: '#10284a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 6, elevation: 3 },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 19, lineHeight: 24, marginBottom: 19 },
  step: { height: 60, flexDirection: 'row', alignItems: 'flex-start' },
  lastStep: { height: 42 },
  stepLine: { position: 'absolute', zIndex: 0, left: 9, top: 18, width: 2, height: 42, backgroundColor: '#e1e4e5' },
  stepIcon: { zIndex: 1, width: 19, height: 19, borderRadius: 10, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepIconPending: { backgroundColor: '#ffffff', borderColor: '#dfe2e4', borderWidth: 2 },
  stepLabel: { flex: 1, color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 15, lineHeight: 19 },
  stepCurrent: { fontFamily: 'Poppins_600SemiBold' },
  stepDate: { color: '#767676', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 19, marginLeft: 7, textAlign: 'right' },
  documentsTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 19, lineHeight: 24, marginTop: 24, marginLeft: 20, marginBottom: 18 },
  documentsList: { gap: 20, paddingHorizontal: 20 },
  document: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 15, lineHeight: 21 },
  emptyDocuments: { color: '#767676', fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 21 },
  action: { height: 48, marginHorizontal: 16, marginTop: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: BLUE, borderRadius: 24 },
  actionText: { color: '#ffffff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  centerState: { flex: 1, gap: 16, justifyContent: 'center', padding: 24 },
  state: { color: '#59626b', fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  error: { color: '#a42424', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
})
