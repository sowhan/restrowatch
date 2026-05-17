import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [restaurantId, setRestaurantId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setRole(data.role)
      setRestaurantId(data.restaurant_id)
      setUser({ ...data, email: session?.user?.email })
    }
  }, [session])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
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
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

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
  }

  return { user, session, role, restaurantId, loading, signIn, signOut }
}
