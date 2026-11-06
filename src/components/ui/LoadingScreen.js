import React from 'react'
import { StyleSheet, View } from 'react-native'
import LottieView from 'lottie-react-native'

export function LoadingScreen() {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Carregando MatchPoint" style={styles.screen}>
      <LottieView
        autoPlay
        loop
        source={require('../../../assets/tennis-ball-loading.json')}
        style={styles.ball}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#105496',
  },
  ball: {
    width: 210,
    height: 210,
  },
})
