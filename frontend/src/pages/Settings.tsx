import React from 'react'
import { Sun, Moon, Monitor, Check, Loader2 } from 'lucide-react'
import { useTheme, ThemePreference } from '../context/ThemeContext'

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light Mode', icon: Sun, description: 'Bright backgrounds with dark text' },
  { value: 'dark', label: 'Dark Mode', icon: Moon, description: 'Dark backgrounds with light text' },
  { value: 'auto', label: 'System', icon: Monitor, description: 'Follow your OS preference' },
]

export default function Settings() {
  const { preference, resolvedTheme, setPreference, savePreference, isSaving } = useTheme()

  const handleSave = async () => {
    try {
      await savePreference()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save settings')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Customize your ReportGen experience</p>
      </div>

      <section className="card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Theme</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose how ReportGen looks. Changes apply instantly.
          </p>
        </div>

        <div className="grid gap-3">
          {THEME_OPTIONS.map(({ value, label, icon: Icon, description }) => {
            const selected = preference === value
            return (
              <button
                key={value}
                onClick={() => setPreference(value)}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                  ${selected
                    ? 'border-accent dark:border-accent-dark bg-accent/5 dark:bg-accent-dark/10'
                    : 'border-border-light dark:border-border-dark hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className={`p-3 rounded-lg ${selected ? 'bg-accent/20 dark:bg-accent-dark/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Icon size={22} className={selected ? 'text-accent dark:text-accent-dark' : 'text-gray-500'} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
                {selected && <Check size={20} className="text-accent dark:text-accent-dark" />}
              </button>
            )
          })}
        </div>

        <div
          className={`p-6 rounded-xl border border-border-light dark:border-border-dark transition-theme ${
            resolvedTheme === 'dark'
              ? 'bg-surface-darker text-gray-100'
              : 'bg-white text-gray-900'
          }`}
        >
          <p className="text-sm font-medium mb-2">Preview</p>
          <div className="flex gap-3">
            <div className={`flex-1 p-3 rounded-lg ${resolvedTheme === 'dark' ? 'bg-surface-dark' : 'bg-surface-muted'}`}>
              <p className="text-xs opacity-60">Card</p>
              <p className="font-semibold mt-1">Sample Report</p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-accent dark:bg-accent-dark text-white text-sm self-center">
              Button
            </div>
          </div>
          <p className="text-xs mt-3 opacity-50">
            Active: {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
            {preference === 'auto' && ' (from system)'}
          </p>
        </div>

        <button onClick={handleSave} disabled={isSaving} className="btn-primary inline-flex items-center gap-2">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
          Save to account
        </button>
      </section>
    </div>
  )
}
