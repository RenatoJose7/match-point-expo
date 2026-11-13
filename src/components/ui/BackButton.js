import React from 'react'
import { Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { styles } from '../../theme/styles'

export function BackButton({ onPress, style }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} onPress={onPress} style={[styles.back, style]}>
      <Ionicons name="arrow-back" size={22} color="#fff" />
    </Pressable>
  )
}
