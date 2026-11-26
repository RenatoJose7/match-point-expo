import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Preferências de acessibilidade do MatchPoint, guardadas no aparelho.
// Valem para a web e para o APK: nada aqui depende de biblioteca nativa nova.
const STORAGE_KEY = 'matchpoint:acessibilidade:v1'

export const TEXT_SIZES = Object.freeze([
  { key: 'padrao', label: 'Padrão', short: 'A', scale: 1 },
  { key: 'grande', label: 'Grande', short: 'A+', scale: 1.15 },
  { key: 'extra', label: 'Extra grande', short: 'A++', scale: 1.3 },
])

export const DEFAULT_SETTINGS = Object.freeze({
  textSize: 'padrao',
  boldText: false,
  highContrast: false,
  reduceMotion: false,
  lineSpacing: false,
})

const AccessibilityContext = createContext({
  settings: DEFAULT_SETTINGS,
  textScale: 1,
  active: false,
  screenReaderOn: false,
  update: () => {},
  reset: () => {},
  panelOpen: false,
  openPanel: () => {},
  closePanel: () => {},
})

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [screenReaderOn, setScreenReaderOn] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  // Carrega o que a pessoa escolheu antes. Sem escolha salva, segue o "remover animações" do sistema.
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY)
        if (!active) return
        if (saved) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
          return
        }
        const systemReduceMotion = await AccessibilityInfo.isReduceMotionEnabled?.()
        if (active && systemReduceMotion) setSettings((current) => ({ ...current, reduceMotion: true }))
      } catch {
        // Sem armazenamento disponível, o app segue com o padrão.
      }
    }
    load()
    return () => { active = false }
  }, [])

  // Acompanha se o leitor de tela (TalkBack/VoiceOver) está ligado, para mostrar no painel.
  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isScreenReaderEnabled?.().then((enabled) => { if (mounted) setScreenReaderOn(Boolean(enabled)) }).catch(() => {})
    const subscription = AccessibilityInfo.addEventListener?.('screenReaderChanged', (enabled) => setScreenReaderOn(Boolean(enabled)))
    return () => {
      mounted = false
      subscription?.remove?.()
    }
  }, [])

  const persist = useCallback((next) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {})
  }, [])

  const update = useCallback((changes, announcement) => {
    setSettings((current) => {
      const next = { ...current, ...changes }
      persist(next)
      return next
    })
    if (announcement && Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility?.(announcement)
  }, [persist])

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    persist(DEFAULT_SETTINGS)
    if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility?.('Acessibilidade restaurada para o padrão.')
  }, [persist])

  const value = useMemo(() => {
    const textScale = TEXT_SIZES.find((item) => item.key === settings.textSize)?.scale ?? 1
    return {
      settings,
      textScale,
      active: textScale !== 1 || settings.boldText || settings.highContrast || settings.lineSpacing,
      screenReaderOn,
      update,
      reset,
      panelOpen,
      openPanel: () => setPanelOpen(true),
      closePanel: () => setPanelOpen(false),
    }
  }, [panelOpen, reset, screenReaderOn, settings, update])

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

export function useAccessibility() {
  return useContext(AccessibilityContext)
}

// Atalho para componentes que só precisam saber se devem animar.
export function useReduceMotion() {
  return useContext(AccessibilityContext).settings.reduceMotion
}
