import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRealtimeReviews } from '../hooks/useRealtimeReviews'
import { reviewsApi } from '../lib/api'
import LiveFeed from '../components/LiveFeed'
import StatCard from '../components/StatCard'

export default function ManagerDashboard() {
  const { user, signOut, loading: authLoading, restaurantId } = useAuth()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
    if (user && user.role !== 'manager') {
      navigate('/owner')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (restaurantId) {
      loadData()
    }
  }, [restaurantId])

  const loadData = async () => {
    try {
      const reviewsData = await reviewsApi.list({
        restaurant_id: restaurantId,
        limit: 100,
      })
      setReviews(reviewsData.data || [])
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const liveReviews = useRealtimeReviews(reviews)

  const filteredReviews = liveReviews.filter((r) => {
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    return true
  })

  const stats = {
    total: reviews.length,
    open: reviews.filter((r) => r.status === 'open').length,
    critical: reviews.filter((r) => r.severity === 'critical' && r.status !== 'resolved').length,
    resolved: reviews.filter((r) => r.status === 'resolved').length,
  }

  if (authLoading || !user) return null

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-accent">RestroWatch</h1>
          <div>
            <span className="text-sm text-gray-300">{user.name}</span>
            <span className="text-xs text-gray-500 ml-2">Manager</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="text-sm text-gray-400 hover:text-white"
          >
            Settings
          </button>
          <button
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-critical"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Restaurant Header */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold">{user.restaurant_name || 'Your Restaurant'}</h2>
          <div className="grid grid-cols-4 gap-4 mt-3">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Open" value={stats.open} color="critical" />
            <StatCard label="Critical" value={stats.critical} color="critical" />
            <StatCard label="Resolved" value={stats.resolved} color="low" />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400 mr-2">Severity:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterSeverity === s
                  ? 'bg-accent text-white'
                  : 'bg-card border border-border text-gray-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="text-sm text-gray-400 ml-4 mr-2">Status:</span>
          {['all', 'open', 'in_progress', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-accent text-white'
                  : 'bg-card border border-border text-gray-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Live Review Feed */}
        <LiveFeed reviews={filteredReviews} loading={loading} />
      </main>
    </div>
  )
}
