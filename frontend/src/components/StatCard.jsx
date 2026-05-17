export default function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color ? `text-${color}` : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}
