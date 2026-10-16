import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { BLUE } from '../../theme/colors'
import { styles } from '../../theme/styles'

const fieldStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderColor: BLUE,
    borderWidth: 1,
  },
  input: {
    color: BLUE,
    fontSize: 14,
  },
  eye: {
    color: BLUE,
  },
})

export function Field({
  placeholder,
  secureTextEntry = false,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize = 'none',
}) {
  const [hidden, setHidden] = useState(secureTextEntry)

  return (
    <View style={[styles.field, fieldStyles.container]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={BLUE}
        secureTextEntry={hidden}
        style={[styles.input, fieldStyles.input]}
        autoCapitalize={autoCapitalize}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
      {secureTextEntry && (
        <Pressable onPress={() => setHidden(value => !value)} hitSlop={12}>
          <Text style={[styles.eye, fieldStyles.eye]}>{hidden ? '⊙' : '◉'}</Text>
        </Pressable>
      )}
    </View>
  )
}
