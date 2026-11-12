import React from 'react'
import { Image, StyleSheet, Text, TextInput, View } from 'react-native'
import { assets } from '../theme/assets'
import { styles } from '../theme/styles'
import { BackButton } from './ui/BackButton'

export function ListHeader({
  title,
  back,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar oportunidades',
  titleStyle,
  headerBackground,
  headerOverlay,
  headerAction,
}) {
  return (
    <View style={[styles.listHeader, localStyles.header]}>
      {headerBackground}
      <BackButton onPress={back} />
      <Image source={assets.monogram} style={styles.listMark} resizeMode="contain" />
      <Text style={[styles.listTitle, localStyles.title, titleStyle]}>{title}</Text>
      {onSearchChange ? (
        <View style={[styles.search, localStyles.search]}>
          <TextInput
            accessibilityLabel={searchPlaceholder}
            placeholder={`⌕  ${searchPlaceholder}`}
            placeholderTextColor="#2b5c9c"
            returnKeyType="search"
            style={[styles.searchText, { alignSelf: 'stretch', flex: 1 }]}
            value={searchValue}
            onChangeText={onSearchChange}
          />
        </View>
      ) : <View style={[styles.search, localStyles.search]}><Text style={styles.searchText}>⌕  Buscar oportunidades</Text></View>}
      {headerOverlay}
      {headerAction}
    </View>
  )
}

const localStyles = StyleSheet.create({
  header: {
    overflow: 'hidden',
  },
  search: {
    zIndex: 5,
  },
  title: {
    fontSize: 40,
    lineHeight: 43,
  },
})
