const severityColors = {
  critical: 'bg-critical text-white',
  high: 'bg-high text-white',
  medium: 'bg-medium text-black',
  low: 'bg-low text-black',
}

export default function SeverityBadge({ severity }) {
  if (!severity) return null
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${severityColors[severity] || 'bg-gray-500'}`}>
      {severity}
    </span>
  )
}
