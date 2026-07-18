import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { reportsAPI } from '../services/api'
import { Download, Trash2, Eye, Loader, AlertCircle, Calendar } from 'lucide-react'

export default function Reports() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    loadReports()
  }, [token])

  const loadReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportsAPI.listReports(token!)
      setReports(data.data || data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return

    try {
      setDeleting(id)
      await reportsAPI.deleteReport(id, token!)
      setReports(reports.filter(r => r._id !== id && r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = async (id: string) => {
    try {
      setDownloading(id)
      await reportsAPI.downloadReport(id, token!)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download report')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-accent mx-auto mb-2" />
          <p>Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your generated reports and download PDF files
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-sm hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No reports yet. Start by uploading a file on the Upload page.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
          >
            Upload First File
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const reportId = report._id || report.id
            const isCompleted = report.status === 'completed'
            const isFailed = report.status === 'failed'

            return (
              <div
                key={reportId}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg truncate">{report.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar size={14} />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                    isCompleted
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                      : isFailed
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {report.fileType} • {report.fileName}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/analysis/${reportId}`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                    title="View details and charts"
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => handleDownload(reportId)}
                    disabled={!isCompleted || downloading === reportId}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    title={isCompleted ? 'Download PDF' : 'Report not ready'}
                  >
                    {downloading === reportId ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    <span>{downloading === reportId ? 'Downloading...' : 'Download'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(reportId)}
                    disabled={deleting === reportId}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    title="Delete report"
                  >
                    {deleting === reportId ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
