import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { loadData, saveData, emptyData } from './store/dataStore'
import { CurrencyProvider } from './context/CurrencyContext'
import Auth from './screens/Auth'
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
  const [user,            setUser]            = useState(undefined) // undefined = checking, null = signed out
  const [data,            setData]            = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [currentScreen,   setCurrentScreen]   = useState('session')
  const [selectedCycleId, setSelectedCycleId] = useState(null)
  const [sidebarOpen,     setSidebarOpen]     = useState(false)

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) {
        // Signed out — clear app data
        setData(null)
        setLoading(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Load data once user is confirmed ──────────────────────────────────────
  useEffect(() => {
    if (!user) return

    // Remove dark class before we know the user's preference (default is light)
    document.documentElement.classList.remove('dark')

    async function init() {
      setLoading(true)
      const loaded = await loadData()
      const d = loaded || emptyData()
      if (!d.preferences) d.preferences = {}
      if (!d.preferences.theme)    d.preferences.theme    = 'light'
      if (!d.preferences.currency) d.preferences.currency = 'GBP'
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

  const persist = useCallback(async (newData) => {
    setData(newData)
    await saveData(newData)
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
        <span style={{ fontSize: 14, color: 'var(--c-text-3)' }}>Loading...</span>
      </div>
    )
  }

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!user) {
    return <Auth />
  }

  // ── Loading data ──────────────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ fontSize: 14, color: 'var(--c-text-3)' }}>Loading your data...</span>
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
  )
}
