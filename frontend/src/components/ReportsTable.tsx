import React, { useState } from 'react'
import {
  Eye, Trash2, Link2, Check, Loader2, XCircle, Clock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Report, reportsAPI } from '../services/api'
import DownloadDropdown from './DownloadDropdown'

interface ReportsTableProps {
  reports: Report[]
  onDelete: (id: string) => void
  onRefresh: () => void
}

function StatusBadge({ status }: { status: Report['status'] }) {
  const config = {
    Completed: { icon: Check, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    Pending: { icon: Loader2, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    Failed: { icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  }[status] || { icon: Clock, className: 'bg-gray-100 text-gray-600' }

  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon size={12} className={status === 'Pending' ? 'animate-spin' : ''} />
      {status}
    </span>
  )
}

export default function ReportsTable({ reports, onDelete, onRefresh }: ReportsTableProps) {
  const { token } = useAuth()
  const [preview, setPreview] = useState<Report | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

  const formatSize = (bytes: number) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Delete this report?')) return
    setDeleting(id)
    try {
      await reportsAPI.delete(id, token)
      onDelete(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const handlePreview = async (report: Report) => {
    if (!token) return
    try {
      const full = await reportsAPI.get(report.reportId, token)
      setPreview(full)
    } catch {
      setPreview(report)
    }
  }

  const handleCopyLink = async (report: Report) => {
    if (!token) return
    try {
      const { link } = await reportsAPI.createDownloadLink(report.reportId, 'pdf', token)
      await navigator.clipboard.writeText(link)
      setCopied(report.reportId)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to copy link')
    }
  }

  if (!reports.length) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">No reports yet. Upload a file to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Report</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Created</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Size</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.reportId}
                  className="border-b border-border-light dark:border-border-dark last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                      {report.name || report.fileName}
                    </p>
                    {report.fileType && (
                      <p className="text-xs text-gray-400">{report.fileType}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {formatDate(report.createdAt || report.generatedDate || '')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {report.fileSizeFormatted || formatSize(report.fileSize)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <DownloadDropdown
                        reportId={report.reportId}
                        reportName={report.name || report.fileName}
                        disabled={report.status !== 'Completed'}
                      />
                      <button
                        onClick={() => handlePreview(report)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleCopyLink(report)}
                        disabled={report.status !== 'Completed'}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40"
                        title="Copy download link"
                      >
                        {copied === report.reportId ? <Check size={16} className="text-green-500" /> : <Link2 size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(report.reportId)}
                        disabled={deleting === report.reportId}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setPreview(null)}>
          <div className="card max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Report Preview</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd>{preview.name || preview.fileName}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><StatusBadge status={preview.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Type</dt><dd>{preview.fileType || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Downloads</dt><dd>{preview.downloadCount}</dd></div>
              {preview.analytics && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Rows</dt>
                  <dd>{(preview.analytics as { rowCount?: number }).rowCount ?? '—'}</dd>
                </div>
              )}
              {preview.errorMessage && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-600 text-xs">{preview.errorMessage}</div>
              )}
            </dl>
            <button onClick={() => setPreview(null)} className="btn-secondary mt-4 w-full">Close</button>
          </div>
        </div>
      )}
    </>
  )
}
