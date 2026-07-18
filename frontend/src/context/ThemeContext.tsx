import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { userAPI } from '../services/api'

export type ThemePreference = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  preference: ThemePreference
  resolvedTheme: 'light' | 'dark'
  setPreference: (theme: ThemePreference) => void
  toggleTheme: () => void
  savePreference: () => Promise<void>
  isSaving: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'themePreference'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'auto') return getSystemTheme()
  return preference
}

function applyThemeClass(theme: 'light' | 'dark') {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null
    return stored || 'auto'
  })
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(preference)
  )
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const resolved = resolveTheme(preference)
    setResolvedTheme(resolved)
    applyThemeClass(resolved)
    localStorage.setItem(STORAGE_KEY, preference)
  }, [preference])

  useEffect(() => {
    if (preference !== 'auto') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const resolved = resolveTheme('auto')
      setResolvedTheme(resolved)
      applyThemeClass(resolved)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preference])

  useEffect(() => {
    if (!token) return
    userAPI.getTheme(token).then((data) => {
      if (data.theme) setPreferenceState(data.theme)
    }).catch(() => {})
  }, [token])

  const setPreference = useCallback((theme: ThemePreference) => {
    setPreferenceState(theme)
  }, [])

  const toggleTheme = useCallback(() => {
    setPreferenceState((prev) => {
      const current = resolveTheme(prev)
      return current === 'dark' ? 'light' : 'dark'
    })
  }, [])

  const savePreference = useCallback(async () => {
    if (!token) return
    setIsSaving(true)
    try {
      await userAPI.saveTheme(preference, token)
    } finally {
      setIsSaving(false)
    }
  }, [token, preference])

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference, toggleTheme, savePreference, isSaving }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
