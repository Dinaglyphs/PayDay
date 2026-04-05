import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import { loadData, savePreferences, saveTemplate, saveActiveSession, saveClosedCycle, deleteClosedCycle, emptyData } from './store/dataStore'
import { CurrencyProvider } from './context/CurrencyContext'
import ErrorBoundary from './components/ErrorBoundary'
import Auth from './screens/Auth'
import ResetPassword from './screens/ResetPassword'
import Welcome from './screens/Welcome'
import Setup from './screens/Setup'
import Session from './screens/Session'
import DebtTracker from './screens/DebtTracker'
import AnnualWrap from './screens/AnnualWrap'
import Settings from './screens/Settings'
import CycleDetail from './screens/CycleDetail'
import Payslips from './screens/Payslips'
import Sidebar from './components/Sidebar'

export default function App() {
  const [user,             setUser]             = useState(undefined) // undefined = checking, null = signed out
  const [data,             setData]             = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [currentScreen,    setCurrentScreen]    = useState('session')
  const [selectedCycleId,  setSelectedCycleId]  = useState(null)
  const [sidebarOpen,      setSidebarOpen]      = useState(false)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  // Track previous data state for smart diffing (no re-renders)
  const dataRef = useRef(null)

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
        return
      }
      setUser(session?.user ?? null)
      if (!session) {
        setData(null)
        dataRef.current = null
        setLoading(true)
        setPasswordRecovery(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Load data once user is confirmed ──────────────────────────────────────
  useEffect(() => {
    if (!user) return

    document.documentElement.classList.remove('dark')

    async function init() {
      setLoading(true)
      const loaded = await loadData()
      const d = loaded || emptyData()
      if (!d.preferences) d.preferences = {}
      if (!d.preferences.theme)    d.preferences.theme    = 'light'
      if (!d.preferences.currency) d.preferences.currency = 'GBP'
      dataRef.current = d
      setData(d)
      if (d.preferences.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      setLoading(false)
    }
    init()
  }, [user])

  // ── Smart persist: only saves what changed ────────────────────────────────
  const persist = useCallback((newData) => {
    const prev = dataRef.current
    dataRef.current = newData
    setData(newData)

    // Preferences changed?
    if (newData.preferences !== prev?.preferences) {
      savePreferences(newData.preferences).catch(console.error)
    }

    // Template changed?
    if (newData.template !== prev?.template) {
      saveTemplate(newData.template).catch(console.error)
    }

    // Active session changed?
    if (newData.activeSession !== prev?.activeSession) {
      saveActiveSession(newData.activeSession).catch(console.error)
    }

    // New closed cycles?
    const prevIds = new Set((prev?.cycles || []).map(c => c.id))
    const newIds  = new Set((newData.cycles || []).map(c => c.id))
    ;(newData.cycles || []).filter(c => !prevIds.has(c.id)).forEach(c => saveClosedCycle(c).catch(console.error))

    // Deleted closed cycles?
    ;[...prevIds].filter(id => !newIds.has(id)).forEach(id => deleteClosedCycle(id).catch(console.error))

    // Payslips are saved directly in Payslips.jsx via supabase storage — no action needed here
  }, [])

  function toggleTheme() {
    const current = data.preferences?.theme || 'light'
    const next = current === 'light' ? 'dark' : 'light'
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    persist({ ...data, preferences: { ...(data.preferences || {}), theme: next } })
  }

  function handleSignOut() {
    supabase.auth.signOut()
  }

  // ── Auth check in progress ────────────────────────────────────────────────
  if (user === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ fontSize: 14, color: 'var(--c-text-3)' }}>Loading…</span>
      </div>
    )
  }

  // ── Password recovery flow ────────────────────────────────────────────────
  if (passwordRecovery) {
    return <ResetPassword onDone={() => setPasswordRecovery(false)} />
  }

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!user) {
    return <Auth />
  }

  // ── Loading data ──────────────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ fontSize: 14, color: 'var(--c-text-3)' }}>Loading your data…</span>
      </div>
    )
  }

  // ── Onboarding: welcome ───────────────────────────────────────────────────
  if (!data.preferences?.hasSeenWelcome) {
    return (
      <CurrencyProvider initialCurrency={data.preferences?.currency || 'GBP'}>
        <Welcome
          onComplete={(selectedCurrency) => {
            persist({
              ...data,
              preferences: { ...(data.preferences || {}), hasSeenWelcome: true, currency: selectedCurrency },
            })
          }}
        />
      </CurrencyProvider>
    )
  }

  // ── Onboarding: setup ─────────────────────────────────────────────────────
  if (!data.template) {
    return (
      <CurrencyProvider initialCurrency={data.preferences?.currency || 'GBP'}>
        <Setup onComplete={(template) => persist({ ...data, template })} />
      </CurrencyProvider>
    )
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  function viewCycle(cycleId) {
    setSelectedCycleId(cycleId)
    setCurrentScreen('cycleDetail')
  }

  function deleteCycle(cycleId) {
    persist({ ...data, cycles: (data.cycles || []).filter(c => c.id !== cycleId) })
    setCurrentScreen('session')
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'session':     return <Session data={data} persist={persist} />
      case 'debts':       return <DebtTracker data={data} persist={persist} />
      case 'payslips':    return <Payslips data={data} persist={persist} />
      case 'annual':      return <AnnualWrap data={data} />
      case 'patterns':    return <AnnualWrap data={data} defaultTab="patterns" />
      case 'settings':    return <Settings data={data} persist={persist} toggleTheme={toggleTheme} />
      case 'about':       return <Welcome revisit onRevisitDone={() => setCurrentScreen('session')} />
      case 'cycleDetail': {
        const cycle = (data.cycles || []).find(c => c.id === selectedCycleId)
        return <CycleDetail cycle={cycle} onBack={() => setCurrentScreen('session')} onDelete={deleteCycle} />
      }
      default: return <Session data={data} persist={persist} />
    }
  }

  const isDark = data.preferences?.theme === 'dark'

  return (
    <ErrorBoundary>
      <CurrencyProvider initialCurrency={data.preferences?.currency || 'GBP'}>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
          )}
          <Sidebar
            data={data}
            currentScreen={currentScreen}
            setCurrentScreen={(s) => { setCurrentScreen(s); setSidebarOpen(false) }}
            viewCycle={(id) => { viewCycle(id); setSidebarOpen(false) }}
            deleteCycle={deleteCycle}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onSignOut={handleSignOut}
            sidebarOpen={sidebarOpen}
          />
          <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
            {/* Mobile header with hamburger */}
            <div className="mobile-header">
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
                Menu
              </button>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text-2)' }}>PayDay</span>
            </div>
            {renderScreen()}
          </main>
        </div>
      </CurrencyProvider>
    </ErrorBoundary>
  )
}
