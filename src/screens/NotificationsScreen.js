import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BackButton } from '../components/ui/BackButton'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

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

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Agora' : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function NotificationsScreen({ back, repositories, session }) {
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
        if (active) setNotifications(result.data.length > 0 ? result.data : predefinedNotifications)
      } catch (loadError) {
        if (active) setNotifications(predefinedNotifications)
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
      <BackButton onPress={back} />
      <Image source={assets.monogram} style={[styles.notificationMark, localStyles.mark]} resizeMode="contain" />
      <Text style={[styles.notificationsTitle, localStyles.heading]}>Notificações</Text>
      <Text style={[styles.notificationsSubtitle, localStyles.subtitle]}>Acompanhe atualizações{`\n`}importantes da sua conta</Text>
      <ScrollView style={localStyles.scroll} contentContainerStyle={[styles.noticeList, localStyles.list]} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={localStyles.state}>Carregando notificações...</Text> : null}
        {!loading && error ? <View style={localStyles.state}><Text accessibilityRole="alert" style={localStyles.error}>{error}</Text><Pressable onPress={() => setRetryKey((value) => value + 1)}><Text style={localStyles.action}>Tentar novamente</Text></Pressable></View> : null}
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
  heading: { fontSize: 40, lineHeight: 48 },
  subtitle: { lineHeight: 22 },
  scroll: { flex: 1 },
  list: { paddingHorizontal: 22, paddingTop: 36, paddingBottom: 124, gap: 16 },
  notice: { minHeight: 166, padding: 16, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center' },
  state: { color: '#526770', fontFamily: 'Poppins_400Regular', paddingVertical: 16, textAlign: 'center' },
  error: { color: '#9b2c2c', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  action: { color: '#126b35', fontFamily: 'Poppins_600SemiBold', padding: 8 },
  emptyTitle: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 13, textAlign: 'center' },
  readNotice: { opacity: 0.62 },
})
