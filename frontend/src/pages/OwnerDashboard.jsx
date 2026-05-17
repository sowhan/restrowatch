import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRealtimeReviews } from '../hooks/useRealtimeReviews'
import { useToast } from '../components/Toast'
import { reviewsApi, settingsApi } from '../lib/api'
import LiveFeed from '../components/LiveFeed'
import RestaurantRow from '../components/RestaurantRow'
import StatCard from '../components/StatCard'

export default function OwnerDashboard() {
  const { user, signOut, loading: authLoading } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [overview, setOverview] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [filterRestaurant, setFilterRestaurant] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
    if (user && user.role !== 'owner') {
      navigate('/manager')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setError(null)
      const [overviewData, reviewsData] = await Promise.all([
        settingsApi.getOverview(),
        reviewsApi.list({ limit: 100 }),
      ])
      setOverview(overviewData.data)
      setReviews(reviewsData.data || [])
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setError('Failed to load dashboard data')
      addToast('Failed to load dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const liveReviews = useRealtimeReviews(reviews)

  const filteredReviews = liveReviews.filter((r) => {
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false
    if (filterPlatform !== 'all' && r.platform !== filterPlatform) return false
    if (filterRestaurant !== 'all' && r.restaurant_id !== filterRestaurant) return false
    return true
  })

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (a.status === 'open' && b.status !== 'open') return -1
    if (a.status !== 'open' && b.status === 'open') return 1
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
  })

  if (authLoading || !user) return null

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-accent">RestroWatch</h1>
          <span className="text-sm text-gray-400">Owner Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">{user.name || user.email}</span>
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

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="flex items-center gap-2 text-critical text-sm bg-critical/10 border border-critical/20 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={loadData} className="ml-auto text-xs underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                <div className="h-3 bg-border rounded w-20 mb-3" />
                <div className="h-6 bg-border rounded w-12" />
              </div>
            ))}
          </div>
        ) : overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Reviews" value={overview.total_reviews} icon="📊" />
            <StatCard label="Critical" value={overview.critical_count} icon="🔴" color="critical" />
            <StatCard label="Avg Response" value={`${overview.avg_response_time}m`} icon="⏱️" />
            <StatCard label="Resolved Today" value={overview.resolved_today} icon="✅" color="low" />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-border rounded w-24 mb-3" />
                <div className="h-3 bg-border rounded w-16" />
              </div>
            ))}
          </div>
        ) : overview?.restaurants && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Restaurant Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {overview.restaurants.map((r) => (
                <RestaurantRow key={r.restaurant_id} restaurant={r} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
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
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400 mr-2">Platform:</span>
            {['all', 'swiggy', 'zomato'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPlatform(p)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filterPlatform === p
                    ? 'bg-accent text-white'
                    : 'bg-card border border-border text-gray-400 hover:text-white'
                }`}
              >
                {p === 'all' ? 'Both' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">
            Live Review Feed
            <span className="text-sm text-gray-500 font-normal ml-2">
              ({sortedReviews.length} reviews)
            </span>
          </h2>
          <LiveFeed reviews={sortedReviews} loading={loading} />
        </div>
      </main>
    </div>
  )
}
