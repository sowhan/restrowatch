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
      if (window.showNotification) {
        window.showNotification(
          `${newReview.severity.toUpperCase()} review`,
          `${newReview.restaurants?.name || 'Restaurant'} — ${newReview.review_text?.slice(0, 80) || 'New review received'}`
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
