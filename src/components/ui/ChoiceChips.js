import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../accessibility/AppText'

const BLUE = '#10579b'

// Valores de múltipla escolha ficam como lista; dados antigos em texto ("a, b") também são lidos.
export function toList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return String(value ?? '').split(/\s*[,;\n]\s*/).map((item) => item.trim()).filter(Boolean)
}

// Opção pode ser texto simples ou { value, label } (ex.: códigos de documento).
function normalizeOption(option) {
  return typeof option === 'string' ? { value: option, label: option } : option
}

// Múltipla escolha em "chips": toque grande (48 px), estado lido pelo leitor de tela.
export function ChoiceChips({ label, options, value, onChange, max }) {
  const selected = toList(value)
  const toggle = (optionValue) => {
    const isOn = selected.includes(optionValue)
    if (!isOn && max && selected.length >= max) return
    onChange(isOn ? selected.filter((item) => item !== optionValue) : [...selected, optionValue])
  }

  return (
    <View accessibilityRole="list" accessibilityLabel={label} style={styles.wrap}>
      {options.map(normalizeOption).map((option) => {
        const on = selected.includes(option.value)
        return (
          <Pressable
            key={option.value}
            accessibilityRole="checkbox"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: on }}
            onPress={() => toggle(option.value)}
            style={[styles.chip, on && styles.chipOn]}
          >
            {on ? <Ionicons name="checkmark" size={16} color="#ffffff" /> : null}
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{option.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1.5, borderColor: '#b9cbe0', backgroundColor: '#ffffff' },
  chipOn: { backgroundColor: BLUE, borderColor: BLUE },
  chipText: { color: BLUE, fontFamily: 'Poppins_500Medium', fontSize: 14 },
  chipTextOn: { color: '#ffffff' },
})
