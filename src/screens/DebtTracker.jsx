import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useCurrency } from '../context/CurrencyContext'

const DEBT_TYPES = ['Credit card', 'Loan', 'Personal']

function getProjection(debt, cycles) {
  if (cycles.length < 2) return null
  const snaps = cycles
    .map(c => (c.debtSnapshots || []).find(s => s.id === debt.id))
    .filter(Boolean)
    .map(s => s.balance)
  if (snaps.length < 2) return null
  const reductions = []
  for (let i = 1; i < snaps.length; i++) {
    reductions.push(snaps[i - 1] - snaps[i])
  }
  const avg = reductions.reduce((a, b) => a + b, 0) / reductions.length
  if (avg <= 0) return null
  const current = parseFloat(debt.startingBalance) || 0
  const months = Math.ceil(current / avg)
  if (months <= 0) return 'Cleared'
  if (months < 12) return `~${months} month${months !== 1 ? 's' : ''}`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `~${years}y ${rem}mo` : `~${years} year${years !== 1 ? 's' : ''}`
}

export default function DebtTracker({ data, persist }) {
  const { formatAmount: formatCurrency, symbol } = useCurrency()
  const template = data.template
  const debts = template.debts || []
  const [newDebt, setNewDebt] = useState({ name: '', type: 'Credit card', startingBalance: '' })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [editingBalance, setEditingBalance] = useState({})

  const totalOutstanding = debts.reduce((s, d) => s + (parseFloat(d.startingBalance) || 0), 0)
  const totalPaid = debts.reduce((s, d) => {
    const orig = parseFloat(d.originalBalance ?? d.startingBalance) || 0
    const current = parseFloat(d.startingBalance) || 0
    return s + Math.max(0, orig - current)
  }, 0)

  function updateDebt(id, field, value) {
    const updated = { ...template, debts: template.debts.map(d => d.id === id ? { ...d, [field]: value } : d) }
    persist({ ...data, template: updated })
  }

  function addDebt() {
    if (!newDebt.name.trim() || !newDebt.startingBalance) return
    const balance = parseFloat(newDebt.startingBalance)
    const updated = {
      ...template,
      debts: [...template.debts, {
        ...newDebt,
        id: uuidv4(),
        startingBalance: balance,
        originalBalance: balance
      }]
    }
    persist({ ...data, template: updated })
    setNewDebt({ name: '', type: 'Credit card', startingBalance: '' })
  }

  function deleteDebt(id) {
    const updated = { ...template, debts: template.debts.filter(d => d.id !== id) }
    persist({ ...data, template: updated })
    setDeleteConfirm(null)
  }

  const cycles = data.cycles || []

  return (
    <div className="content-page" style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 16, fontWeight: 500, color: 'var(--c-text-1)', margin: '0 0 20px' }}>Debt tracker</h1>

      {/* Top summary */}
      <div className="stats-grid-2" style={{ gap: 12, marginBottom: 24 }}>
        <div className="glass-card stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            Total outstanding
          </div>
          <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--c-text-1)' }}>{formatCurrency(totalOutstanding)}</div>
        </div>
        <div className="glass-card stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            Total paid off
          </div>
          <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--c-sorted-text)' }}>{formatCurrency(totalPaid)}</div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ width: 340 }}>
            <p style={{ fontSize: 14, color: 'var(--c-text-1)', margin: '0 0 16px' }}>
              Delete <strong>{deleteConfirm.name}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }}>Cancel</button>
              <button onClick={() => deleteDebt(deleteConfirm.id)} className="btn-danger" style={{ padding: '7px 14px', fontSize: 13, background: 'rgba(226,75,74,0.25)', fontWeight: 500 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Debt cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {debts.map(debt => {
          const originalBalance = parseFloat(debt.originalBalance ?? debt.startingBalance) || 0
          const currentBalance = parseFloat(debt.startingBalance) || 0
          const paid = Math.max(0, originalBalance - currentBalance)
          const pct = originalBalance > 0 ? Math.max(0, Math.min(100, (paid / originalBalance) * 100)) : 0
          const projection = getProjection(debt, cycles)
          const balVal = editingBalance[debt.id] !== undefined ? editingBalance[debt.id] : debt.startingBalance

          return (
            <div key={debt.id} className="glass-card" style={{ padding: '18px 20px' }}>
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 2 }}>{debt.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-4)' }}>{debt.type}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--c-text-4)', marginBottom: 3 }}>Current balance</div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', fontSize: 13 }}>{symbol}</span>
                      <input
                        type="text" inputMode="decimal" value={balVal}
                        onChange={e => {
                          if (/^\d*\.?\d*$/.test(e.target.value) || e.target.value === '') {
                            setEditingBalance(prev => ({ ...prev, [debt.id]: e.target.value }))
                          }
                        }}
                        onBlur={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                          updateDebt(debt.id, 'startingBalance', val)
                          setEditingBalance(prev => { const n = { ...prev }; delete n[debt.id]; return n })
                        }}
                        style={{
                          width: 100, padding: '5px 8px 5px 22px',
                          border: '0.5px solid var(--c-input-border)', borderRadius: 6,
                          fontSize: 13, textAlign: 'right',
                          background: 'var(--c-input-bg)', color: 'var(--c-text-1)', outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                  <button onClick={() => setDeleteConfirm(debt)} className="btn-danger" style={{ padding: '5px 8px', fontSize: 11 }}>
                    Delete
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="debt-stats-row" style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Original balance</div>
                  <div style={{ fontSize: 13, color: 'var(--c-text-2)' }}>{formatCurrency(originalBalance)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Total paid</div>
                  <div style={{ fontSize: 13, color: paid > 0 ? 'var(--c-sorted-text)' : 'var(--c-text-2)', fontWeight: paid > 0 ? 500 : 400 }}>{formatCurrency(paid)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Projection</div>
                  <div style={{ fontSize: 13, color: projection ? 'var(--c-sorted-text)' : 'var(--c-text-4)', fontStyle: projection ? 'normal' : 'italic' }}>
                    {projection || (cycles.length < 2 ? 'Add more cycles for projection' : '—')}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--c-text-4)', marginBottom: 4 }}>
                  <span>{Math.round(pct)}% paid off</span>
                  <span>{formatCurrency(currentBalance)} remaining</span>
                </div>
                <div className="progress-track" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add debt form */}
      <div className="glass-card" style={{ padding: '16px 20px', marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-3)', marginBottom: 10 }}>Add debt</div>
        <div className="add-debt-form">
          <input
            type="text" placeholder="Debt name" value={newDebt.name}
            onChange={e => setNewDebt(p => ({ ...p, name: e.target.value }))}
            className="add-debt-name"
            style={{ padding: '7px 10px', border: '0.5px solid var(--c-input-border)', borderRadius: 6, fontSize: 13, outline: 'none', background: 'var(--c-input-bg)', color: 'var(--c-text-1)' }}
          />
          <select
            value={newDebt.type}
            onChange={e => setNewDebt(p => ({ ...p, type: e.target.value }))}
            style={{ borderRadius: 6, fontSize: 13 }}
          >
            {DEBT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input
            type="text" placeholder="Balance" value={newDebt.startingBalance}
            onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setNewDebt(p => ({ ...p, startingBalance: e.target.value })) : null}
            style={{ width: 100, padding: '7px 10px', border: '0.5px solid var(--c-input-border)', borderRadius: 6, fontSize: 13, outline: 'none', textAlign: 'right', background: 'var(--c-input-bg)', color: 'var(--c-text-1)' }}
          />
          <button onClick={addDebt} className="btn-primary" style={{ padding: '7px 18px', fontSize: 13 }}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
