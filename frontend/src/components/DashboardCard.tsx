import React from 'react'
import { LucideIcon } from 'lucide-react'

interface DashboardCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  accent?: string
}

export default function DashboardCard({ title, value, subtitle, icon: Icon, accent }: DashboardCardProps) {
  return (
    <div className="card card-hover p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: accent ? `${accent}20` : 'rgba(59,130,246,0.15)' }}
        >
          <Icon
            size={24}
            style={{ color: accent || '#3B82F6' }}
            className="dark:text-accent-dark"
          />
        </div>
      </div>
    </div>
  )
}
