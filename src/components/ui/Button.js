import React, { useRef } from 'react'
import { Animated, Pressable, Text } from 'react-native'
import { USE_NATIVE_DRIVER } from '../motion'
import { styles } from '../../theme/styles'

export function Button({ children, onPress, variant = 'green', wide = false, disabled = false }) {
  const scale = useRef(new Animated.Value(1)).current
  const animateScale = toValue => Animated.spring(scale, {
    toValue,
    stiffness: 420,
    damping: 24,
    mass: 0.55,
    useNativeDriver: USE_NATIVE_DRIVER,
  }).start()

  return (
    <Animated.View style={[styles.buttonMotion, wide && styles.buttonMotionWide, { transform: [{ scale }] }]}>
      <Pressable
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
        ]}
      >
        <Text style={[styles.buttonText, variant === 'blue' && styles.buttonTextWhite]}>{children}</Text>
      </Pressable>
    </Animated.View>
  )
}
