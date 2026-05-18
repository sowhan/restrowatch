import { createContext, createElement, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AUTH_TIMEOUT_MS = 5000
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
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

  const applyAuthState = useCallback(async (nextSession) => {
    setSession(nextSession)

    if (!nextSession?.user) {
      setUser(null)
      setRole(null)
      setRestaurantId(null)
      clearAuthTimeout()
      setLoading(false)
      return null
    }

    const userId = nextSession.user.id
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Profile query failed — keep user alive from session
        console.error('Profile fetch error:', error.message)
      }

      if (data) {
        const hydratedUser = {
          ...data,
          email: nextSession.user.email || '',
        }
        setUser(hydratedUser)
        setRole(data.role)
        setRestaurantId(data.restaurant_id)
        return hydratedUser
      }

      setUser({
        id: userId,
        email: nextSession.user.email || '',
      })
      setRole(null)
      setRestaurantId(null)
      return null
    } finally {
      clearAuthTimeout()
      setLoading(false)
    }
  }, [clearAuthTimeout])

  useEffect(() => {
    timeoutRef.current = setTimeout(forceUnblock, AUTH_TIMEOUT_MS)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        applyAuthState(session)
      })
      .catch(() => {
        clearAuthTimeout()
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await applyAuthState(session)
      }
    )

    return () => {
      subscription.unsubscribe()
      clearAuthTimeout()
    }
  }, [applyAuthState, forceUnblock, clearAuthTimeout])

  const signIn = async (email, password) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setLoading(false)
      throw error
    }

    const hydratedUser = await applyAuthState(data.session || null)
    return { ...data, hydratedUser }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setRestaurantId(null)
    setSession(null)
    setLoading(false)
  }

  const value = { user, session, role, restaurantId, loading, signIn, signOut }

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
