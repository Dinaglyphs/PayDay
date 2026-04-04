import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode,     setMode]     = useState('signin')   // 'signin' | 'signup' | 'forgot'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [status,   setStatus]   = useState(null)       // null | 'loading' | 'success' | { error: string }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      if (error) { setStatus({ error: error.message }); return }
      setStatus('success')
      return
    }

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

  function switchMode(newMode) {
    setMode(newMode)
    setStatus(null)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(204,51,153,0.25)',
    borderRadius: 8, color: 'var(--c-text-1)', outline: 'none', boxSizing: 'border-box',
  }

  const linkBtn = {
    background: 'none', border: 'none', color: '#CC3399',
    cursor: 'pointer', fontSize: 13, padding: 0,
  }

  const successContent = {
    signup: {
      heading: 'Check your email',
      body: (
        <>
          We sent a confirmation link to{' '}
          <strong style={{ color: 'var(--c-text-2)' }}>{email}</strong>.
          Click it to activate your account, then sign in.
        </>
      ),
    },
    forgot: {
      heading: 'Reset link sent',
      body: (
        <>
          If <strong style={{ color: 'var(--c-text-2)' }}>{email}</strong> has an account,
          you'll receive a password reset link shortly. Check your inbox.
        </>
      ),
    },
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--c-text-1)' }}>PayDay</span>
            <span style={{ fontSize: 12, color: '#CC3399', fontStyle: 'italic' }}>by Dinaglyphs</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--c-text-4)', margin: '8px 0 0', lineHeight: 1.6 }}>
            Track every pay cycle — bills, debts, and what's left over — from any device.
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '28px 28px 24px' }}>

          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 10 }}>
                {successContent[mode]?.heading}
              </div>
              <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.6, margin: 0 }}>
                {successContent[mode]?.body}
              </p>
              <button
                onClick={() => switchMode('signin')}
                className="btn-primary"
                style={{ marginTop: 20, padding: '9px 24px', fontSize: 13 }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 2 }}>
                {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset your password'}
              </div>

              {mode === 'signup' && (
                <p style={{ fontSize: 12, color: 'var(--c-text-3)', margin: 0, lineHeight: 1.65 }}>
                  Register with your email address. Choose a strong password that's unique to
                  this account — not one you use on other sites or services.
                </p>
              )}

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

              {mode !== 'forgot' && (
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
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      style={{ ...linkBtn, fontSize: 12, textAlign: 'right', alignSelf: 'flex-end' }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary"
                style={{ padding: '10px', fontSize: 14, marginTop: 4 }}
              >
                {status === 'loading'
                  ? (mode === 'signin' ? 'Signing in…' : mode === 'signup' ? 'Creating account…' : 'Sending…')
                  : (mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link')}
              </button>

              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--c-text-4)' }}>
                {mode === 'signin' ? (
                  <>No account?{' '}
                    <button type="button" onClick={() => switchMode('signup')} style={linkBtn}>
                      Sign up free
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => switchMode('signin')} style={linkBtn}>
                    ← Back to sign in
                  </button>
                )}
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  )
}
