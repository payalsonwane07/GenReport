import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { reportsAPI } from '../services/api'
import Chatbot from '../components/Chatbot'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Download, Loader, AlertCircle, ArrowLeft } from 'lucide-react'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'];

export default function Analysis() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !token) return

    const loadReport = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await reportsAPI.getReport(id, token)
        setReport(data.data || data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [id, token])

  const handleDownloadPdf = async () => {
    if (!id || !token) return
    try {
      setDownloadingPdf(true)
      await reportsAPI.downloadReport(id, token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-accent mx-auto mb-2" />
          <p>Loading report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600">Report not found</p>
      </div>
    )
  }

  const analytics = report.analytics || {}
  const charts = analytics.charts || {}
  const barChart = charts.barChart || []
  const lineChart = charts.lineChart || []
  const pieChart = charts.pieChart || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reports')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{report.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            report.status === 'completed'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
              : report.status === 'failed'
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Rows</p>
          <p className="text-2xl font-bold">{analytics.totalRows || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Columns</p>
          <p className="text-2xl font-bold">{analytics.totalColumns || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">File Type</p>
          <p className="text-2xl font-bold">{report.fileType?.toUpperCase() || 'N/A'}</p>
        </div>
        <div className="card p-4">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || report.status !== 'completed'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingPdf ? (
              <>
                <Loader size={16} className="animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={16} />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        {barChart.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Category Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie Chart */}
        {pieChart.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChart.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Line Chart */}
      {lineChart.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Trend Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" name="Value" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Statistics Section */}
      {analytics.numericStats && Object.keys(analytics.numericStats).length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Numeric Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Column</th>
                  <th className="px-4 py-2 text-right">Min</th>
                  <th className="px-4 py-2 text-right">Max</th>
                  <th className="px-4 py-2 text-right">Average</th>
                  <th className="px-4 py-2 text-right">Sum</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.numericStats).map(([col, stats]: [string, any]) => (
                  <tr key={col} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{col}</td>
                    <td className="px-4 py-2 text-right">{stats.min?.toFixed(2) || 'N/A'}</td>
                    <td className="px-4 py-2 text-right">{stats.max?.toFixed(2) || 'N/A'}</td>
                    <td className="px-4 py-2 text-right">{stats.avg?.toFixed(2) || 'N/A'}</td>
                    <td className="px-4 py-2 text-right">{stats.sum?.toFixed(2) || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Preview */}
      {report.parsedData && report.parsedData.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Data Preview (First 20 Rows)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {Object.keys(report.parsedData[0]).slice(0, 10).map((col) => (
                    <th key={col} className="px-4 py-2 text-left">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.parsedData.slice(0, 20).map((row: any, idx: number) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                    {Object.values(row).slice(0, 10).map((val: any, i: number) => (
                      <td key={i} className="px-4 py-2">{String(val).substring(0, 20)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chatbot Section */}
      {id && <Chatbot reportId={id} />}
    </div>
  )
}
