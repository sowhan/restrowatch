import { useNavigate } from 'react-router-dom'
import { formatStars } from '../utils/formatters'

export default function RestaurantRow({ restaurant }) {
  const navigate = useNavigate()
  const trendUp = restaurant.rating_trend > 0
  const trendDown = restaurant.rating_trend < 0

  return (
    <div
      onClick={() => navigate(`/owner?restaurant=${restaurant.restaurant_id}`)}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-accent transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{restaurant.restaurant_name}</h3>
          <p className="text-xs text-gray-500">{restaurant.city}</p>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 text-lg font-bold">{formatStars(Math.round(restaurant.avg_rating))}</div>
          <div className="text-xs text-gray-400">{restaurant.avg_rating || 'N/A'}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {restaurant.rating_trend !== 0 && (
          <span className={trendUp ? 'text-low' : 'text-critical'}>
            {trendUp ? '↑' : '↓'} {Math.abs(restaurant.rating_trend)}
          </span>
        )}
        <span className="text-gray-500">|</span>
        <span className={restaurant.open_issues > 0 ? 'text-critical font-semibold' : 'text-gray-400'}>
          {restaurant.open_issues} open
        </span>
        <span className="text-gray-500">|</span>
        <span className={restaurant.sla_breached > 0 ? 'text-high font-semibold' : 'text-gray-400'}>
          {restaurant.sla_breached} SLA
        </span>
        <span className="text-gray-500">|</span>
        <span className="text-low">{restaurant.resolved_today} resolved</span>
      </div>
    </div>
  )
}
