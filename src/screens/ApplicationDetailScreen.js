import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BackButton } from '../components/ui/BackButton'
import { BottomNav } from '../components/navigation/BottomNav'
import { Button } from '../components/ui/Button'
import { BLUE, GREEN } from '../theme/colors'

const statusLabel = (status) => ({
  inscrita: 'Inscrita',
  documentos_enviados: 'Documentos enviados',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
}[status] ?? status?.replaceAll('_', ' ') ?? 'Não informado')

const statusOrder = ['inscrita', 'documentos_enviados', 'em_analise', 'resultado']
const demoDocuments = ['Currículo esportivo', 'Histórico escolar', 'Vídeo de apresentação', 'Comprovante de residência']

const documentLabel = (document) => ({
  curriculo_esportivo: 'Currículo esportivo',
  historico_escolar: 'Histórico escolar',
  video_apresentacao: 'Vídeo de apresentação',
  comprovante_residencia: 'Comprovante de residência',
}[document] ?? document)

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

function buildTimeline(application) {
  const current = ['aprovada', 'rejeitada'].includes(application.status) ? 'resultado' : application.status
  const currentIndex = Math.max(statusOrder.indexOf(current), 0)

  return [
    { key: 'inscrita', label: 'Inscrição realizada' },
    { key: 'documentos_enviados', label: 'Documentos enviados' },
    { key: 'em_analise', label: 'Em análise' },
    { key: 'resultado', label: 'Resultado final' },
  ].map((step, index) => ({
    ...step,
    done: index <= currentIndex,
    current: index === currentIndex,
    date: timelineDate(application, step.key),
  }))
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

  const timeline = application ? buildTimeline(application) : []
  const documents = application?.documentos?.filter(item => item.status !== 'pendente') ?? []
  const requiredDocuments = opportunity?.documentosNecessarios ?? []
  const visibleDocuments = documents.length
    ? documents
    : (routeParams.demo ? demoDocuments : requiredDocuments).map((name, index) => ({ id: `${name}-${index}`, nome: name }))

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
                  <Text style={localStyles.stepDate}>{step.key === 'em_analise' && step.done ? `Desde ${step.date}` : step.date}</Text>
                </View>
              ))}
            </View>

            <Text style={localStyles.documentsTitle}>Documentos enviados</Text>
            <View style={localStyles.documentsList}>
              {visibleDocuments.length ? visibleDocuments.map((item, index) => (
                <Text key={item.id ?? item.nome ?? index} style={localStyles.document}>{documentLabel(item.nome ?? item.tipo ?? 'Documento enviado')}</Text>
              )) : <Text style={localStyles.emptyDocuments}>Nenhum documento enviado.</Text>}
            </View>

            <Pressable accessibilityRole="button" onPress={() => go('opportunitiesAthlete')} style={localStyles.action}>
              <Text style={localStyles.actionText}>Ver oportunidades</Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </View>
      <BottomNav go={go} active="opportunities" />
    </View>
  )
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },
  header: { height: 149, backgroundColor: BLUE, justifyContent: 'flex-end', paddingBottom: 22, paddingHorizontal: 20 },
  headerCopy: { paddingRight: 132 },
  opportunityTitle: { color: '#ffffff', fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 23 },
  opportunitySubtitle: { color: '#ffffff', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 19, marginTop: 2 },
  badge: { position: 'absolute', right: 10, bottom: 47, minWidth: 120, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN, borderRadius: 6, paddingHorizontal: 12 },
  badgeText: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  body: { position: 'absolute', top: 139, bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  content: { flexGrow: 1, paddingBottom: 91 },
  timelineCard: { marginHorizontal: 7, minHeight: 280, borderRadius: 17, backgroundColor: '#ffffff', paddingHorizontal: 13, paddingTop: 20, paddingBottom: 8, shadowColor: '#10284a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 6, elevation: 3 },
  sectionTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 22, marginBottom: 19 },
  step: { height: 60, flexDirection: 'row', alignItems: 'flex-start' },
  lastStep: { height: 42 },
  stepLine: { position: 'absolute', zIndex: 0, left: 9, top: 18, width: 2, height: 42, backgroundColor: '#e1e4e5' },
  stepIcon: { zIndex: 1, width: 19, height: 19, borderRadius: 10, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepIconPending: { backgroundColor: '#ffffff', borderColor: '#dfe2e4', borderWidth: 2 },
  stepLabel: { flex: 1, color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 19 },
  stepCurrent: { fontFamily: 'Poppins_600SemiBold' },
  stepDate: { color: '#767676', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 19, marginLeft: 7, textAlign: 'right' },
  documentsTitle: { color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 23, marginTop: 24, marginLeft: 20, marginBottom: 18 },
  documentsList: { gap: 20, paddingHorizontal: 20 },
  document: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 21 },
  emptyDocuments: { color: '#767676', fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 21 },
  action: { height: 40, marginHorizontal: 8, marginTop: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e3f95', borderRadius: 7 },
  actionText: { color: '#ffffff', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  centerState: { flex: 1, gap: 16, justifyContent: 'center', padding: 24 },
  state: { color: '#59626b', fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  error: { color: '#a42424', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
})
