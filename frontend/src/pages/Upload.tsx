import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { reportsAPI } from '../services/api'
import FileUploader from '../components/FileUploader'

export default function Upload() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadedReportId, setUploadedReportId] = useState<string | null>(null)

  const handleUpload = async (files: File[]) => {
    if (!token) {
      setError('Not authenticated')
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)
    setSuccess(null)
    setUploadedReportId(null)

    try {
      const result = await reportsAPI.upload(files, token, setProgress)
      
      if (result.success || result.data) {
        const uploadedData = result.data || result.saved || []
        setSuccess(`${files.length} file(s) uploaded successfully! Processing in progress...`)
        
        // Get the first report ID and redirect after 2 seconds
        if (uploadedData.length > 0) {
          const reportId = uploadedData[0]._id || uploadedData[0].id
          setUploadedReportId(reportId)
          
          setTimeout(() => {
            navigate(`/analysis/${reportId}`)
          }, 2000)
        }
      } else {
        setError(result.message || 'Upload failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Dataset</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Upload CSV, Excel, or JSON files to generate interactive reports with analysis and charts
        </p>
      </div>

      <div className="card p-8">
        <FileUploader
          onUpload={handleUpload}
          uploading={uploading}
          progress={progress}
          error={error}
          onClearError={() => setError(null)}
        />
      </div>

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          <p className="font-medium">{success}</p>
          {uploadedReportId && (
            <p className="text-sm mt-2">Redirecting to analysis page...</p>
          )}
        </div>
      )}
    </div>
  )
}
