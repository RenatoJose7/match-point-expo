import React, { useEffect, useRef } from 'react'
import { Animated, Easing, Platform } from 'react-native'
import { styles } from '../theme/styles'
import { useReduceMotion } from './accessibility/AccessibilityContext'

export const USE_NATIVE_DRIVER = Platform.OS !== 'web'

export function ScreenTransition({ children, direction = 1 }) {
  // Com "Reduzir animações" a tela aparece direto, sem deslizar.
  const reduceMotion = useReduceMotion()
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1)
      return
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: 360,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start()
  }, [progress, reduceMotion])

  return (
    <Animated.View
      style={[
        styles.screenTransition,
        {
          opacity: progress,
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [direction * 22, 0] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.992, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

export function Reveal({ children, delay = 0 }) {
  const reduceMotion = useReduceMotion()
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1)
      return
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: 440,
      delay,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start()
  }, [delay, progress, reduceMotion])

  return (
    <Animated.View
      style={[
        styles.reveal,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}
