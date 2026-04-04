import React, { useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

function getCycleEndBalance(cycle) {
  const totalOut = (cycle.bills || [])
    .filter(b => b.status === 'sorted')
    .reduce((sum, b) => sum + (parseFloat(b.actual) || 0), 0)
  const debtPaid = (cycle.debtPayments || []).reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0)
  return cycle.totalIncome - totalOut - debtPaid
}

export default function Sidebar({ data, currentScreen, setCurrentScreen, viewCycle, deleteCycle, isDark, toggleTheme, onSignOut, sidebarOpen }) {
  const { formatAmount: formatCurrency } = useCurrency()
  const cycles = data.cycles || []
  const recentCycles = [...cycles].reverse().slice(0, 10)
  const hasActiveSession = !!data.activeSession
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const navItem = (id, label, badge) => {
    const active = currentScreen === id
    return (
      <button
        key={id}
        onClick={() => setCurrentScreen(id)}
        className={active ? 'nav-item-active' : 'nav-item-inactive'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '7px 12px', borderRadius: 6,
          border: 'none',
          background: active ? (isDark ? 'rgba(153,0,153,0.2)' : '#f0fdf4') : 'transparent',
          color: active ? (isDark ? '#F5F0FF' : '#166534') : 'var(--c-text-2)',
          fontSize: 13, fontWeight: active ? 500 : 400, cursor: 'pointer',
          textAlign: 'left', marginBottom: 1,
          borderLeft: active && isDark ? '2px solid #CC3399' : 'none',
        }}
      >
        <span>{label}</span>
        {badge}
      </button>
    )
  }

  return (
    <div
      className={sidebarOpen ? 'sidebar sidebar-open' : 'sidebar'}
      style={{
        width: 200, minWidth: 200, height: '100vh',
        background: 'var(--c-bg-sidebar)',
        borderRight: '0.5px solid var(--c-border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* App name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 14px', borderBottom: '1px solid rgba(204, 51, 153, 0.12)' }}>
        <img
          src="/icon-source-dark.png"
          alt="PayDay logo"
          style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
        <div style={{ lineHeight: 1.3 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--c-text-1)' }}>PayDay</span>
          <span style={{
            fontSize: '9px', fontStyle: 'italic', color: '#CC3399',
            fontWeight: 400, marginLeft: '4px', verticalAlign: 'super', letterSpacing: '0.02em'
          }}>by Dinaglyphs</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '10px 8px 0' }}>
        {navItem('session', 'Payday session',
          hasActiveSession ? (
            <span
              className={isDark ? 'live-badge' : ''}
              style={isDark ? {} : {
                fontSize: 10, background: '#dcfce7',
                color: '#166534',
                padding: '1px 6px', borderRadius: 10, fontWeight: 500
              }}
            >Live</span>
          ) : null
        )}
        {navItem('debts', 'Debt tracker', null)}
        {navItem('payslips', 'Payslips', null)}
      </div>

      {/* History */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 8px 0' }}>
        <div style={{
          fontSize: 11, fontWeight: 500,
          color: isDark ? 'rgba(204,51,153,0.65)' : 'var(--c-text-4)',
          padding: '0 6px', marginBottom: 4,
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          History
        </div>
        {recentCycles.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--c-text-4)', padding: '4px 6px' }}>No cycles yet</div>
        ) : (
          recentCycles.map(cycle => {
            const bal = getCycleEndBalance(cycle)
            const confirming = confirmDeleteId === cycle.id
            return (
              <div key={cycle.id}>
                <div
                  onClick={() => { setConfirmDeleteId(null); viewCycle(cycle.id) }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '5px 6px', borderRadius: 5, marginBottom: 1, fontSize: 12,
                    color: 'var(--c-text-2)', cursor: 'pointer',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(204,51,153,0.08)' : 'var(--c-bg-row)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ flex: 1 }}>{formatDate(cycle.date)}</span>
                  <span style={{
                    color: bal >= 0 ? (isDark ? '#93C95A' : '#15803d') : (isDark ? '#F06B6A' : '#dc2626'),
                    fontWeight: 500, marginRight: 2
                  }}>
                    {formatCurrency(bal)}
                  </span>
                  {/* Delete button */}
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(confirming ? null : cycle.id) }}
                    title="Delete cycle"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: confirming ? (isDark ? '#F06B6A' : '#dc2626') : 'var(--c-text-4)',
                      padding: '1px 2px', borderRadius: 3,
                      display: 'flex', alignItems: 'center', flexShrink: 0
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
                {/* Inline confirm */}
                {confirming && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px 6px', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--c-text-3)', flex: 1 }}>Delete?</span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteCycle(cycle.id); setConfirmDeleteId(null) }}
                      style={{ fontSize: 11, padding: '2px 8px', background: isDark ? 'rgba(226,75,74,0.2)' : '#dc2626', color: isDark ? '#F06B6A' : '#fff', border: isDark ? '1px solid rgba(226,75,74,0.4)' : 'none', borderRadius: 4, cursor: 'pointer' }}
                    >Yes</button>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDeleteId(null) }}
                      style={{ fontSize: 11, padding: '2px 8px', background: 'none', color: 'var(--c-text-3)', border: '0.5px solid var(--c-input-border)', borderRadius: 4, cursor: 'pointer' }}
                    >No</button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Insights */}
      <div style={{ padding: '10px 8px 0', borderTop: '0.5px solid var(--c-border)' }}>
        <div style={{
          fontSize: 11, fontWeight: 500,
          color: isDark ? 'rgba(204,51,153,0.65)' : 'var(--c-text-4)',
          padding: '0 6px', marginBottom: 4,
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          Insights
        </div>
        {navItem('annual', 'Annual wrap', null)}
        {navItem('patterns', 'Patterns', null)}
      </div>

      {/* About */}
      <div style={{ padding: '0 8px 6px', borderTop: '0.5px solid var(--c-border)' }}>
        {navItem('about', 'About PayDay', null)}
      </div>

      {/* Footer: Settings + Theme toggle */}
      <div style={{ marginTop: 'auto', padding: '8px 8px 0', borderTop: '0.5px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => setCurrentScreen('settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, flex: 1,
            padding: '7px 12px', borderRadius: 6, border: 'none',
            background: currentScreen === 'settings'
              ? (isDark ? 'rgba(204,51,153,0.12)' : 'var(--c-border-light)')
              : 'transparent',
            color: 'var(--c-text-3)', fontSize: 13, cursor: 'pointer'
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            padding: '7px 8px', borderRadius: 6, border: 'none',
            background: 'transparent', color: 'var(--c-text-3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center'
          }}
        >
          {isDark ? (
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Sign out + Attribution */}
      <div style={{ padding: '8px 8px 0', borderTop: '0.5px solid var(--c-border)' }}>
        {onSignOut && (
          <button
            onClick={onSignOut}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 6, border: 'none',
              background: 'transparent', color: 'var(--c-text-4)', fontSize: 13, cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.color = isDark ? '#F06B6A' : '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-4)'}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        )}
      </div>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(204, 51, 153, 0.12)',
        fontSize: '10px',
        color: 'rgba(230, 230, 230, 0.25)',
        lineHeight: 1.5
      }}>
        Vibecoded by<br />
        <span style={{ color: 'rgba(204, 51, 153, 0.45)', fontStyle: 'italic' }}>
          Opeyemi Daniel Abatan
        </span>
        <br />
        <span style={{ color: 'rgba(204, 51, 153, 0.3)' }}>@dinaglyphs</span>
      </div>
    </div>
  )
}
