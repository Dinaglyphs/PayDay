import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useCurrency } from '../context/CurrencyContext'

const CATEGORIES = ['Housing', 'Utilities', 'Debt repayment', 'Transport', 'Food & living', 'Savings', 'Personal', 'Other']
const DEBT_TYPES = ['Credit card', 'Loan', 'Personal']

export default function Settings({ data, persist, toggleTheme }) {
  const { currencyCode, setCurrencyCode, currencies } = useCurrency()
  const template = data.template
  const [tab, setTab] = useState('bills')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [newBill, setNewBill] = useState({ name: '', budgeted: '', category: 'Housing' })
  const [newDebt, setNewDebt] = useState({ name: '', type: 'Credit card', startingBalance: '' })

  const isDark = data.preferences?.theme === 'dark'

  function updateBill(id, field, value) {
    persist({ ...data, template: { ...template, bills: template.bills.map(b => b.id === id ? { ...b, [field]: value } : b) } })
  }
  function deleteBill(id) {
    persist({ ...data, template: { ...template, bills: template.bills.filter(b => b.id !== id) } })
    setDeleteConfirm(null)
  }
  function addBill() {
    if (!newBill.name || !newBill.budgeted) return
    persist({ ...data, template: { ...template, bills: [...template.bills, { ...newBill, id: uuidv4(), budgeted: parseFloat(newBill.budgeted) }] } })
    setNewBill({ name: '', budgeted: '', category: 'Housing' })
  }
  function updateDebt(id, field, value) {
    persist({ ...data, template: { ...template, debts: template.debts.map(d => d.id === id ? { ...d, [field]: value } : d) } })
  }
  function deleteDebt(id) {
    persist({ ...data, template: { ...template, debts: template.debts.filter(d => d.id !== id) } })
    setDeleteConfirm(null)
  }
  function addDebt() {
    if (!newDebt.name || !newDebt.startingBalance) return
    const balance = parseFloat(newDebt.startingBalance)
    persist({ ...data, template: { ...template, debts: [...template.debts, { ...newDebt, id: uuidv4(), startingBalance: balance, originalBalance: balance }] } })
    setNewDebt({ name: '', type: 'Credit card', startingBalance: '' })
  }

  function handleCurrencyChange(code) {
    setCurrencyCode(code)
    persist({ ...data, preferences: { ...(data.preferences || {}), currency: code } })
  }

  const inp = {
    padding: '4px 8px', border: '0.5px solid var(--c-input-border)', borderRadius: 4,
    fontSize: 13, outline: 'none', background: 'var(--c-input-bg)', color: 'var(--c-text-1)'
  }

  const tabs = ['bills', 'debts', 'preferences']
  const tabRadius = (t) => {
    const i = tabs.indexOf(t)
    if (i === 0)                return '6px 0 0 6px'
    if (i === tabs.length - 1)  return '0 6px 6px 0'
    return '0'
  }

  const pillStyle = (active) => ({
    padding: '8px 20px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
    fontWeight: active ? 500 : 400, transition: 'all 0.15s',
    background: active ? 'linear-gradient(135deg, #990099, #CC3399)' : 'rgba(255,255,255,0.06)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
    color: active ? '#ffffff' : 'rgba(230,230,230,0.6)',
  })

  return (
    <div style={{ padding: '24px 28px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 16, fontWeight: 500, color: 'var(--c-text-1)', margin: '0 0 20px' }}>Settings</h1>

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ width: 340 }}>
            <p style={{ fontSize: 14, color: 'var(--c-text-1)', margin: '0 0 16px' }}>
              Delete <strong>{deleteConfirm.name}</strong>? This only affects the template.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }}>Cancel</button>
              <button
                onClick={() => deleteConfirm._type === 'bill' ? deleteBill(deleteConfirm.id) : deleteDebt(deleteConfirm.id)}
                className="btn-danger"
                style={{ padding: '7px 14px', fontSize: 13, background: 'rgba(226,75,74,0.25)', fontWeight: 500 }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
        {tabs.map(t => (
          <button
            key={t} onClick={() => setTab(t)}
            className={tab === t ? 'tab-btn-active' : 'tab-btn-inactive'}
            style={{
              padding: '7px 20px', border: '0.5px solid var(--c-border)',
              borderRadius: tabRadius(t),
              background: tab === t ? 'rgba(153,0,153,0.2)' : 'var(--c-bg-card)',
              color: tab === t ? 'var(--c-text-1)' : 'var(--c-text-2)',
              fontSize: 13, cursor: 'pointer', fontWeight: tab === t ? 500 : 400, textTransform: 'capitalize'
            }}
          >{t}</button>
        ))}
      </div>

      {tab === 'bills' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-header-row" style={{ display: 'grid', gridTemplateColumns: '1fr 150px 100px 60px', gap: 10, padding: '8px 16px' }}>
            {['Name', 'Category', 'Amount', ''].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>
          {template.bills.map(bill => (
            <div key={bill.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 100px 60px', gap: 10, padding: '9px 16px', borderBottom: '0.5px solid var(--c-border-light)', alignItems: 'center' }}>
              <input type="text" value={bill.name} onChange={e => updateBill(bill.id, 'name', e.target.value)} style={{ ...inp }} />
              <select value={bill.category} onChange={e => updateBill(bill.id, 'category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="text" inputMode="decimal" value={bill.budgeted}
                onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value) || e.target.value === '') updateBill(bill.id, 'budgeted', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0) }}
                style={{ ...inp, textAlign: 'right' }} />
              <button onClick={() => setDeleteConfirm({ ...bill, _type: 'bill' })} className="btn-danger" style={{ padding: '4px 8px', fontSize: 12 }}>Del</button>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 100px 60px', gap: 10, padding: '10px 16px', borderTop: '0.5px solid var(--c-border-light)', background: 'var(--c-bg-row)', alignItems: 'center' }}>
            <input type="text" placeholder="Bill name" value={newBill.name} onChange={e => setNewBill(p => ({ ...p, name: e.target.value }))} style={{ ...inp }} />
            <select value={newBill.category} onChange={e => setNewBill(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="text" placeholder="Amount" value={newBill.budgeted} onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setNewBill(p => ({ ...p, budgeted: e.target.value })) : null} style={{ ...inp, textAlign: 'right' }} />
            <button onClick={addBill} className="btn-primary" style={{ padding: '6px 10px', fontSize: 12 }}>Add</button>
          </div>
        </div>
      )}

      {tab === 'debts' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-header-row" style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 60px', gap: 10, padding: '8px 16px' }}>
            {['Name', 'Type', 'Balance', ''].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>
          {template.debts.map(debt => (
            <div key={debt.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 60px', gap: 10, padding: '9px 16px', borderBottom: '0.5px solid var(--c-border-light)', alignItems: 'center' }}>
              <input type="text" value={debt.name} onChange={e => updateDebt(debt.id, 'name', e.target.value)} style={{ ...inp }} />
              <select value={debt.type} onChange={e => updateDebt(debt.id, 'type', e.target.value)}>
                {DEBT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <input type="text" inputMode="decimal" value={debt.startingBalance}
                onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value) || e.target.value === '') updateDebt(debt.id, 'startingBalance', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0) }}
                style={{ ...inp, textAlign: 'right' }} />
              <button onClick={() => setDeleteConfirm({ ...debt, _type: 'debt' })} className="btn-danger" style={{ padding: '4px 8px', fontSize: 12 }}>Del</button>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 60px', gap: 10, padding: '10px 16px', borderTop: '0.5px solid var(--c-border-light)', background: 'var(--c-bg-row)', alignItems: 'center' }}>
            <input type="text" placeholder="Debt name" value={newDebt.name} onChange={e => setNewDebt(p => ({ ...p, name: e.target.value }))} style={{ ...inp }} />
            <select value={newDebt.type} onChange={e => setNewDebt(p => ({ ...p, type: e.target.value }))}>
              {DEBT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Balance" value={newDebt.startingBalance} onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setNewDebt(p => ({ ...p, startingBalance: e.target.value })) : null} style={{ ...inp, textAlign: 'right' }} />
            <button onClick={addDebt} className="btn-primary" style={{ padding: '6px 10px', fontSize: 12 }}>Add</button>
          </div>
        </div>
      )}

      {tab === 'preferences' && (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Currency */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Currency</div>
            <select
              value={currencyCode}
              onChange={e => handleCurrencyChange(e.target.value)}
              style={{ width: '100%', maxWidth: 320 }}
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} — {c.name}</option>
              ))}
            </select>
          </div>

          {/* Appearance */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Appearance</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { if (isDark) toggleTheme() }} style={pillStyle(!isDark)}>Light</button>
              <button onClick={() => { if (!isDark) toggleTheme() }} style={pillStyle(isDark)}>Dark</button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
