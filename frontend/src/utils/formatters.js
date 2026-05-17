import { formatDistanceToNow, format } from 'date-fns'

export function formatTimeAgo(date) {
  if (!date) return ''
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

export function formatStars(rating) {
  if (!rating) return '☆☆☆☆☆'
  const filled = '★'.repeat(rating)
  const empty = '☆'.repeat(5 - rating)
  return filled + empty
}

export function formatDuration(minutes) {
  if (!minutes || minutes < 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatDateTime(date) {
  if (!date) return ''
  try {
    return format(new Date(date), 'h:mm a')
  } catch {
    return ''
  }
}

export function formatFullDate(date) {
  if (!date) return ''
  try {
    return format(new Date(date), 'MMM d, yyyy h:mm a')
  } catch {
    return ''
  }
}
