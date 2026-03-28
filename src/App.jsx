import React, { useState, useEffect, useCallback } from 'react'
import { loadData, saveData, emptyData } from './store/dataStore'
import { CurrencyProvider } from './context/CurrencyContext'
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
  const [data, setData]                 = useState(null)
  const [loading, setLoading]           = useState(true)
  const [currentScreen, setCurrentScreen] = useState('session')
  const [selectedCycleId, setSelectedCycleId] = useState(null)

  useEffect(() => {
    async function init() {
      const loaded = await loadData()
      const d = loaded || emptyData()
      if (!d.preferences) d.preferences = {}
      if (!d.preferences.theme)    d.preferences.theme    = 'dark'
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
  }, [])

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
    const newData = { ...data, preferences: { ...(data.preferences || {}), theme: next } }
    persist(newData)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ fontSize: 14, color: 'var(--c-text-3)' }}>Loading...</span>
      </div>
    )
  }

  // Show welcome screen on first launch
  if (!data.preferences?.hasSeenWelcome) {
    return (
      <CurrencyProvider initialCurrency={data.preferences?.currency || 'GBP'}>
        <Welcome
          onComplete={(selectedCurrency) => {
            const newData = {
              ...data,
              preferences: {
                ...(data.preferences || {}),
                hasSeenWelcome: true,
                currency: selectedCurrency,
              }
            }
            persist(newData)
          }}
        />
      </CurrencyProvider>
    )
  }

  if (!data.template) {
    return (
      <CurrencyProvider initialCurrency={data.preferences?.currency || 'GBP'}>
        <Setup
          onComplete={(template) => {
            const newData = { ...data, template }
            persist(newData)
          }}
        />
      </CurrencyProvider>
    )
  }

  function viewCycle(cycleId) {
    setSelectedCycleId(cycleId)
    setCurrentScreen('cycleDetail')
  }

  function deleteCycle(cycleId) {
    const newData = { ...data, cycles: (data.cycles || []).filter(c => c.id !== cycleId) }
    persist(newData)
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
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar
          data={data}
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
          viewCycle={viewCycle}
          deleteCycle={deleteCycle}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderScreen()}
        </main>
      </div>
    </CurrencyProvider>
  )
}
