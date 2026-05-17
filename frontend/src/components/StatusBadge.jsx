const statusColors = {
  open: 'bg-critical/20 text-critical border border-critical/30',
  in_progress: 'bg-medium/20 text-medium border border-medium/30',
  resolved: 'bg-low/20 text-low border border-low/30',
}

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

export default function StatusBadge({ status }) {
  if (!status) return null
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColors[status] || 'bg-gray-500'}`}>
      {statusLabels[status] || status}
    </span>
  )
}
