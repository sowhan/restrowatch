import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { gmailApi, settingsApi } from '../lib/api'
import { formatFullDate } from '../utils/formatters'

export default function Settings() {
  const { user, signOut, loading: authLoading } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [gmailStatus, setGmailStatus] = useState(null)
  const [unmatchedEmails, setUnmatchedEmails] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    const gmailState = searchParams.get('gmail')
    if (!gmailState) return

    if (gmailState === 'connected') {
      const email = searchParams.get('email')
      addToast(email ? `Gmail connected: ${email}` : 'Gmail connected successfully', 'success')
      loadData()
    } else if (gmailState === 'error') {
      addToast(searchParams.get('reason') || 'Gmail connection failed', 'error')
    }

    setSearchParams({})
  }, [searchParams, addToast, setSearchParams])

  const loadData = async () => {
    try {
      setError(null)
      const [gmailData, unmatchedData, restaurantsData] = await Promise.all([
        gmailApi.getStatus(),
        user.role === 'owner' ? settingsApi.getUnmatchedEmails() : { data: [] },
        settingsApi.getRestaurants(),
      ])
      setGmailStatus(gmailData.data)
      setUnmatchedEmails(unmatchedData.data || [])
      setRestaurants(restaurantsData.data || [])
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError('Failed to load settings')
      addToast('Failed to load settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const connectGmail = async () => {
    try {
      const { data } = await gmailApi.getAuthUrl()
      window.location.href = data.auth_url
    } catch (err) {
      console.error('Failed to get Gmail auth URL:', err)
      addToast('Failed to connect Gmail', 'error')
    }
  }

  const triggerPoll = async () => {
    try {
      await gmailApi.triggerPoll()
      addToast('Gmail poll triggered successfully', 'success')
    } catch (err) {
      console.error('Failed to trigger poll:', err)
      addToast('Failed to trigger poll', 'error')
    }
  }

  const assignEmail = async (emailId, restaurantId) => {
    try {
      await settingsApi.assignUnmatchedEmail(emailId, restaurantId)
      addToast('Email assigned successfully', 'success')
      loadData()
    } catch (err) {
      console.error('Failed to assign email:', err)
      addToast('Failed to assign email', 'error')
    }
  }

  if (authLoading || !user) return null

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-accent">RestroWatch</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(user.role === 'owner' ? '/owner' : '/manager')}
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Dashboard
          </button>
          <button
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-critical"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        {error && (
          <div className="flex items-center gap-2 text-critical text-sm bg-critical/10 border border-critical/20 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={loadData} className="ml-auto text-xs underline">Retry</button>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-border rounded w-32" />
              <div className="h-4 bg-border rounded w-48" />
              <div className="h-4 bg-border rounded w-24" />
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2">{user.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2">{user.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Role:</span>
                <span className="ml-2 capitalize">{user.role}</span>
              </div>
            </div>
          )}
        </div>

        {user.role === 'owner' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Gmail Connection</h2>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className={`text-sm font-medium ${gmailStatus?.connected ? 'text-low' : 'text-gray-400'}`}>
                  {gmailStatus?.connected ? 'Connected' : 'Not Connected'}
                </p>
                {gmailStatus?.last_synced_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last synced: {formatFullDate(gmailStatus.last_synced_at)}
                  </p>
                )}
                {gmailStatus?.connected && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded border ${gmailStatus?.can_read_mail ? 'text-low border-low/40 bg-low/10' : 'text-gray-400 border-border'}`}>
                      {gmailStatus?.can_read_mail ? 'Mailbox access verified' : 'Mailbox access pending'}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded border ${gmailStatus?.has_refresh_token ? 'text-accent border-accent/40 bg-accent/10' : 'text-gray-400 border-border'}`}>
                      {gmailStatus?.has_refresh_token ? 'Auto refresh enabled' : 'No refresh token'}
                    </span>
                  </div>
                )}
                {gmailStatus?.token_expiry && (
                  <p className="text-xs text-gray-500 mt-2">
                    Token expiry: {formatFullDate(gmailStatus.token_expiry)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Tip: run <span className="text-gray-300">Trigger Poll</span> after connecting to confirm reviews sync.
                </p>
              </div>
              <div className="flex gap-2">
                {!gmailStatus?.connected && (
                  <button
                    onClick={connectGmail}
                    className="px-4 py-2 bg-accent text-white rounded text-sm font-medium hover:bg-orange-600"
                  >
                    Connect Gmail
                  </button>
                )}
                {gmailStatus?.connected && (
                  <button
                    onClick={triggerPoll}
                    className="px-4 py-2 bg-border text-white rounded text-sm font-medium hover:bg-gray-600"
                  >
                    Trigger Poll
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {user.role === 'owner' && unmatchedEmails.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              Unmatched Emails
              <span className="text-sm text-gray-500 font-normal ml-2">
                ({unmatchedEmails.length})
              </span>
            </h2>
            <div className="space-y-3">
              {unmatchedEmails.map((email) => (
                <div key={email.id} className="bg-bg border border-border rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">{email.subject || 'No subject'}</p>
                  <p className="text-xs text-gray-500 mb-2">
                    {email.platform} • {formatFullDate(email.email_received_at)}
                  </p>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 bg-card border border-border rounded px-2 py-1 text-xs"
                      onChange={(e) => {
                        if (e.target.value) assignEmail(email.id, e.target.value)
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Assign to restaurant...</option>
                      {restaurants.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user.role === 'owner' && unmatchedEmails.length === 0 && !loading && (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-gray-500 text-sm">No unmatched emails</p>
          </div>
        )}
      </main>
    </div>
  )
}
