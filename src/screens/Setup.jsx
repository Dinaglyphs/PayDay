import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useCurrency } from '../context/CurrencyContext'

const CATEGORIES = ['Housing', 'Utilities', 'Debt repayment', 'Transport', 'Food & living', 'Savings', 'Personal', 'Other']
const DEBT_TYPES = ['Credit card', 'Loan', 'Personal']

const DEFAULT_BILLS = [
  { name: 'Rent / Mortgage', category: 'Housing' },
  { name: 'Council Tax', category: 'Housing' },
  { name: 'Electricity', category: 'Utilities' },
  { name: 'Gas', category: 'Utilities' },
  { name: 'Water', category: 'Utilities' },
  { name: 'Internet', category: 'Utilities' },
  { name: 'Mobile phone', category: 'Utilities' },
  { name: 'TV licence', category: 'Utilities' },
  { name: 'Groceries', category: 'Food & living' },
  { name: 'Transport / Fuel', category: 'Transport' },
]

function makeDefaultBills() {
  return DEFAULT_BILLS.map(b => ({ ...b, id: uuidv4(), budgeted: '' }))
}

export default function Setup({ onComplete }) {
  const { symbol } = useCurrency()
  const [bills, setBills] = useState(makeDefaultBills)
  const [debts, setDebts] = useState([])
  const [newBill, setNewBill] = useState({ name: '', budgeted: '', category: 'Housing' })
  const [newDebt, setNewDebt] = useState({ name: '', type: 'Credit card', startingBalance: '' })
  const [attempted, setAttempted] = useState(false)

  function updateBillAmount(id, val) {
    if (/^\d*\.?\d*$/.test(val) || val === '') {
      setBills(prev => prev.map(b => b.id === id ? { ...b, budgeted: val } : b))
    }
  }

  function updateBillName(id, val) {
    setBills(prev => prev.map(b => b.id === id ? { ...b, name: val } : b))
  }

  function updateBillCategory(id, val) {
    setBills(prev => prev.map(b => b.id === id ? { ...b, category: val } : b))
  }

  function addBill() {
    if (!newBill.name || !newBill.budgeted) return
    setBills(prev => [...prev, { ...newBill, id: uuidv4(), budgeted: newBill.budgeted }])
    setNewBill({ name: '', budgeted: '', category: 'Housing' })
  }

  function addDebt() {
    if (!newDebt.name || !newDebt.startingBalance) return
    const balance = parseFloat(newDebt.startingBalance)
    setDebts(prev => [...prev, { ...newDebt, id: uuidv4(), startingBalance: balance, originalBalance: balance }])
    setNewDebt({ name: '', type: 'Credit card', startingBalance: '' })
  }

  function removeBill(id) { setBills(prev => prev.filter(b => b.id !== id)) }
  function removeDebt(id) { setDebts(prev => prev.filter(d => d.id !== id)) }

  function handleFinish() {
    setAttempted(true)
    const billsInvalid = bills.some(b => !b.budgeted || parseFloat(b.budgeted) === 0)
    const debtsInvalid = debts.some(d => !d.startingBalance || parseFloat(d.startingBalance) === 0)
    if (billsInvalid || debtsInvalid) return
    const finalBills = bills.map(b => ({ ...b, budgeted: parseFloat(b.budgeted) }))
    const finalDebts = debts.map(d => ({
      ...d,
      startingBalance: parseFloat(d.startingBalance),
      originalBalance: parseFloat(d.startingBalance)
    }))
    onComplete({ bills: finalBills, debts: finalDebts })
  }

  const inp = {
    padding: '6px 10px', border: '0.5px solid var(--c-input-border)',
    borderRadius: 5, fontSize: 13, outline: 'none',
    background: 'var(--c-input-bg)', color: 'var(--c-text-1)'
  }

  const allValid = bills.every(b => b.budgeted && parseFloat(b.budgeted) > 0)
    && debts.every(d => d.startingBalance && parseFloat(d.startingBalance) > 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg-page)', padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 760, padding: '0 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--c-text-1)', margin: '0 0 6px' }}>
            Welcome to PayDay
            <span style={{ fontSize: 13, fontStyle: 'italic', color: '#CC3399', fontWeight: 400, marginLeft: 8, verticalAlign: 'super', letterSpacing: '0.02em' }}>by Dinaglyphs</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--c-text-3)', margin: 0 }}>Enter your bill amounts to get started. Remove any that don't apply. You can change these later in Settings.</p>
        </div>

        {/* Bills */}
        <div style={{ background: 'var(--c-bg-card)', border: '0.5px solid var(--c-border)', borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--c-border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text-1)', margin: 0 }}>Recurring bills</h2>
          </div>

          {bills.map(bill => {
            const invalid = attempted && (!bill.budgeted || parseFloat(bill.budgeted) === 0)
            return (
              <div key={bill.id} className="setup-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: '0.5px solid var(--c-border-light)' }}>
                <input
                  type="text"
                  value={bill.name}
                  onChange={e => updateBillName(bill.id, e.target.value)}
                  className="setup-row-name"
                  style={{ ...inp, flex: 1 }}
                />
                <select
                  value={bill.category}
                  onChange={e => updateBillCategory(bill.id, e.target.value)}
                  className="setup-row-cat"
                  style={{ ...inp, padding: '6px 8px', fontSize: 12 }}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', fontSize: 13 }}>{symbol}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={bill.budgeted}
                      onChange={e => updateBillAmount(bill.id, e.target.value)}
                      style={{
                        ...inp,
                        width: 90,
                        paddingLeft: 20,
                        border: invalid ? '0.5px solid #dc2626' : '0.5px solid var(--c-input-border)'
                      }}
                    />
                  </div>
                  {invalid && (
                    <span style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>Enter an amount to continue</span>
                  )}
                </div>
                <button onClick={() => removeBill(bill.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-4)', fontSize: 16, padding: '2px 4px', flexShrink: 0 }}>×</button>
              </div>
            )
          })}

          {/* Add new bill row */}
          <div className="setup-row" style={{ padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'center', borderTop: '0.5px solid var(--c-border-light)' }}>
            <input type="text" placeholder="Bill name" value={newBill.name} onChange={e => setNewBill(p => ({ ...p, name: e.target.value }))} className="setup-row-name" style={{ ...inp, flex: 1 }} />
            <select value={newBill.category} onChange={e => setNewBill(p => ({ ...p, category: e.target.value }))} className="setup-row-cat" style={{ ...inp, padding: '6px 8px', fontSize: 12 }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="text" placeholder="Amount" value={newBill.budgeted} onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setNewBill(p => ({ ...p, budgeted: e.target.value })) : null} style={{ ...inp, width: 90 }} />
            <button onClick={addBill} style={{ padding: '6px 14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, cursor: 'pointer' }}>Add</button>
          </div>
        </div>

        {/* Debts */}
        <div style={{ background: 'var(--c-bg-card)', border: '0.5px solid var(--c-border)', borderRadius: 10, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--c-border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text-1)', margin: 0 }}>Debts <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--c-text-4)' }}>(optional)</span></h2>
          </div>

          {debts.map(debt => {
            const invalid = attempted && (!debt.startingBalance || parseFloat(debt.startingBalance) === 0)
            return (
              <div key={debt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: '0.5px solid var(--c-border-light)' }}>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--c-text-1)' }}>{debt.name}</span>
                <span style={{ fontSize: 12, color: 'var(--c-text-4)', minWidth: 80 }}>{debt.type}</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', fontSize: 13 }}>{symbol}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={typeof debt.startingBalance === 'number' ? debt.startingBalance : ''}
                      readOnly
                      style={{ ...inp, width: 100, paddingLeft: 20, border: invalid ? '0.5px solid #dc2626' : '0.5px solid var(--c-input-border)' }}
                    />
                  </div>
                  {invalid && (
                    <span style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>Enter an amount to continue</span>
                  )}
                </div>
                <button onClick={() => removeDebt(debt.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-4)', fontSize: 16, padding: '2px 4px', flexShrink: 0 }}>×</button>
              </div>
            )
          })}

          <div className="setup-row" style={{ padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'center', borderTop: '0.5px solid var(--c-border-light)' }}>
            <input type="text" placeholder="Debt name" value={newDebt.name} onChange={e => setNewDebt(p => ({ ...p, name: e.target.value }))} className="setup-row-name" style={{ ...inp, flex: 1 }} />
            <select value={newDebt.type} onChange={e => setNewDebt(p => ({ ...p, type: e.target.value }))} className="setup-row-cat" style={{ ...inp, padding: '6px 8px', fontSize: 12 }}>
              {DEBT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Balance" value={newDebt.startingBalance} onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setNewDebt(p => ({ ...p, startingBalance: e.target.value })) : null} style={{ ...inp, width: 90 }} />
            <button onClick={addDebt} style={{ padding: '6px 14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, cursor: 'pointer' }}>Add</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleFinish}
            style={{
              padding: '12px 28px', background: allValid ? '#166534' : '#9ca3af',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
              fontWeight: 500, cursor: allValid ? 'pointer' : 'not-allowed'
            }}
          >
            Finish setup →
          </button>
          {attempted && !allValid && (
            <span style={{ fontSize: 13, color: '#dc2626' }}>Enter amounts for all bills to continue</span>
          )}
        </div>
      </div>
    </div>
  )
}
