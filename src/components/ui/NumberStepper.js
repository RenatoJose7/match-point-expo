import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text, TextInput } from '../accessibility/AppText'

const BLUE = '#10579b'

export function toCount(value) {
  const number = Number(String(value ?? '').replace(/\D/g, ''))
  return Number.isFinite(number) ? number : 0
}

// Número inteiro com botões − e + (toque grande) e digitação só de dígitos.
export function NumberStepper({ label, value, onChange, min = 0, max = 999 }) {
  const current = toCount(value)
  const set = (next) => onChange(Math.max(min, Math.min(max, next)))
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Diminuir ${label}`} disabled={current <= min} onPress={() => set(current - 1)} style={[styles.button, current <= min && styles.disabled]}>
        <Ionicons name="remove" size={22} color={BLUE} />
      </Pressable>
      <TextInput
        accessibilityLabel={label}
        value={String(current)}
        onChangeText={(text) => set(toCount(text))}
        keyboardType="number-pad"
        maxLength={3}
        style={styles.input}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar ${label}`} disabled={current >= max} onPress={() => set(current + 1)} style={[styles.button, current >= max && styles.disabled]}>
        <Ionicons name="add" size={22} color={BLUE} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  button: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#b9cbe0', backgroundColor: '#ffffff' },
  disabled: { opacity: 0.4 },
  input: { minWidth: 64, height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#c8d5d8', backgroundColor: '#ffffff', textAlign: 'center', color: '#17313c', fontFamily: 'Poppins_600SemiBold', fontSize: 18 },
})
