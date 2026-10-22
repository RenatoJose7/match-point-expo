import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BackButton } from '../components/ui/BackButton'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

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
        if (active) setNotifications(result.data)
      } catch (loadError) {
        if (active) setError(loadError.message || 'Não foi possível carregar suas notificações.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [repositories, retryKey, session?.id])

  const markAsRead = async (notification) => {
    if (notification.lida) return
    const result = await repositories.notifications.marcarComoLida(notification.id)
    if (!result.ok) {
      setError(result.mensagem || 'Não foi possível atualizar a notificação.')
      return
    }
    setNotifications((items) => items.map((item) => item.id === notification.id ? result.data : item))
  }

  return (
    <View style={styles.notifications}>
      <BackButton onPress={back} />
      <Image source={assets.monogram} style={styles.notificationMark} />
      <Text style={styles.notificationsTitle}>Notificações</Text>
      <Text style={styles.notificationsSubtitle}>Acompanhe atualizações{`\n`}importantes da sua conta</Text>
      <ScrollView contentContainerStyle={styles.noticeList}>
        {loading ? <Text style={localStyles.state}>Carregando notificações...</Text> : null}
        {!loading && error ? <View style={localStyles.state}><Text accessibilityRole="alert" style={localStyles.error}>{error}</Text><Pressable onPress={() => setRetryKey((value) => value + 1)}><Text style={localStyles.action}>Tentar novamente</Text></Pressable></View> : null}
        {!loading && !error && notifications.length === 0 ? <View style={localStyles.state}><Text style={localStyles.emptyTitle}>Você está em dia</Text><Text style={localStyles.state}>Novas atualizações das suas candidaturas aparecerão aqui.</Text></View> : null}
        {!loading && !error && notifications.map((notification) => (
          <Pressable key={notification.id} accessibilityRole="button" onPress={() => markAsRead(notification)} style={[styles.notice, notification.lida && localStyles.readNotice]}>
            <Text style={styles.noticeTitle}>{!notification.lida ? <Text style={styles.dot}>● </Text> : null}{notification.titulo}</Text>
            <Text style={styles.noticeBody}>{notification.mensagem}</Text>
            <Text style={styles.noticeTime}>◷ {formatDate(notification.criadoEm)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const localStyles = StyleSheet.create({
  state: { color: '#526770', fontFamily: 'Poppins_400Regular', paddingVertical: 16, textAlign: 'center' },
  error: { color: '#9b2c2c', fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  action: { color: '#126b35', fontFamily: 'Poppins_600SemiBold', padding: 8 },
  emptyTitle: { color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 16, textAlign: 'center' },
  readNotice: { opacity: 0.62 },
})
