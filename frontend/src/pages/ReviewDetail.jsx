import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { reviewsApi } from '../lib/api'
import { useToast } from '../components/Toast'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import PlatformBadge from '../components/PlatformBadge'
import SLATimer from '../components/SLATimer'
import ActionLogger from '../components/ActionLogger'
import { formatStars, formatTimeAgo, formatDateTime, formatFullDate } from '../utils/formatters'

export default function ReviewDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [review, setReview] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setError(null)
      setLoading(true)
      const [reviewData, timelineData] = await Promise.all([
        reviewsApi.get(id),
        reviewsApi.getTimeline(id),
      ])
      setReview(reviewData.data)
      setTimeline(timelineData.data || [])
    } catch (err) {
      console.error('Failed to load review:', err)
      setError('Failed to load review details')
      addToast('Failed to load review details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleActionLogged = () => {
    loadData()
    addToast('Action logged successfully', 'success')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-gray-400 text-sm">Loading review...</span>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">{error || 'Review not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-3 text-accent text-sm hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  const restaurant = review.restaurants || {}
  const detailRows = [
    { label: 'Review ID', value: review.id },
    { label: 'Order Number', value: review.order_id ? `#${review.order_id}` : null },
    { label: 'Customer', value: review.customer_name || null },
    { label: 'Restaurant', value: restaurant.name || null },
    { label: 'City', value: restaurant.city || null },
    { label: 'Cuisine', value: restaurant.cuisine || null },
    { label: 'Platform', value: review.platform ? review.platform.charAt(0).toUpperCase() + review.platform.slice(1) : null },
    { label: 'Rating', value: review.rating ? `${review.rating}/5` : null },
    { label: 'Severity', value: review.severity ? review.severity.charAt(0).toUpperCase() + review.severity.slice(1) : null },
    { label: 'Status', value: review.status ? review.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null },
    { label: 'Email Received', value: formatFullDate(review.email_received_at) || null },
    { label: 'Detected', value: formatFullDate(review.detected_at) || null },
    { label: 'First Viewed', value: formatFullDate(review.first_viewed_at) || null },
    { label: 'First Action', value: formatFullDate(review.first_action_at) || null },
    { label: 'Resolved', value: formatFullDate(review.resolved_at) || null },
    { label: 'Created', value: formatFullDate(review.created_at) || null },
  ].filter((item) => item.value)

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <SeverityBadge severity={review.severity} />
          <span className="font-semibold">{restaurant.name}</span>
          <PlatformBadge platform={review.platform} />
          <span className="text-yellow-400">{formatStars(review.rating)}</span>
          <StatusBadge status={review.status} />
        </div>
        <div className="w-16" />
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
            {detailRows.map((item) => (
              <div key={item.label}>
                <span className="text-gray-500">{item.label}:</span>
                <span className="ml-2 text-white">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-bg border border-border rounded-lg p-4">
            <p className="text-gray-200 whitespace-pre-wrap">{review.review_text || 'No review text available'}</p>
          </div>

          {review.status === 'open' && (
            <div className="mt-4">
              <SLATimer severity={review.severity} detectedAt={review.detected_at} />
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wide">Timeline</h3>
          {timeline.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No events recorded yet</p>
          ) : (
            <div className="space-y-3">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {review.status !== 'resolved' && (
          <ActionLogger reviewId={review.id} review={review} onActionLogged={handleActionLogged} />
        )}
      </main>
    </div>
  )
}
