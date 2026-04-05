import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [status,   setStatus]   = useState(null) // null | 'loading' | 'done' | { error }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setStatus({ error: "Passwords don't match." })
      return
    }
    setStatus('loading')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setStatus({ error: error.message }); return }
    setStatus('done')
    setTimeout(onDone, 1800)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(204,51,153,0.25)',
    borderRadius: 8, color: 'var(--c-text-1)', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--c-text-1)' }}>PayDay</span>
            <span style={{ fontSize: 12, color: '#CC3399', fontStyle: 'italic' }}>by Dinaglyphs</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '28px 28px 24px' }}>
          {status === 'done' ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 10 }}>
                Password updated
              </div>
              <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.6, margin: 0 }}>
                Your password has been changed. Redirecting you now…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 2 }}>
                Choose a new password
              </div>

              {status?.error && (
                <div style={{
                  padding: '9px 12px', borderRadius: 6, fontSize: 13,
                  background: 'rgba(226,75,74,0.12)', border: '1px solid rgba(226,75,74,0.3)',
                  color: 'var(--c-skipped-text)',
                }}>
                  {status.error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  New password
                </label>
                <input
                  type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  required minLength={6} placeholder="Min 6 characters"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Confirm password
                </label>
                <input
                  type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required minLength={6} placeholder="••••••••"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary"
                style={{ padding: '10px', fontSize: 14, marginTop: 4 }}
              >
                {status === 'loading' ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
