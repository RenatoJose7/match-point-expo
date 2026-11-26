import React, { useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import { Text } from './accessibility/AppText'
import { Ionicons } from '@expo/vector-icons'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'
import { useFrameSize } from '../theme/layout'
import { ACCESSIBILITY_CORNER, AccessibilityButton } from './accessibility/AccessibilityButton'
import { fitGriffithsSize } from '../theme/typography'
import { NotificationBell } from './navigation/NotificationBell'

function shortName(name) {
  return String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 1)
    .join(' ') || 'Usuário'
}

export function Header({ initials, name, photoUrl, subtitle, go, repositories, trainer = false }) {
  const [activePhotoUrl, setActivePhotoUrl] = useState(photoUrl ?? '')

  useEffect(() => {
    let active = true
    setActivePhotoUrl(photoUrl ?? '')
    repositories?.users.obterUsuarioAtual?.().then((result) => {
      if (active && result.ok) setActivePhotoUrl(result.data.fotoUrl ?? '')
    })
    return () => { active = false }
  }, [photoUrl, repositories])

  const signOut = async () => {
    await repositories?.authentication.sair()
  }

  const displayName = shortName(name)
  // A saudação encolhe em telas estreitas ou com nomes longos, em vez de ser cortada.
  const frame = useFrameSize()
  const greetingSize = fitGriffithsSize(`Olá, ${displayName}`, frame.width - 190, trainer ? 38 : 40)
  const displayInitials = String(initials || displayName.charAt(0) || 'U').trim()

  return (
    <View style={[styles.homeHeader, trainer && styles.trainerHomeHeader]}>
      <Image source={assets.monogram} style={[styles.homeMark, trainer && styles.trainerHomeMark]} resizeMode="contain" />
      <AccessibilityButton style={ACCESSIBILITY_CORNER} />
      <View style={[styles.greetingRow, trainer && styles.trainerGreetingRow, localStyles.greetingRow]}>
        <View style={[styles.avatar, trainer && styles.trainerAvatar, localStyles.avatar]}>
          {activePhotoUrl ? <Image source={{ uri: activePhotoUrl }} style={localStyles.avatarPhoto} resizeMode="cover" /> : <Text style={styles.avatarText}>{displayInitials}</Text>}
        </View>
        <View style={localStyles.greetingTextContainer}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.greeting, trainer && styles.trainerGreeting, { fontSize: greetingSize, lineHeight: Math.round(greetingSize * 1.16) }]}>Olá, <Text style={styles.signupAccent}>{displayName}</Text></Text>
          <Text fixedSize style={[styles.role, trainer && styles.trainerWelcome]}>{subtitle}</Text>
        </View>
      </View>
      <View style={[localStyles.actions, trainer && localStyles.partnerActions]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={signOut} style={localStyles.iconButton}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </Pressable>
        <NotificationBell go={go} repositories={repositories} style={localStyles.iconButton} />
      </View>
      <View style={[styles.homeRule, trainer && styles.trainerHomeRule]} />
    </View>
  )
}

const localStyles = StyleSheet.create({
  avatar: { overflow: 'hidden' },
  avatarPhoto: { width: '100%', height: '100%' },
  greetingRow: { right: 88 },
  greetingTextContainer: { flex: 1, minWidth: 0 },
  actions: { position: 'absolute', right: 14, top: 112, flexDirection: 'row', gap: 8 },
  partnerActions: { top: 107 },
  iconButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
})
