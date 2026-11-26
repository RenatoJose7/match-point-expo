import React from 'react'
import { Image, ImageBackground, View } from 'react-native'
import { assets } from '../../theme/assets'
import { styles } from '../../theme/styles'
import { BackButton } from './BackButton'
import { ACCESSIBILITY_CORNER, AccessibilityButton } from '../accessibility/AccessibilityButton'

export function Shell({ background, backgroundResizeMode = 'cover', children, back, logo = false, fallbackColor }) {
  return (
    <ImageBackground
      source={background}
      resizeMode={backgroundResizeMode}
      style={[styles.full, fallbackColor ? { backgroundColor: fallbackColor } : null]}
    >
      <View style={styles.dim} />
      {/* As margens das barras do sistema já são reservadas uma vez no App.js. */}
      <View style={styles.safe}>
        {back && <BackButton onPress={back} />}
        <AccessibilityButton style={ACCESSIBILITY_CORNER} />
        {logo && <Image source={assets.monogram} style={styles.monogram} resizeMode="contain" />}
        {children}
      </View>
    </ImageBackground>
  )
}
