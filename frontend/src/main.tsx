import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const storedTheme = localStorage.getItem('themePreference')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = storedTheme === 'dark' || (storedTheme !== 'light' && prefersDark)
if (isDark) document.documentElement.classList.add('dark')

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
