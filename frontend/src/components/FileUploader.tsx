import React, { useCallback, useRef, useState } from 'react'
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react'

const ACCEPTED = '.csv,.xlsx,.xls,.json'
const ACCEPTED_LABEL = 'CSV, Excel, or JSON'

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>
  uploading?: boolean
  progress?: number
  error?: string | null
  onClearError?: () => void
}

export default function FileUploader({
  onUpload,
  uploading = false,
  progress = 0,
  error,
  onClearError,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [localError, setLocalError] = useState<string | null>(null)

  const validateFiles = (files: FileList | File[]) => {
    const arr = Array.from(files)
    const valid = arr.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase()
      return ['csv', 'xlsx', 'xls', 'json'].includes(ext || '')
    })
    if (valid.length < arr.length) {
      throw new Error(`Only ${ACCEPTED_LABEL} files are supported`)
    }
    if (valid.length === 0) throw new Error('No valid files selected')
    return valid
  }

  const handleFiles = useCallback((files: FileList | File[]) => {
    try {
      onClearError?.()
      setLocalError(null)
      const valid = validateFiles(files)
      setSelectedFiles(valid)
    } catch (e) {
      setSelectedFiles([])
      setLocalError(e instanceof Error ? e.message : 'Invalid file')
    }
  }, [onClearError])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    handleFiles(e.target.files)
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!selectedFiles.length) return
    await onUpload(selectedFiles)
    setSelectedFiles([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
          ${dragOver
            ? 'border-accent dark:border-accent-dark bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
            : 'border-border-light dark:border-border-dark hover:border-accent dark:hover:border-accent-dark hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
          ${uploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={onFileChange}
          disabled={uploading}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/40">
            <Upload size={32} className="text-accent dark:text-accent-dark" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Drag & drop your files here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              or click to browse — {ACCEPTED_LABEL}
            </p>
          </div>
        </div>
      </div>

      {(error || localError) && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle size={18} />
          <span className="text-sm">{error || localError}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="card p-4 space-y-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Selected files</p>
          {selectedFiles.map((f, i) => (
            <div key={`${f.name}-${i}`} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet size={18} className="text-accent dark:text-accent-dark shrink-0" />
                <span className="text-sm truncate">{f.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{formatSize(f.size)}</span>
              </div>
              {!uploading && (
                <button onClick={() => removeFile(i)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent dark:bg-accent-dark rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedFiles.length || uploading}
        className="btn-primary w-full sm:w-auto"
      >
        {uploading ? 'Uploading...' : `Upload & Generate Report${selectedFiles.length > 1 ? 's' : ''}`}
      </button>
    </div>
  )
}
