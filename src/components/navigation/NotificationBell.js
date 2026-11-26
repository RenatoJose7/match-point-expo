import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../accessibility/AppText'

// Sino com o número de notificações não lidas (o leitor de tela fala a quantidade).
export function NotificationBell({ go, repositories, style, size = 21 }) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const user = await repositories?.users?.obterUsuarioAtual?.()
        if (!user?.ok) return
        const result = await repositories.notifications.listarNotificacoesDoUsuario(user.data.id)
        if (active && result.ok) setUnread(result.data.filter((item) => !item.lida).length)
      } catch {
        // Sem conexão o sino continua funcionando, só sem o número.
      }
    }
    load()
    return () => { active = false }
  }, [repositories])

  const label = unread > 0 ? `Notificações, ${unread} não ${unread === 1 ? 'lida' : 'lidas'}` : 'Notificações'
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => go('notifications')} style={style}>
      <Ionicons name="notifications" size={size} color="#fff" />
      {unread > 0 ? (
        <View style={styles.badge} pointerEvents="none">
          <Text fixedSize style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  badge: { position: 'absolute', top: 2, right: 0, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5392b', borderWidth: 1.5, borderColor: '#ffffff' },
  badgeText: { color: '#ffffff', fontFamily: 'Poppins_600SemiBold', fontSize: 10, lineHeight: 13 },
})
