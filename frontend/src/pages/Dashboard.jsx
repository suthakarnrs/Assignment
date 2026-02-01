import { useState } from 'react'
import { useQuery } from 'react-query'
import { format, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { dashboardAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'

const COLORS = {
  matched: '#22c55e',
  partially_matched: '#f59e0b',
  not_matched: '#ef4444',
  duplicate: '#8b5cf6'
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState({
    dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd')
  })

  const { data: summary, isLoading: summaryLoading } = useQuery(
    ['dashboard-summary', dateRange],
    () => dashboardAPI.getSummary(dateRange),
    { refetchInterval: 30000 }
  )

  const { data: trends, isLoading: trendsLoading } = useQuery(
    ['dashboard-trends', dateRange],
    () => dashboardAPI.getTrends(dateRange),
    { refetchInterval: 60000 }
  )

  const { data: activity } = useQuery(
    ['dashboard-activity'],
    () => dashboardAPI.getActivity({ limit: 5 }),
    { refetchInterval: 30000 }
  )

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const summaryData = summary?.data
  const trendsData = trends?.data
  const activityData = activity?.data

  // Prepare chart data
  const reconciliationData = [
    { name: 'Matched', value: summaryData?.reconciliation?.matched || 0, color: COLORS.matched },
    { name: 'Partially Matched', value: summaryData?.reconciliation?.partially_matched || 0, color: COLORS.partially_matched },
    { name: 'Not Matched', value: summaryData?.reconciliation?.not_matched || 0, color: COLORS.not_matched },
    { name: 'Duplicates', value: summaryData?.reconciliation?.duplicate || 0, color: COLORS.duplicate },
  ]

  const accuracyTrends = trendsData?.reconciliationTrends?.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    accuracy: item.accuracy,
    total: item.total
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        
        {/* Date Range Filter */}
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">From</label>
            <input
              type="date"
              value={dateRange.dateFrom}
              onChange={(e) => setDateRange(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">To</label>
            <input
              type="date"
              value={dateRange.dateTo}
              onChange={(e) => setDateRange(prev => ({ ...prev, dateTo: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Records</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {summaryData?.uploads?.totalRecords?.toLocaleString() || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Matched Records</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {summaryData?.reconciliation?.matched?.toLocaleString() || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Unmatched Records</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {summaryData?.reconciliation?.not_matched?.toLocaleString() || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {summaryData?.reconciliation?.accuracy || 0}%
                </span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Accuracy</dt>
                <dd className="text-lg font-medium text-gray-900">
                  Reconciliation Rate
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reconciliation Status Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reconciliation Status</h3>
          {reconciliationData.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reconciliationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reconciliationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No reconciliation data available
            </div>
          )}
        </div>

        {/* Accuracy Trends */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Accuracy Trends</h3>
          {trendsLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : accuracyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accuracyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, 'Accuracy']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar dataKey="accuracy" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {activityData?.recentUploads?.length > 0 ? (
            activityData.recentUploads.map((upload) => (
              <div key={upload._id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{upload.originalName}</p>
                    <p className="text-sm text-gray-500">
                      Uploaded by {upload.uploadedBy.username} • {upload.processedRecords} records processed
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    upload.status === 'completed' ? 'bg-green-100 text-green-800' :
                    upload.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {upload.status}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {format(new Date(upload.createdAt), 'MMM dd, HH:mm')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  )
}