import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode,     setMode]     = useState('signin')   // 'signin' | 'signup'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [status,   setStatus]   = useState(null)       // null | 'loading' | 'success' | { error: string }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setStatus({ error: error.message }); return }
      setStatus('success')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setStatus({ error: error.message }); return }
      // App.jsx listens to onAuthStateChange and will re-render automatically
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(204,51,153,0.25)',
    borderRadius: 8, color: 'var(--c-text-1)', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', padding: '0 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--c-text-1)' }}>PayDay</span>
            <span style={{ fontSize: 12, color: '#CC3399', fontStyle: 'italic' }}>by Dinaglyphs</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--c-text-4)', margin: '8px 0 0', lineHeight: 1.5 }}>
            Your personal pay cycle manager
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '28px 28px 24px' }}>

          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 10 }}>
                Check your email
              </div>
              <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.6, margin: 0 }}>
                We sent a confirmation link to <strong style={{ color: 'var(--c-text-2)' }}>{email}</strong>.
                Click it to activate your account, then sign in.
              </p>
              <button
                onClick={() => { setMode('signin'); setStatus(null) }}
                className="btn-primary"
                style={{ marginTop: 20, padding: '9px 24px', fontSize: 13 }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 4 }}>
                {mode === 'signin' ? 'Sign in' : 'Create account'}
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
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                  minLength={6}
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary"
                style={{ padding: '10px', fontSize: 14, marginTop: 4 }}
              >
                {status === 'loading'
                  ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                  : (mode === 'signin' ? 'Sign in' : 'Create account')}
              </button>

              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--c-text-4)' }}>
                {mode === 'signin' ? (
                  <>No account?{' '}
                    <button type="button" onClick={() => { setMode('signup'); setStatus(null) }}
                      style={{ background: 'none', border: 'none', color: '#CC3399', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                      Sign up
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button type="button" onClick={() => { setMode('signin'); setStatus(null) }}
                      style={{ background: 'none', border: 'none', color: '#CC3399', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                      Sign in
                    </button>
                  </>
                )}
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  )
}
