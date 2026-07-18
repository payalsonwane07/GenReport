import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
  theme?: 'light' | 'dark' | 'auto'
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User, remember?: boolean) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load token and user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser: User, remember = true) => {
    setToken(newToken)
    setUser(newUser)
    const storage = remember ? localStorage : sessionStorage
    storage.setItem('authToken', newToken)
    storage.setItem('user', JSON.stringify(newUser))
    if (newUser.theme) {
      storage.setItem('themePreference', newUser.theme)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
