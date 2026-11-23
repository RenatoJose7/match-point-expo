import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAccessibility } from './AccessibilityContext'

// Botão com o símbolo universal de acessibilidade. Abre o painel de ajustes.
// `variant="light"` para fundos escuros (ícone branco); `"dark"` para fundos claros.
export function AccessibilityButton({ variant = 'light', style, size = 22 }) {
  const { openPanel, active, settings } = useAccessibility()
  const customized = active || settings.reduceMotion
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Acessibilidade"
      accessibilityHint="Abre os ajustes de tamanho do texto, contraste e animações"
      hitSlop={10}
      onPress={openPanel}
      style={({ pressed }) => [styles.button, variant === 'dark' && styles.dark, customized && styles.customized, pressed && styles.pressed, style]}
    >
      <Ionicons name="accessibility" size={size} color={customized ? '#10579b' : variant === 'dark' ? '#10579b' : '#ffffff'} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  dark: { backgroundColor: 'rgba(16,87,155,0.1)' },
  // Com algum ajuste ligado, o botão fica verde-limão para lembrar que há personalização.
  customized: { backgroundColor: '#c4ff32' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
})

// Posição padrão: canto superior direito, na mesma altura do botão de voltar.
export const ACCESSIBILITY_CORNER = { position: 'absolute', top: 36, right: 18, zIndex: 25 }
