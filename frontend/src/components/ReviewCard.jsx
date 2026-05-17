import { useNavigate } from 'react-router-dom'
import { formatStars, formatTimeAgo } from '../utils/formatters'
import SeverityBadge from './SeverityBadge'
import StatusBadge from './StatusBadge'
import PlatformBadge from './PlatformBadge'
import SLATimer from './SLATimer'

export default function ReviewCard({ review }) {
  const navigate = useNavigate()
  const r = review.restaurants || {}

  return (
    <div
      onClick={() => navigate(`/reviews/${review.id}`)}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-accent transition-colors group"
      style={{ borderLeft: `4px solid var(--severity-${review.severity || 'low'})` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <SeverityBadge severity={review.severity} />
            <span className="font-medium text-sm">{r.name || 'Unknown'}</span>
            <PlatformBadge platform={review.platform} />
            <span className="text-yellow-400 text-sm">{formatStars(review.rating)}</span>
          </div>

          <p className="text-gray-300 text-sm line-clamp-2 mb-2">
            {review.review_text || 'No review text'}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {review.customer_name && <span>{review.customer_name}</span>}
            {review.order_id && <span>#{review.order_id}</span>}
            <span>{formatTimeAgo(review.detected_at || review.created_at)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusBadge status={review.status} />
          {review.status === 'open' && (
            <SLATimer severity={review.severity} detectedAt={review.detected_at} />
          )}
        </div>
      </div>
    </div>
  )
}
