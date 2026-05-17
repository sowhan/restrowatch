import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeReviews(initialReviews = []) {
  const [reviews, setReviews] = useState(initialReviews)

  useEffect(() => {
    setReviews(initialReviews)
  }, [initialReviews])

  const handleNewReview = useCallback((payload) => {
    const newReview = payload.new
    setReviews((prev) => {
      const exists = prev.find((r) => r.id === newReview.id)
      if (exists) return prev
      return [newReview, ...prev]
    })

    if (newReview.severity === 'critical' || newReview.severity === 'high') {
      const r = newReview.restaurants || {}
      if (window.__showToast) {
        window.__showToast(
          `${newReview.severity.toUpperCase()} review from ${r.name || 'Restaurant'}`,
          'warning'
        )
      }
    }
  }, [])

  const handleStatusUpdate = useCallback((payload) => {
    const updated = payload.new
    setReviews((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    )
  }, [])

  useEffect(() => {
    const reviewsChannel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews' },
        handleNewReview
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reviews' },
        handleStatusUpdate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(reviewsChannel)
    }
  }, [handleNewReview, handleStatusUpdate])

  return reviews
}
