import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../components/accessibility/AppText'
import { BackButton } from '../components/ui/BackButton'
import { DecorativeCurves } from '../components/ui/DecorativeCurves'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'
import { useHeightFit } from '../theme/layout'

const predefinedNotifications = [
  {
    id: 'demo-opportunity',
    titulo: 'Nova oportunidade encontrada',
    mensagem: 'Uma oportunidade compatível com seu perfil foi publicada.',
    tempo: 'Há 2 horas',
    lida: false,
    demo: true,
  },
  {
    id: 'demo-application',
    titulo: 'Sua candidatura foi atualizada',
    mensagem: 'A oportunidade “Bolsa de Estudos” mudou para Em análise.',
    tempo: 'Há 2 horas',
    lida: false,
    demo: true,
  },
  {
    id: 'demo-document',
    titulo: 'Documento solicitado',
    mensagem: 'Envie o comprovante de participação no campeonato estadual.',
    tempo: 'Há 2 horas',
    lida: false,
    demo: true,
  },
  {
    id: 'demo-reminder',
    titulo: 'Lembrete de inscrição',
    mensagem: 'As inscrições para a Clínica de Alto Rendimento terminam amanhã.',
    tempo: 'Ontem',
    lida: true,
    demo: true,
  },
]

// Exemplos para quem publica oportunidades (treinador e instituição): os do atleta falam de
// candidaturas próprias e não fariam sentido para esses perfis.
const partnerPredefinedNotifications = [
  { id: 'demo-new-candidate', titulo: 'Novo candidato', mensagem: 'Um atleta se candidatou à oportunidade “Bolsa de Estudos”.', tempo: 'Há 2 horas', lida: false, demo: true },
  { id: 'demo-documents', titulo: 'Documentos recebidos', mensagem: 'Um candidato enviou os documentos da “Avaliação Técnica”.', tempo: 'Há 5 horas', lida: false, demo: true },
  { id: 'demo-deadline', titulo: 'Prazo terminando', mensagem: 'As inscrições do “Campeonato” terminam em 3 dias.', tempo: 'Ontem', lida: true, demo: true },
]

// Exemplos do responsável: falam do atleta menor vinculado, não de candidaturas próprias.
const guardianPredefinedNotifications = [
  { id: 'demo-guardian-link', titulo: 'Atleta vinculado', mensagem: 'O código de vínculo foi usado e o atleta já aparece na sua conta.', tempo: 'Há 3 horas', lida: false, demo: true },
  { id: 'demo-guardian-application', titulo: 'Candidatura atualizada', mensagem: 'A candidatura do atleta vinculado para “Bolsa de Estudos” está em análise.', tempo: 'Ontem', lida: true, demo: true },
]

function predefinedFor(session) {
  if (session?.tipo === 'responsavel') return guardianPredefinedNotifications
  return ['treinador', 'instituicao'].includes(session?.tipo) ? partnerPredefinedNotifications : predefinedNotifications
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Agora' : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function NotificationsScreen({ back, repositories, session }) {
  const fit = useHeightFit()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await repositories.notifications.listarNotificacoesDoUsuario(session?.id)
        if (!result.ok) throw new Error(result.mensagem || 'Não foi possível carregar suas notificações.')
        if (active) setNotifications(result.data.length > 0 ? result.data : predefinedFor(session))
      } catch (loadError) {
        if (active) setNotifications(predefinedFor(session))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [repositories, retryKey, session?.id])

  const markAsRead = async (notification) => {
    if (notification.lida) return
    if (notification.demo) {
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, lida: true } : item))
      return
    }
    const result = await repositories.notifications.marcarComoLida(notification.id)
    if (!result.ok) {
      setError(result.mensagem || 'Não foi possível atualizar a notificação.')
      return
    }
    setNotifications((items) => items.map((item) => item.id === notification.id ? result.data : item))
  }

  return (
    <View style={[styles.notifications, localStyles.screen]}>
      {/* Faixa mais abaixo: no topo ela passava atrás do subtítulo e o deixava ilegível. */}
      <DecorativeCurves top={150} />
      <BackButton onPress={back} />
      <Image source={assets.monogram} style={[styles.notificationMark, localStyles.mark]} resizeMode="contain" />
      <Text style={[styles.notificationsTitle, localStyles.heading]}>Notificações</Text>
      <Text style={[styles.notificationsSubtitle, localStyles.subtitle]}>Acompanhe atualizações{`\n`}importantes da sua conta</Text>
      <ScrollView style={localStyles.scroll} contentContainerStyle={[styles.noticeList, localStyles.list, { paddingTop: fit(28, 14), gap: fit(14, 6) }]} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={localStyles.state}>Carregando notificações...</Text> : null}
        {!loading && error ? <View style={localStyles.state}><Text accessibilityRole="alert" style={localStyles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setRetryKey((value) => value + 1)}><Text style={localStyles.action}>Tentar novamente</Text></Pressable></View> : null}
        {!loading && !error && notifications.length === 0 ? <View style={localStyles.state}><Text style={localStyles.emptyTitle}>Você está em dia</Text><Text style={localStyles.state}>Novas atualizações das suas candidaturas aparecerão aqui.</Text></View> : null}
        {!loading && !error && notifications.map((notification) => (
          <Pressable key={notification.id} accessibilityRole="button" onPress={() => markAsRead(notification)} style={[styles.notice, localStyles.notice, notification.lida && localStyles.readNotice]}>
            <Text style={styles.noticeTitle}>{!notification.lida ? <Text style={styles.dot}>● </Text> : null}{notification.titulo}</Text>
            <Text style={styles.noticeBody}>{notification.mensagem}</Text>
            <Text style={styles.noticeTime}>◷ {notification.tempo || formatDate(notification.criadoEm)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const localStyles = StyleSheet.create({
  screen: { overflow: 'hidden' },
  mark: { top: 18, width: 51, height: 56 },
  heading: { fontSize: 48, lineHeight: 54 },
  subtitle: { fontSize: 14, lineHeight: 19, marginTop: 4 },
  scroll: { flex: 1 },
  list: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 40, gap: 14 },
  notice: { minHeight: 122, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center' },
  state: { color: '#526770', fontFamily: 'Poppins_400Regular', paddingVertical: 16, textAlign: 'center' },
  error: { color: '#9b2c2c', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  action: { color: '#126b35', fontFamily: 'Poppins_600SemiBold', padding: 8 },
  emptyTitle: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 15, textAlign: 'center' },
  readNotice: { backgroundColor: '#eef3f9' },
})
