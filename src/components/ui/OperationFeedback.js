import React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { BLUE, DARK_GREEN } from '../../theme/colors'

const feedbackStyles = {
  loading: { color: BLUE },
  confirmation: { color: BLUE },
  success: { color: DARK_GREEN },
  error: { color: '#b42318' },
}

export function OperationFeedback({ status, message }) {
  const statusStyle = feedbackStyles[status]

  if (!statusStyle) {
    throw new Error(`Estado de operação inválido: ${status}`)
  }

  if (!message?.trim()) {
    throw new Error('A mensagem da operação é obrigatória.')
  }

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
    >
      {status === 'loading' && <ActivityIndicator color={statusStyle.color} />}
      <Text style={{ color: statusStyle.color, flexShrink: 1, fontFamily: 'Poppins_400Regular' }}>
        {message}
      </Text>
    </View>
  )
}
