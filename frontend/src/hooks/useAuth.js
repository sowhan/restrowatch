import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AUTH_TIMEOUT_MS = 5000

export function useAuth() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [restaurantId, setRestaurantId] = useState(null)
  const [loading, setLoading] = useState(true)
  const timeoutRef = useRef(null)

  const clearAuthTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const forceUnblock = useCallback(() => {
    clearAuthTimeout()
    setLoading(false)
  }, [clearAuthTimeout])

  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setRole(data.role)
        setRestaurantId(data.restaurant_id)
        setUser({ ...data, email: data.email })
      } else {
        setUser(null)
        setRole(null)
        setRestaurantId(null)
      }
    } catch {
      setUser(null)
      setRole(null)
      setRestaurantId(null)
    } finally {
      clearAuthTimeout()
      setLoading(false)
    }
  }, [clearAuthTimeout])

  useEffect(() => {
    timeoutRef.current = setTimeout(forceUnblock, AUTH_TIMEOUT_MS)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        if (session?.user) {
          fetchUserProfile(session.user.id)
        } else {
          clearAuthTimeout()
          setLoading(false)
        }
      })
      .catch(() => {
        clearAuthTimeout()
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setRole(null)
          setRestaurantId(null)
          clearAuthTimeout()
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearAuthTimeout()
    }
  }, [fetchUserProfile, forceUnblock, clearAuthTimeout])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setRestaurantId(null)
    setSession(null)
    setLoading(false)
  }

  return { user, session, role, restaurantId, loading, signIn, signOut }
}
