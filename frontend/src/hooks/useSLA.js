import { useState, useEffect } from 'react'

const SLA_THRESHOLDS = {
  critical: 15,
  high: 30,
  medium: 60,
  low: 120,
}

export function useSLA(severity, detectedAt) {
  const [timeLeft, setTimeLeft] = useState({
    status: 'ok',
    remainingMinutes: 0,
    overdueMinutes: 0,
    display: '',
  })

  useEffect(() => {
    if (!detectedAt || !severity) return

    const calculate = () => {
      const detected = new Date(detectedAt)
      const now = new Date()
      const threshold = SLA_THRESHOLDS[severity] || 60
      const elapsed = (now - detected) / 60000
      const remaining = threshold - elapsed

      if (remaining <= 0) {
        const overdue = Math.abs(Math.floor(remaining))
        const hours = Math.floor(overdue / 60)
        const mins = overdue % 60
        return {
          status: 'breached',
          remainingMinutes: 0,
          overdueMinutes: overdue,
          display: hours > 0
            ? `SLA Breached — ${hours}h ${mins}m overdue`
            : `SLA Breached — ${mins} min overdue`,
        }
      } else {
        const mins = Math.floor(remaining)
        const secs = Math.floor((remaining - mins) * 60)
        return {
          status: 'ok',
          remainingMinutes: mins,
          overdueMinutes: 0,
          display: `Response due in ${mins}:${secs.toString().padStart(2, '0')}`,
        }
      }
    }

    setTimeLeft(calculate())
    const interval = setInterval(() => setTimeLeft(calculate()), 1000)
    return () => clearInterval(interval)
  }, [severity, detectedAt])

  return timeLeft
}
