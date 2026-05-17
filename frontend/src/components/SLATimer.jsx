import { useSLA } from '../hooks/useSLA'

export default function SLATimer({ severity, detectedAt }) {
  const sla = useSLA(severity, detectedAt)

  if (!sla.display) return null

  const isBreached = sla.status === 'breached'

  return (
    <span className={`text-xs font-mono ${isBreached ? 'text-critical' : 'text-gray-400'}`}>
      {isBreached && '⚠️ '}{sla.display}
    </span>
  )
}
