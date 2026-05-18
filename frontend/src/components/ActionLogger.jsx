import { useState } from 'react'
import { reviewsApi } from '../lib/api'

const ACTION_TYPES = [
  { value: 'called_customer', label: 'Called Customer' },
  { value: 'offered_refund', label: 'Offered Refund' },
  { value: 'offered_replacement', label: 'Offered Replacement' },
  { value: 'spoke_to_delivery', label: 'Spoke to Delivery' },
  { value: 'escalated_to_kitchen', label: 'Escalated to Kitchen' },
  { value: 'reported_to_platform', label: 'Reported to Platform' },
  { value: 'owner_escalated', label: 'Owner Escalated' },
  { value: 'note', label: 'Add Note' },
]

export default function ActionLogger({ reviewId, review, onActionLogged }) {
  const [selectedAction, setSelectedAction] = useState(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (actionType) => {
    setLoading(true)
    try {
      await reviewsApi.logAction(reviewId, {
        action_type: actionType,
        note: note || undefined,
      })
      setNote('')
      setSelectedAction(null)
      if (onActionLogged) onActionLogged()
    } catch (err) {
      console.error('Failed to log action:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    setLoading(true)
    try {
      await reviewsApi.updateStatus(reviewId, 'resolved')
      if (onActionLogged) onActionLogged()
    } catch (err) {
      console.error('Failed to resolve:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3 text-gray-300 uppercase tracking-wide">Log an Action</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {ACTION_TYPES.map((action) => (
          <button
            key={action.value}
            onClick={() => {
              if (action.value === 'note') {
                setSelectedAction('note')
              } else {
                handleSubmit(action.value)
              }
            }}
            disabled={loading}
            className="px-3 py-2 bg-border hover:bg-gray-600 rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {selectedAction === 'note' && (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && note.trim()) {
                handleSubmit('note')
              }
            }}
          />
          <button
            onClick={() => handleSubmit('note')}
            disabled={loading || !note.trim()}
            className="px-4 py-2 bg-accent text-white rounded text-sm font-medium disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}

      {reviewId && review?.status !== 'resolved' && (
        <button
          onClick={handleResolve}
          disabled={loading}
          className="w-full py-2 bg-low/20 text-low border border-low/30 rounded text-sm font-semibold hover:bg-low/30 transition-colors disabled:opacity-50"
        >
          Mark as Resolved
        </button>
      )}
    </div>
  )
}
