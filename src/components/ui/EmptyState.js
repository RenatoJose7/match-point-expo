import React from 'react'
import { Text, View } from 'react-native'
import { Button } from './Button'
import { BLUE } from '../../theme/colors'

export function EmptyState({ title, message, actionLabel, onAction }) {
  if (!title?.trim() || !message?.trim()) {
    throw new Error('O título e a orientação do estado vazio são obrigatórios.')
  }

  if (Boolean(actionLabel) !== Boolean(onAction)) {
    throw new Error('Informe o texto e a ação juntos para o botão do estado vazio.')
  }

  return (
    <View
      accessibilityRole="summary"
      style={{ alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}
    >
      <Text style={{ color: BLUE, fontFamily: 'Poppins_600SemiBold', fontSize: 18, textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ color: BLUE, fontFamily: 'Poppins_400Regular', textAlign: 'center' }}>
        {message}
      </Text>
      {onAction && <Button onPress={onAction}>{actionLabel}</Button>}
    </View>
  )
}
