import React, { useState } from 'react'
import { CURRENCIES } from '../constants/currencies'

const TOTAL_STEPS = 3

function Dots({ step }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 28 }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: i + 1 === step ? '#CC3399' : 'rgba(204, 51, 153, 0.25)',
          transition: 'background 0.2s'
        }} />
      ))}
    </div>
  )
}

export default function Welcome({ onComplete, revisit = false, onRevisitDone }) {
  const [step, setStep]       = useState(1)
  const [currency, setCurrency] = useState('GBP')

  const next   = () => setStep(s => Math.min(s + 1, TOTAL_STEPS))
  const back   = () => setStep(s => Math.max(s - 1, 1))
  const finish = () => revisit ? onRevisitDone() : onComplete(currency)

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px'
    }}>
      <div style={{ maxWidth: 560, width: '100%' }}>

        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 currency={currency} setCurrency={setCurrency} />}

        <Dots step={step} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
          <button
            onClick={back}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(230, 230, 230, 0.5)', cursor: 'pointer',
              fontSize: 13, padding: '8px 0',
              visibility: step === 1 ? 'hidden' : 'visible',
            }}
          >
            ← Back
          </button>

          {step < TOTAL_STEPS ? (
            <button onClick={next} className="btn-primary" style={{ padding: '10px 28px', fontSize: 14 }}>
              Next →
            </button>
          ) : (
            <button onClick={finish} className="btn-primary" style={{ padding: '10px 28px', fontSize: 14 }}>
              {revisit ? 'Back to dashboard →' : "Let's get started →"}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

function Step1() {
  return (
    <div style={{ textAlign: 'center' }}>
      <img
        src="/icon-source.png"
        alt="PayDay by Dinaglyphs"
        style={{
          width: 80, height: 80, borderRadius: 20, objectFit: 'contain',
          display: 'block', margin: '0 auto 24px',
          boxShadow: '0 8px 32px rgba(153, 0, 153, 0.45)',
        }}
        onError={e => { e.currentTarget.style.display = 'none' }}
      />
      <h1 style={{ fontSize: 28, fontWeight: 500, color: '#F5F0FF', margin: '0 0 4px' }}>
        Welcome to PayDay
      </h1>
      <div style={{ fontSize: 14, fontStyle: 'italic', color: '#CC3399', marginBottom: 20 }}>
        by Dinaglyphs
      </div>
      <p style={{
        fontSize: 14, color: 'rgba(230, 230, 230, 0.7)', lineHeight: 1.7,
        maxWidth: 420, margin: '0 auto 28px', textAlign: 'center',
      }}>
        PayDay is your personal payday workflow tool. Every pay cycle, you open it, work through
        your bills, track what's sorted and what's pending, and close the session when you're done.
        Your history builds automatically.
      </p>
      <div className="feature-cards" style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {[
          {
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CC3399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/>
                <polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/>
              </svg>
            ),
            label: 'Work through bills',
          },
          {
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CC3399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
            ),
            label: 'Track your debts',
          },
          {
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CC3399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
                <line x1="2" y1="20" x2="22" y2="20"/>
              </svg>
            ),
            label: 'Review your year',
          },
        ].map((item, i) => (
          <div key={i} className="feature-card" style={{
            width: 120, padding: 14, borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            {item.icon}
            <div style={{ fontSize: 11, color: 'rgba(230, 230, 230, 0.6)', textAlign: 'center' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Step2() {
  const steps = [
    { title: 'Start your session',       desc: 'Enter your paycheck amount and any extra income when payday arrives.' },
    { title: 'Work through your bills',  desc: 'Click each bill to cycle its status: Untouched → Pending → Sorted → Skipped.' },
    { title: 'Track debt payments',      desc: 'Pay toward any debt directly from the session. Balances update automatically.' },
    { title: 'Close the cycle',          desc: "When you're done, close the session. It's saved to your history forever." },
  ]

  return (
    <div style={{ textAlign: 'left' }}>
      <h2 style={{ fontSize: 20, fontWeight: 500, color: '#F5F0FF', margin: '0 0 24px', textAlign: 'center' }}>
        How a payday session works
      </h2>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #990099, #CC3399)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 2, flex: 1, minHeight: 16, background: 'rgba(153, 0, 153, 0.3)', margin: '4px 0' }} />
            )}
          </div>
          <div style={{ paddingBottom: i < steps.length - 1 ? 20 : 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#F5F0FF', marginBottom: 3 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(230, 230, 230, 0.6)' }}>{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Step3({ currency, setCurrency }) {
  const statuses = [
    { color: 'rgba(255,255,255,0.2)', glow: null,                              nameColor: 'rgba(230,230,230,0.5)', name: 'Untouched', desc: "You haven't dealt with this bill yet this cycle." },
    { color: '#F5B942',               glow: '0 0 6px rgba(245,185,66,0.5)',    nameColor: '#F5B942',              name: 'Pending',   desc: 'Payment is in progress or waiting to clear.' },
    { color: '#93C95A',               glow: '0 0 6px rgba(147,201,90,0.5)',    nameColor: '#93C95A',              name: 'Sorted',    desc: 'Confirmed paid. Done.' },
    { color: '#F06B6A',               glow: '0 0 6px rgba(240,107,106,0.5)',   nameColor: '#F06B6A',              name: 'Skipped',   desc: 'Consciously deferring this one. The app remembers.' },
  ]

  return (
    <div style={{ textAlign: 'left' }}>
      <h2 style={{ fontSize: 20, fontWeight: 500, color: '#F5F0FF', margin: '0 0 8px', textAlign: 'center' }}>
        Understanding bill statuses
      </h2>
      <p style={{ fontSize: 13, color: 'rgba(230,230,230,0.6)', marginBottom: 16, textAlign: 'center' }}>
        As you work through your bills, click each one to change its status. Each colour means something specific.
      </p>

      {statuses.map((s, i) => (
        <div key={i} style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 8,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, boxShadow: s.glow || 'none', flexShrink: 0 }} />
          <div style={{ minWidth: 80, fontSize: 13, fontWeight: 500, color: s.nameColor }}>{s.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(230,230,230,0.6)' }}>{s.desc}</div>
        </div>
      ))}

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, color: 'rgba(230,230,230,0.7)', marginBottom: 10 }}>
          One last thing — choose your currency
        </div>
        <select
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          style={{ width: '100%' }}
        >
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.symbol} — {c.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
