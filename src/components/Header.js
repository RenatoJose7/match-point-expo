import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'

export function Header({ initials, name, subtitle, go, repositories, trainer = false }) {
  const handleAction = async () => {
    if (!trainer) return go('notifications')
    await repositories?.authentication.sair()
  }

  return (
    <View style={[styles.homeHeader, trainer && styles.trainerHomeHeader]}>
      <Image source={assets.monogram} style={[styles.homeMark, trainer && styles.trainerHomeMark]} resizeMode="contain" />
      <View style={[styles.greetingRow, trainer && styles.trainerGreetingRow]}>
        <View style={[styles.avatar, trainer && styles.trainerAvatar]}><Text style={styles.avatarText}>{initials}</Text></View>
        <View>
          <Text style={[styles.greeting, trainer && styles.trainerGreeting]}>Olá, <Text style={styles.signupAccent}>{name}</Text></Text>
          <Text style={[styles.role, trainer && styles.trainerWelcome]}>{subtitle}</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={trainer ? 'Sair da conta' : 'Notificações'} onPress={handleAction} style={[styles.headerAction, trainer && styles.trainerHeaderAction]}>
        {trainer ? <Ionicons name="log-out-outline" size={22} color="#fff" /> : <Text style={styles.headerIcon}>●</Text>}
      </Pressable>
      <View style={[styles.homeRule, trainer && styles.trainerHomeRule]} />
    </View>
  )
}
