import React from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Reveal } from './motion'
import { getOpportunityImage } from '../theme/opportunityImages'
import { styles } from '../theme/styles'

export function OpportunityRow({ item, athlete = false, onPress, delay = 0, index = 0 }) {
  return (
    <Reveal delay={delay}>
      <Pressable onPress={onPress} style={[styles.listCard, localStyles.card]}>
        <Image source={getOpportunityImage({ titulo: item[0] }, index)} style={[styles.listThumb, localStyles.thumb]} resizeMode="cover" />
        <View style={[styles.listCopy, localStyles.copy]}>
          <Text style={[styles.listName, localStyles.name]}>{item[0]}</Text>
          <Text style={styles.listMeta}>♟  {item[1]}</Text>
          <Text style={styles.listMeta}>▣  Inscrições até 19/08/26</Text>
        </View>
        {athlete && (
          <View style={[styles.matchBadge, localStyles.badge]}>
            <Text style={[styles.scoreLabel, localStyles.badgeLabel]}>Match{`\n`}Score</Text>
            <Text style={[styles.scoreValue, localStyles.badgeValue]}>{item[2]}</Text>
          </View>
        )}
      </Pressable>
    </Reveal>
  )
}

const localStyles = StyleSheet.create({
  card: { minHeight: 176, paddingVertical: 11, alignItems: 'center' },
  thumb: { width: 110, height: 146 },
  copy: { paddingVertical: 5, gap: 4 },
  name: { lineHeight: 23 },
  badge: { width: 92, minHeight: 104, paddingTop: 9 },
  badgeLabel: { lineHeight: 20 },
  badgeValue: { lineHeight: 34 },
})
