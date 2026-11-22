import React from 'react'
import { Image, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { assets } from '../theme/assets'
import { BLUE } from '../theme/colors'
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
  headerStyle,
}) {
  return (
    <View style={[styles.listHeader, localStyles.header, headerStyle]}>
      {headerBackground}
      <BackButton onPress={back} />
      <Image source={assets.monogram} style={styles.listMark} resizeMode="contain" />
      <Text style={[styles.listTitle, localStyles.title, titleStyle]}>{title}</Text>
      {onSearchChange ? (
        <View style={[styles.search, localStyles.search]}>
          <Ionicons name="search-outline" size={22} color={BLUE} />
          <TextInput
            accessibilityLabel={searchPlaceholder}
            placeholder={searchPlaceholder}
            placeholderTextColor={BLUE}
            returnKeyType="search"
            style={[styles.searchText, localStyles.searchInput]}
            value={searchValue}
            onChangeText={onSearchChange}
          />
        </View>
      ) : (
        <View style={[styles.search, localStyles.search]}>
          <Ionicons name="search-outline" size={22} color={BLUE} />
          <Text style={styles.searchText}>{searchPlaceholder}</Text>
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  searchInput: {
    alignSelf: 'stretch',
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 40,
    lineHeight: 43,
  },
})
