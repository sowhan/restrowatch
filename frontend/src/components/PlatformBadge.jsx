export default function PlatformBadge({ platform }) {
  if (!platform) return null
  const isSwiggy = platform.toLowerCase() === 'swiggy'

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-semibold text-white"
      style={{ backgroundColor: isSwiggy ? '#FC8019' : '#E23744' }}
    >
      {isSwiggy ? 'Swiggy' : 'Zomato'}
    </span>
  )
}
