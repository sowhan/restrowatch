import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { gmailApi, settingsApi } from '../lib/api'
import { formatFullDate } from '../utils/formatters'

export default function Settings() {
  const { user, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [gmailStatus, setGmailStatus] = useState(null)
  const [unmatchedEmails, setUnmatchedEmails] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

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

  const loadData = async () => {
    try {
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
    }
  }

  const triggerPoll = async () => {
    try {
      await gmailApi.triggerPoll()
      alert('Gmail poll triggered successfully')
    } catch (err) {
      console.error('Failed to trigger poll:', err)
    }
  }

  const assignEmail = async (emailId, restaurantId) => {
    try {
      await settingsApi.assignUnmatchedEmail(emailId, restaurantId)
      loadData()
    } catch (err) {
      console.error('Failed to assign email:', err)
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
        {/* Profile */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
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
        </div>

        {/* Gmail Connection */}
        {user.role === 'owner' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Gmail Connection</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${gmailStatus?.connected ? 'text-low' : 'text-gray-400'}`}>
                  {gmailStatus?.connected ? 'Connected' : 'Not Connected'}
                </p>
                {gmailStatus?.last_synced_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last synced: {formatFullDate(gmailStatus.last_synced_at)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!gmailStatus?.connected && (
                  <button
                    onClick={connectGmail}
                    className="px-4 py-2 bg-accent text-white rounded text-sm font-medium"
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

        {/* Unmatched Emails (Owner Only) */}
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
      </main>
    </div>
  )
}
