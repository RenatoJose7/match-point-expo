import React from 'react'
import { View } from 'react-native'
import { Text } from './accessibility/AppText'
import { styles } from '../theme/styles'

export function StatIcon({ children }) {
  return <View style={styles.statIcon}><Text style={styles.statIconText}>{children}</Text></View>
}
