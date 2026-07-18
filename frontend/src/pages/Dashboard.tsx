import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { reportsAPI } from '../services/api'
import { Upload, FileText, Settings, Loader, Trash2, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
  })

  useEffect(() => {
    if (!token) return

    const loadData = async () => {
      try {
        setLoading(true)
        const data = await reportsAPI.listReports(token)
        const reportsList = data.data || data
        setReports(reportsList)

        // Calculate stats
        const newStats = {
          total: reportsList.length,
          completed: reportsList.filter((r: any) => r.status === 'completed').length,
          processing: reportsList.filter((r: any) => r.status === 'pending' || r.status === 'processing').length,
          failed: reportsList.filter((r: any) => r.status === 'failed').length,
        }
        setStats(newStats)
      } catch (err) {
        console.error('Failed to load reports:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [token])

  const handleDelete = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!window.confirm('Are you sure you want to delete this report?')) return

    try {
      setDeleting(reportId)
      setError(null)
      await reportsAPI.deleteReport(reportId, token!)
      
      // Remove from local state and update stats
      const updatedReports = reports.filter(r => (r._id ?? r.id) !== reportId)
      setReports(updatedReports)
      
      // Recalculate stats
      setStats({
        total: updatedReports.length,
        completed: updatedReports.filter((r: any) => r.status === 'completed').length,
        processing: updatedReports.filter((r: any) => r.status === 'pending' || r.status === 'processing').length,
        failed: updatedReports.filter((r: any) => r.status === 'failed').length,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report')
    } finally {
      setDeleting(null)
    }
  }

  const recentReports = reports.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'User'}!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and generate your reports with ease
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/upload')}
          className="card p-6 hover:shadow-lg transition-shadow text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <Upload className="h-8 w-8 text-accent group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="font-semibold text-lg">Upload New File</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload CSV, Excel, or JSON files
          </p>
        </button>

        <button
          onClick={() => navigate('/reports')}
          className="card p-6 hover:shadow-lg transition-shadow text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <FileText className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="font-semibold text-lg">View Reports</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Access all your generated reports
          </p>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="card p-6 hover:shadow-lg transition-shadow text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <Settings className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="font-semibold text-lg">Settings</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your account preferences
          </p>
        </button>
      </div>

      {/* Statistics */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Reports</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-2">All time</p>
            </div>

            <div className="card p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{stats.completed}</p>
              <p className="text-xs text-gray-400 mt-2">Ready to download</p>
            </div>

            <div className="card p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Processing</p>
              <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.processing}</p>
              <p className="text-xs text-gray-400 mt-2">In progress</p>
            </div>

            <div className="card p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{stats.failed}</p>
              <p className="text-xs text-gray-400 mt-2">Need attention</p>
            </div>
          </div>

          {/* Recent Reports */}
          {recentReports.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
              <div className="space-y-3">
                {recentReports.map((report) => {
                  const reportId = report._id ?? report.id ?? report.reportId
                  const isCompleted = report.status === 'completed'

                  return (
                    <div
                      key={reportId}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/analysis/${reportId}`)}
                    >
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {report.fileType?.toUpperCase()} • {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isCompleted
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                        <button
                          onClick={(e) => handleDelete(reportId, e)}
                          disabled={deleting === reportId}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                          title="Delete report"
                        >
                          {deleting === reportId ? (
                            <Loader size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {stats.total === 0 && (
            <div className="card p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No reports yet</p>
              <button
                onClick={() => navigate('/upload')}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
              >
                Create Your First Report
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
