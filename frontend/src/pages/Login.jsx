import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'

const ERROR_MESSAGES = {
  'Invalid login credentials': 'Invalid email or password',
  'Email not confirmed': 'Please verify your email address before signing in',
  'Invalid refresh token': 'Session expired. Please sign in again',
  'Network request failed': 'Connection error. Check your internet and try again',
  'Too many requests': 'Too many attempts. Please wait a moment and try again',
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { hydratedUser: profile } = await signIn(email, password)

      if (!profile) {
        setError('No account found. Contact your administrator.')
        addToast('No account found', 'error')
        setLoading(false)
        return
      }

      addToast('Signed in successfully', 'success')
      const path = profile.role === 'owner' ? '/owner' : '/manager'
      navigate(path, { replace: true })
    } catch (err) {
      const message = ERROR_MESSAGES[err.message] || err.message || 'Login failed'
      setError(message)
      addToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="bg-card border border-border rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent">RestroWatch</h1>
          <p className="text-gray-400 text-sm mt-2">Restaurant Review Escalation Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
              placeholder="you@restaurant.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-critical text-sm bg-critical/10 border border-critical/20 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Contact your administrator to get login credentials
        </p>
      </div>
    </div>
  )
}
