import React, { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { styles } from '../../theme/styles'

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
    <View style={styles.field}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#d4e1ef"
        secureTextEntry={hidden}
        style={styles.input}
        autoCapitalize={autoCapitalize}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
      {secureTextEntry && (
        <Pressable onPress={() => setHidden(value => !value)} hitSlop={12}>
          <Text style={styles.eye}>{hidden ? '⊙' : '◉'}</Text>
        </Pressable>
      )}
    </View>
  )
}
