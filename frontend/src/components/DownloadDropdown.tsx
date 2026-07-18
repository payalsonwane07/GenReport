import React, { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown, FileText, Sheet, Table2, Archive } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { reportsAPI } from '../services/api'

interface DownloadDropdownProps {
  reportId: string
  reportName: string
  disabled?: boolean
}

const FORMATS = [
  { key: 'pdf', label: 'PDF', icon: FileText, ext: 'pdf' },
  { key: 'excel', label: 'Excel (.xlsx)', icon: Sheet, ext: 'xlsx' },
  { key: 'csv', label: 'CSV (.csv)', icon: Table2, ext: 'csv' },
  { key: 'zip', label: 'All formats (.zip)', icon: Archive, ext: 'zip' },
] as const

export default function DownloadDropdown({ reportId, reportName, disabled }: DownloadDropdownProps) {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDownload = async (format: string, ext: string) => {
    if (!token || disabled) return
    setDownloading(format)
    try {
      const blob = await reportsAPI.download(reportId, format, token)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportName.replace(/\.[^.]+$/, '')}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(null)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent dark:bg-accent-dark text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        <Download size={14} />
        Download
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 z-20 card py-1 shadow-lg">
          {FORMATS.map(({ key, label, icon: Icon, ext }) => (
            <button
              key={key}
              onClick={() => handleDownload(key, ext)}
              disabled={!!downloading}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon size={16} className="text-accent dark:text-accent-dark" />
              {downloading === key ? 'Downloading...' : label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
