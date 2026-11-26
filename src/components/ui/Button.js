import React, { useRef } from 'react'
import { Animated, Pressable } from 'react-native'
import { Text } from '../accessibility/AppText'
import { USE_NATIVE_DRIVER } from '../motion'
import { styles } from '../../theme/styles'
import { useAccessibility, useReduceMotion } from '../accessibility/AccessibilityContext'

export function Button({ children, onPress, variant = 'green', wide = false, disabled = false }) {
  const scale = useRef(new Animated.Value(1)).current
  const reduceMotion = useReduceMotion()
  const { settings } = useAccessibility()
  const animateScale = toValue => !reduceMotion && Animated.spring(scale, {
    toValue,
    stiffness: 420,
    damping: 24,
    mass: 0.55,
    useNativeDriver: USE_NATIVE_DRIVER,
  }).start()

  return (
    <Animated.View style={[styles.buttonMotion, wide && styles.buttonMotionWide, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={typeof children === 'string' ? children : undefined}
        accessibilityState={{ disabled }}
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => !disabled && animateScale(0.965)}
        onPressOut={() => !disabled && animateScale(1)}
        style={({ pressed }) => [
          styles.button,
          wide && styles.buttonWide,
          variant === 'blue' ? styles.buttonBlue : styles.buttonGreen,
          pressed && styles.buttonPressed,
          disabled && { opacity: 0.6 },
          // Alto contraste: contorno forte para o botão se destacar de qualquer fundo.
          settings.highContrast && { borderWidth: 2.5, borderColor: '#000000' },
        ]}
      >
        <Text style={[styles.buttonText, variant === 'blue' && styles.buttonTextWhite]}>{children}</Text>
      </Pressable>
    </Animated.View>
  )
}
