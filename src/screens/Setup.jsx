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
    if (/^\d*\.?\d*$/.test(val) || val === '')
      setBills(prev => prev.map(b => b.id === id ? { ...b, budgeted: val } : b))
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
    onComplete({
      bills: bills.map(b => ({ ...b, budgeted: parseFloat(b.budgeted) })),
      debts: debts.map(d => ({ ...d, startingBalance: parseFloat(d.startingBalance), originalBalance: parseFloat(d.startingBalance) })),
    })
  }

  const allValid = bills.every(b => b.budgeted && parseFloat(b.budgeted) > 0)
    && debts.every(d => d.startingBalance && parseFloat(d.startingBalance) > 0)

  const inp = {
    padding: '7px 10px', border: '1px solid var(--c-input-border)',
    borderRadius: 6, fontSize: 13, outline: 'none',
    background: 'var(--c-input-bg)', color: 'var(--c-text-1)', width: '100%',
  }

  const colHeader = {
    fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.5px', color: 'var(--c-text-4)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg-page)', padding: '36px 0 60px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 680, padding: '0 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <img
            src="/icon-source.png"
            alt="PayDay"
            style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'contain', display: 'block', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(153,0,153,0.3)' }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--c-text-1)', margin: '0 0 4px' }}>
            Set up PayDay
          </h1>
          <div style={{ fontSize: 13, fontStyle: 'italic', color: '#CC3399', marginBottom: 10 }}>by Dinaglyphs</div>
          <p style={{ fontSize: 13, color: 'var(--c-text-3)', margin: 0, lineHeight: 1.6 }}>
            Add the bills you pay each month and enter the usual amount for each. You can edit these any time in Settings.
          </p>
        </div>

        {/* ── Recurring Bills ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, #990099, #CC3399)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/>
                <polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text-1)' }}>Recurring bills</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-4)' }}>Enter the monthly amount for each bill. Remove any that don't apply.</div>
            </div>
          </div>

          <div style={{ background: 'var(--c-bg-card)', border: '1px solid var(--c-border)', borderRadius: 12, overflow: 'hidden' }}>

            {/* Column headers */}
            <div className="setup-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 6px', background: 'var(--c-bg-row)', borderBottom: '1px solid var(--c-border)' }}>
              <div className="setup-row-name" style={{ ...colHeader }}>Bill name</div>
              <div className="setup-row-cat"  style={{ ...colHeader }}>Category</div>
              <div style={{ width: 90, ...colHeader, textAlign: 'right' }}>Amount</div>
              <div style={{ width: 24 }} />
            </div>

            {/* Bill rows */}
            {bills.map((bill, idx) => {
              const invalid = attempted && (!bill.budgeted || parseFloat(bill.budgeted) === 0)
              return (
                <div
                  key={bill.id}
                  className="setup-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 14px',
                    borderBottom: idx < bills.length - 1 ? '1px solid var(--c-border-light)' : 'none',
                    background: idx % 2 === 1 ? 'var(--c-bg-row)' : 'var(--c-bg-card)',
                  }}
                >
                  <input
                    type="text" value={bill.name}
                    onChange={e => updateBillName(bill.id, e.target.value)}
                    className="setup-row-name"
                    style={{ ...inp }}
                    placeholder="Bill name"
                  />
                  <select
                    value={bill.category}
                    onChange={e => updateBillCategory(bill.id, e.target.value)}
                    className="setup-row-cat"
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <div style={{ position: 'relative', width: 90, flexShrink: 0 }}>
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', fontSize: 12, pointerEvents: 'none' }}>{symbol}</span>
                    <input
                      type="text" inputMode="decimal" placeholder="0.00" value={bill.budgeted}
                      onChange={e => updateBillAmount(bill.id, e.target.value)}
                      style={{
                        ...inp, paddingLeft: 20, textAlign: 'right',
                        border: invalid ? '1px solid #dc2626' : '1px solid var(--c-input-border)',
                      }}
                    />
                  </div>
                  <button
                    onClick={() => removeBill(bill.id)}
                    title="Remove bill"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-4)', fontSize: 16, padding: '2px 4px', flexShrink: 0, lineHeight: 1 }}
                  >×</button>
                </div>
              )
            })}

            {/* Add new bill */}
            <div
              className="setup-row"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px',
                borderTop: '2px dashed var(--c-border)',
                background: 'var(--c-bg-row)',
              }}
            >
              <input
                type="text" placeholder="+ New bill name" value={newBill.name}
                onChange={e => setNewBill(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addBill()}
                className="setup-row-name"
                style={{ ...inp }}
              />
              <select
                value={newBill.category}
                onChange={e => setNewBill(p => ({ ...p, category: e.target.value }))}
                className="setup-row-cat"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <div style={{ position: 'relative', width: 90, flexShrink: 0 }}>
                <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', fontSize: 12, pointerEvents: 'none' }}>{symbol}</span>
                <input
                  type="text" inputMode="decimal" placeholder="0.00" value={newBill.budgeted}
                  onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setNewBill(p => ({ ...p, budgeted: e.target.value })) : null}
                  onKeyDown={e => e.key === 'Enter' && addBill()}
                  style={{ ...inp, paddingLeft: 20, textAlign: 'right' }}
                />
              </div>
              <button
                onClick={addBill}
                style={{
                  padding: '6px 12px', background: 'linear-gradient(135deg,#990099,#CC3399)',
                  color: '#fff', border: 'none', borderRadius: 6, fontSize: 12,
                  fontWeight: 500, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                }}
              >Add</button>
            </div>
          </div>
          {attempted && bills.some(b => !b.budgeted || parseFloat(b.budgeted) === 0) && (
            <p style={{ fontSize: 12, color: '#dc2626', margin: '6px 0 0' }}>
              Enter an amount for every bill before continuing.
            </p>
          )}
        </div>

        {/* ── Debts ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'rgba(226,75,74,0.15)',
              border: '1px solid rgba(226,75,74,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text-1)' }}>
                Debts <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--c-text-4)' }}>(optional)</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-text-4)' }}>Credit cards, loans, or anything you're paying down. PayDay tracks your progress.</div>
            </div>
          </div>

          <div style={{ background: 'var(--c-bg-card)', border: '1px solid var(--c-border)', borderRadius: 12, overflow: 'hidden' }}>

            {/* Column headers */}
            <div className="setup-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 6px', background: 'var(--c-bg-row)', borderBottom: '1px solid var(--c-border)' }}>
              <div className="setup-row-name" style={{ ...colHeader }}>Debt name</div>
              <div className="setup-row-cat"  style={{ ...colHeader }}>Type</div>
              <div style={{ width: 90, ...colHeader, textAlign: 'right' }}>Balance</div>
              <div style={{ width: 24 }} />
            </div>

            {/* Debt rows */}
            {debts.length === 0 && (
              <div style={{ padding: '16px 14px', fontSize: 13, color: 'var(--c-text-4)', fontStyle: 'italic' }}>
                No debts added yet. Use the row below to add one.
              </div>
            )}
            {debts.map((debt, idx) => (
              <div
                key={debt.id}
                className="setup-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 14px',
                  borderBottom: idx < debts.length - 1 ? '1px solid var(--c-border-light)' : 'none',
                  background: idx % 2 === 1 ? 'var(--c-bg-row)' : 'var(--c-bg-card)',
                }}
              >
                <span className="setup-row-name" style={{ fontSize: 13, color: 'var(--c-text-1)', fontWeight: 500 }}>{debt.name}</span>
                <span className="setup-row-cat" style={{ fontSize: 12, color: 'var(--c-text-3)' }}>{debt.type}</span>
                <span style={{ width: 90, flexShrink: 0, fontSize: 13, fontWeight: 500, color: 'var(--c-text-1)', textAlign: 'right' }}>
                  {symbol}{parseFloat(debt.startingBalance).toLocaleString()}
                </span>
                <button
                  onClick={() => removeDebt(debt.id)}
                  title="Remove debt"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-4)', fontSize: 16, padding: '2px 4px', flexShrink: 0, lineHeight: 1 }}
                >×</button>
              </div>
            ))}

            {/* Add new debt */}
            <div
              className="setup-row"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px',
                borderTop: debts.length > 0 ? '2px dashed var(--c-border)' : 'none',
                background: 'var(--c-bg-row)',
              }}
            >
              <input
                type="text" placeholder="+ Debt name" value={newDebt.name}
                onChange={e => setNewDebt(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addDebt()}
                className="setup-row-name"
                style={{ ...inp }}
              />
              <select
                value={newDebt.type}
                onChange={e => setNewDebt(p => ({ ...p, type: e.target.value }))}
                className="setup-row-cat"
              >
                {DEBT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <div style={{ position: 'relative', width: 90, flexShrink: 0 }}>
                <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', fontSize: 12, pointerEvents: 'none' }}>{symbol}</span>
                <input
                  type="text" inputMode="decimal" placeholder="0.00" value={newDebt.startingBalance}
                  onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setNewDebt(p => ({ ...p, startingBalance: e.target.value })) : null}
                  onKeyDown={e => e.key === 'Enter' && addDebt()}
                  style={{ ...inp, paddingLeft: 20, textAlign: 'right' }}
                />
              </div>
              <button
                onClick={addDebt}
                style={{
                  padding: '6px 12px', background: 'rgba(226,75,74,0.15)',
                  color: '#E24B4A', border: '1px solid rgba(226,75,74,0.35)', borderRadius: 6, fontSize: 12,
                  fontWeight: 500, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                }}
              >Add</button>
            </div>
          </div>
        </div>

        {/* Finish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={handleFinish}
            className="btn-primary"
            style={{ padding: '12px 32px', fontSize: 14, fontWeight: 500 }}
          >
            Finish setup →
          </button>
          {attempted && !allValid && (
            <span style={{ fontSize: 13, color: '#dc2626' }}>
              Enter amounts for all bills to continue.
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
