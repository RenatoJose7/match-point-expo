import React, { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { USE_NATIVE_DRIVER } from '../motion'
import { BLUE } from '../../theme/colors'
import { styles } from '../../theme/styles'

function NavButton({ item, isActive, onPress, partner = false }) {
  const scale = useRef(new Animated.Value(1)).current
  const iconScale = useRef(new Animated.Value(isActive ? 0.78 : 1)).current

  useEffect(() => {
    if (isActive) {
      Animated.spring(iconScale, {
        toValue: 1,
        stiffness: 360,
        damping: 17,
        mass: 0.65,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start()
    }
  }, [iconScale, isActive])

  const animateScale = toValue => Animated.spring(scale, {
    toValue,
    stiffness: 460,
    damping: 24,
    mass: 0.5,
    useNativeDriver: USE_NATIVE_DRIVER,
  }).start()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      onPressIn={() => animateScale(0.92)}
      onPressOut={() => animateScale(1)}
      style={[styles.navItem, localStyles.item, item.key === 'opportunities' && localStyles.opportunityItem]}
    >
      <Animated.View style={[styles.navContent, partner && styles.navContentPartner, localStyles.content, isActive && styles.navActive, { transform: [{ scale }] }]}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Ionicons name={item.icon} size={22} color={BLUE} />
        </Animated.View>
        <Text numberOfLines={1} style={[styles.navText, localStyles.label]}>{item.label}</Text>
      </Animated.View>
    </Pressable>
  )
}

export function BottomNav({ go, role = 'athlete', active = 'home' }) {
  const partner = role !== 'athlete'
  const home = role === 'trainer' ? 'homeTrainer' : role === 'institution' ? 'homeInstitution' : 'homeAthlete'
  const opportunities = role === 'athlete' ? 'opportunitiesAthlete' : role === 'trainer' ? 'opportunitiesTrainer' : 'opportunitiesInstitution'
  const profile = role === 'trainer' ? 'profileTrainer' : role === 'institution' ? 'profileInstitution' : 'profileAthlete'
  const items = [
    { key: 'home', label: 'Início', icon: 'home', target: home },
    { key: 'opportunities', label: 'Oportunidades', icon: 'trophy', target: opportunities },
    ...(role === 'athlete' ? [{ key: 'applications', label: 'Inscrições', icon: 'document-text', target: 'applications' }] : []),
    { key: 'profile', label: 'Perfil', icon: 'person', target: profile },
  ]

  return (
    <View style={[styles.bottomNav, partner && styles.bottomNavPartner, localStyles.nav]}>
      {items.map(item => (
        <NavButton
          key={item.key}
          item={item}
          isActive={active === item.key}
          onPress={() => go(item.target)}
          partner={partner}
        />
      ))}
    </View>
  )
}

const localStyles = StyleSheet.create({
  nav: { height: 72 },
  item: { minHeight: 72, minWidth: 0 },
  opportunityItem: { flex: 1.3 },
  content: { width: '100%', minHeight: 72, paddingTop: 4, paddingBottom: 4, gap: 1 },
  label: { alignSelf: 'stretch', fontSize: 13, letterSpacing: -0.35, lineHeight: 16, textAlign: 'center' },
})
