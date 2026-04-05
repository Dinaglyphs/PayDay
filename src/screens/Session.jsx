import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import StatCard from '../components/StatCard'
import BillRow from '../components/BillRow'
import StartSessionModal from '../components/StartSessionModal'
import CloseSessionModal from '../components/CloseSessionModal'
import { useCurrency } from '../context/CurrencyContext'

const CATEGORIES = ['Housing', 'Utilities', 'Debt repayment', 'Transport', 'Food & living', 'Savings', 'Personal', 'Other']

function guessCategory(name) {
  const n = name.toLowerCase()
  if (/rent|mortgage|council tax/.test(n)) return 'Housing'
  if (/water|electricity|gas|broadband|internet|utility/.test(n)) return 'Utilities'
  if (/loan|credit|card|debt|klarna|aqua|lendable|lemfi|capital one|ppay/.test(n)) return 'Debt repayment'
  if (/train|bus|fuel|transport|travel|car|tube|rail/.test(n)) return 'Transport'
  if (/food|grocery|supermarket|phone|shop|coffee|lunch|dinner/.test(n)) return 'Food & living'
  if (/ajo|saving|pension|isa/.test(n)) return 'Savings'
  if (/gym|cim|netflix|spotify|amazon|subscription|refund/.test(n)) return 'Personal'
  return 'Other'
}

export default function Session({ data, persist }) {
  const { formatAmount: formatCurrency, symbol } = useCurrency()
  const [showStart, setShowStart] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [newBill, setNewBill] = useState({ name: '', amount: '', category: 'Other' })
  const [showAddBill, setShowAddBill] = useState(false)
  const [payingDebt, setPayingDebt] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [editingDebt,   setEditingDebt]   = useState(null)
  const [editAmount,    setEditAmount]    = useState('')
  const [editingIncome, setEditingIncome] = useState(false)
  const [incomePaycheck, setIncomePaycheck] = useState('')
  const [incomeOther,    setIncomeOther]    = useState('')

  const session = data.activeSession
  const template = data.template

  function startSession(paycheck, otherIncome) {
    const newSession = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      paycheck, otherIncome, totalIncome: paycheck + otherIncome,
      bills: template.bills.map(b => ({ ...b, actual: b.budgeted, status: 'untouched' })),
      debtSnapshots: template.debts.map(d => ({ id: d.id, name: d.name, balance: d.startingBalance })),
      debtPayments: []
    }
    persist({ ...data, activeSession: newSession })
    setShowStart(false)
  }

  function makeDebtPayment(debtId, debtName) {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) { setPayingDebt(null); setPayAmount(''); return }

    const newTemplate = {
      ...template,
      debts: template.debts.map(d =>
        d.id === debtId
          ? { ...d, startingBalance: Math.max(0, (parseFloat(d.startingBalance) || 0) - amount) }
          : d
      )
    }
    const newSnapshots = (session.debtSnapshots || []).map(s =>
      s.id === debtId ? { ...s, balance: Math.max(0, (parseFloat(s.balance) || 0) - amount) } : s
    )
    const existing = session.debtPayments || []
    const idx = existing.findIndex(p => p.debtId === debtId)
    const newPayments = idx >= 0
      ? existing.map((p, i) => i === idx ? { ...p, amountPaid: p.amountPaid + amount } : p)
      : [...existing, { debtId, debtName, amountPaid: amount }]

    persist({
      ...data,
      template: newTemplate,
      activeSession: { ...session, debtSnapshots: newSnapshots, debtPayments: newPayments }
    })
    setPayingDebt(null)
    setPayAmount('')
  }

  function updateDebtPayment(debtId, debtName, oldAmount) {
    const newAmount = parseFloat(editAmount)
    if (!newAmount || newAmount < 0) { setEditingDebt(null); setEditAmount(''); return }
    const diff = newAmount - oldAmount

    const newTemplate = {
      ...template,
      debts: template.debts.map(d =>
        d.id === debtId
          ? { ...d, startingBalance: Math.max(0, (parseFloat(d.startingBalance) || 0) - diff) }
          : d
      )
    }
    const newSnapshots = (session.debtSnapshots || []).map(s =>
      s.id === debtId ? { ...s, balance: Math.max(0, (parseFloat(s.balance) || 0) - diff) } : s
    )
    const newPayments = (session.debtPayments || []).map(p =>
      p.debtId === debtId ? { ...p, amountPaid: newAmount } : p
    )
    persist({
      ...data,
      template: newTemplate,
      activeSession: { ...session, debtSnapshots: newSnapshots, debtPayments: newPayments }
    })
    setEditingDebt(null)
    setEditAmount('')
  }

  function updateBillStatus(billId, status) {
    persist({ ...data, activeSession: { ...session, bills: session.bills.map(b => b.id === billId ? { ...b, status } : b) } })
  }

  function updateBillActual(billId, actual) {
    persist({ ...data, activeSession: { ...session, bills: session.bills.map(b => b.id === billId ? { ...b, actual } : b) } })
  }

  function updateTemplateAmount(billId, amount) {
    persist({ ...data, template: { ...template, bills: template.bills.map(b => b.id === billId ? { ...b, budgeted: amount } : b) } })
  }

  function addSessionBill() {
    if (!newBill.name.trim() || !newBill.amount) return
    const bill = { id: uuidv4(), name: newBill.name.trim(), budgeted: parseFloat(newBill.amount), actual: parseFloat(newBill.amount), category: newBill.category, status: 'untouched', sessionOnly: true }
    persist({ ...data, activeSession: { ...session, bills: [...session.bills, bill] } })
    setNewBill({ name: '', amount: '', category: 'Other' })
    setShowAddBill(false)
  }

  function handleNewBillNameChange(name) {
    setNewBill(prev => ({ ...prev, name, category: name.length > 2 ? guessCategory(name) : prev.category }))
  }

  function openEditIncome() {
    setIncomePaycheck(String(session.paycheck || ''))
    setIncomeOther(String(session.otherIncome || ''))
    setEditingIncome(true)
  }

  function saveIncome() {
    const paycheck    = parseFloat(incomePaycheck) || 0
    const otherIncome = parseFloat(incomeOther) || 0
    persist({ ...data, activeSession: { ...session, paycheck, otherIncome, totalIncome: paycheck + otherIncome } })
    setEditingIncome(false)
  }

  function closeSession(debtSnapshots) {
    persist({
      ...data,
      cycles: [...(data.cycles || []), { ...session, debtSnapshots, closedAt: new Date().toISOString() }],
      activeSession: null
    })
    setShowClose(false)
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
        {showStart && <StartSessionModal onConfirm={startSession} onClose={() => setShowStart(false)} />}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, color: 'var(--c-text-3)', marginBottom: 20 }}>No active session</div>
          <button onClick={() => setShowStart(true)} className="btn-primary" style={{ padding: '11px 28px', fontSize: 14 }}>
            Start new session
          </button>
        </div>
      </div>
    )
  }

  const confirmedOut = session.bills.filter(b => b.status === 'sorted').reduce((s, b) => s + (parseFloat(b.actual) || 0), 0)
  const debtPaid = (session.debtPayments || []).reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0)
  const inMotion = session.bills.filter(b => b.status === 'pending').reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)
  const remaining = session.totalIncome - confirmedOut - debtPaid - inMotion
  const actioned = session.bills.filter(b => b.status !== 'untouched').length
  const progressPct = session.bills.length > 0 ? Math.round((actioned / session.bills.length) * 100) : 0
  const sortedTotal = session.bills.filter(b => b.status === 'sorted').reduce((s, b) => s + (parseFloat(b.actual) || 0), 0)
  const pendingTotal = session.bills.filter(b => b.status === 'pending').reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)
  const skippedTotal = session.bills.filter(b => b.status === 'skipped').reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)
  const untouchedTotal = session.bills.filter(b => b.status === 'untouched').reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)

  return (
    <div className="content-page" style={{ maxWidth: 900 }}>
      {showStart && <StartSessionModal onConfirm={startSession} onClose={() => setShowStart(false)} />}
      {showClose && <CloseSessionModal session={session} template={template} onConfirm={closeSession} onClose={() => setShowClose(false)} />}

      {/* Edit income modal */}
      {editingIncome && (
        <div className="modal-overlay">
          <div className="modal-panel" style={{ width: 340 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 18 }}>Edit income</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 4 }}>Paycheck</label>
                <input
                  autoFocus type="text" inputMode="decimal" value={incomePaycheck}
                  onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setIncomePaycheck(e.target.value) : null}
                  style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--c-input-border)', borderRadius: 6, fontSize: 14, background: 'var(--c-input-bg)', color: 'var(--c-text-1)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 4 }}>Other income</label>
                <input
                  type="text" inputMode="decimal" value={incomeOther}
                  onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setIncomeOther(e.target.value) : null}
                  style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--c-input-border)', borderRadius: 6, fontSize: 14, background: 'var(--c-input-bg)', color: 'var(--c-text-1)', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingIncome(false)} className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }}>Cancel</button>
              <button onClick={saveIncome} className="btn-primary" style={{ padding: '7px 18px', fontSize: 13 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 500, color: 'var(--c-text-1)', margin: '0 0 2px' }}>Payday session</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--c-text-4)' }}>{session.date}</span>
            <button
              onClick={openEditIncome}
              style={{ fontSize: 11, color: 'var(--c-text-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              edit income
            </button>
          </div>
        </div>
        <button onClick={() => setShowClose(true)} className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13, flexShrink: 0 }}>
          Close cycle
        </button>
      </div>

      <div className="stats-grid-4" style={{ marginBottom: 16 }}>
        <StatCard label="Total income" value={formatCurrency(session.totalIncome)} />
        <StatCard label="Confirmed out" value={formatCurrency(confirmedOut + debtPaid)} color="var(--c-sorted-text)" />
        <StatCard label="In motion" value={formatCurrency(inMotion)} color="var(--c-pending-text)" />
        <StatCard label="Remaining" value={formatCurrency(remaining)} color={remaining >= 0 ? 'var(--c-sorted-text)' : 'var(--c-skipped-text)'} />
      </div>

      {/* Bills card */}
      <div className="glass-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--c-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text-1)' }}>Bills</span>
            <span style={{ fontSize: 12, color: 'var(--c-text-4)' }}>{actioned} of {session.bills.length} actioned</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="table-header-row bill-list-header" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px' }}>
          <div style={{ width: 8 }} />
          <div style={{ flex: 1, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bill</div>
          <div className="col-budgeted" style={{ minWidth: 70, fontSize: 11, fontWeight: 500, textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Budgeted</div>
          <div style={{ minWidth: 80, fontSize: 11, fontWeight: 500, textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actual</div>
          <div style={{ minWidth: 80, fontSize: 11, fontWeight: 500, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
        </div>

        {session.bills.map(bill => (
          <BillRow
            key={bill.id} bill={bill} isSessionOnly={bill.sessionOnly}
            onStatusChange={status => updateBillStatus(bill.id, status)}
            onActualChange={actual => updateBillActual(bill.id, actual)}
            onUpdateTemplate={bill.sessionOnly ? null : amount => updateTemplateAmount(bill.id, amount)}
          />
        ))}

        {showAddBill ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderTop: '0.5px solid var(--c-border)', background: 'var(--c-bg-row)' }}>
            <div style={{ width: 8, flexShrink: 0 }} />
            <input
              autoFocus type="text" placeholder="Bill name" value={newBill.name}
              onChange={e => handleNewBillNameChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSessionBill()}
              style={{ flex: 1, padding: '5px 8px', border: '0.5px solid var(--c-input-border)', borderRadius: 5, fontSize: 13, outline: 'none', background: 'var(--c-input-bg)', color: 'var(--c-text-1)' }}
            />
            <select
              value={newBill.category}
              onChange={e => setNewBill(p => ({ ...p, category: e.target.value }))}
              style={{ borderRadius: 5, fontSize: 12 }}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              type="text" inputMode="decimal" placeholder="Amount" value={newBill.amount}
              onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setNewBill(p => ({ ...p, amount: e.target.value })) : null}
              onKeyDown={e => e.key === 'Enter' && addSessionBill()}
              style={{ width: 80, padding: '5px 8px', border: '0.5px solid var(--c-input-border)', borderRadius: 5, fontSize: 13, textAlign: 'right', outline: 'none', background: 'var(--c-input-bg)', color: 'var(--c-text-1)' }}
            />
            <button onClick={addSessionBill} className="btn-primary" style={{ padding: '5px 14px', fontSize: 13 }}>Add</button>
            <button onClick={() => { setShowAddBill(false); setNewBill({ name: '', amount: '', category: 'Other' }) }}
              className="btn-secondary" style={{ padding: '5px 10px', fontSize: 13 }}>Cancel</button>
          </div>
        ) : (
          <div style={{ padding: '10px 14px', borderTop: '0.5px solid var(--c-border-light)' }}>
            <button onClick={() => setShowAddBill(true)} style={{ background: 'none', border: 'none', color: 'var(--c-text-3)', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add one-off bill
            </button>
          </div>
        )}
      </div>

      <div className="session-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Debt snapshot */}
        <div className="glass-card" style={{ padding: '16px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 14 }}>Debt snapshot</div>
          {(template.debts || []).map(debt => {
            const snap = (session.debtSnapshots || []).find(s => s.id === debt.id)
            const balance = snap ? parseFloat(snap.balance) || 0 : parseFloat(debt.startingBalance) || 0
            const originalBalance = parseFloat(debt.originalBalance ?? debt.startingBalance) || 0
            const paid = Math.max(0, originalBalance - balance)
            const pct = originalBalance > 0 ? Math.min(100, (paid / originalBalance) * 100) : (balance <= 0 ? 100 : 0)
            const cyclePayment = (session.debtPayments || []).find(p => p.debtId === debt.id)
            const isPaying = payingDebt?.id === debt.id

            return (
              <div key={debt.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: 'var(--c-text-2)' }}>{debt.name}</span>
                    {cyclePayment && editingDebt?.id !== debt.id && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                        <span style={{ fontSize: 10, color: 'var(--c-sorted-text)' }}>✓ paid {formatCurrency(cyclePayment.amountPaid)} this cycle</span>
                        <button
                          onClick={() => { setEditingDebt({ id: debt.id, name: debt.name, oldAmount: cyclePayment.amountPaid }); setEditAmount(String(cyclePayment.amountPaid)); setPayingDebt(null) }}
                          style={{ fontSize: 9, color: 'var(--c-text-4)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', textDecoration: 'underline' }}
                        >edit</button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-1)' }}>{formatCurrency(balance)}</span>
                    {!isPaying && (
                      <button
                        onClick={() => { setPayingDebt({ id: debt.id, name: debt.name }); setPayAmount('') }}
                        style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 4,
                          border: '0.5px solid var(--c-input-border)',
                          background: 'transparent', color: 'var(--c-text-3)',
                          cursor: 'pointer', whiteSpace: 'nowrap'
                        }}
                      >Pay</button>
                    )}
                  </div>
                </div>

                {isPaying && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 4 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', fontSize: 12 }}>{symbol}</span>
                      <input
                        autoFocus type="text" inputMode="decimal" placeholder="0.00"
                        value={payAmount}
                        onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setPayAmount(e.target.value) : null}
                        onKeyDown={e => {
                          if (e.key === 'Enter') makeDebtPayment(debt.id, debt.name)
                          if (e.key === 'Escape') { setPayingDebt(null); setPayAmount('') }
                        }}
                        style={{ width: '100%', padding: '4px 6px 4px 20px', border: '0.5px solid var(--c-input-border)', borderRadius: 4, fontSize: 12, outline: 'none', background: 'var(--c-input-bg)', color: 'var(--c-text-1)' }}
                      />
                    </div>
                    <button onClick={() => makeDebtPayment(debt.id, debt.name)} style={{ padding: '4px 8px', background: 'rgba(99,153,34,0.2)', color: 'var(--c-sorted-text)', border: '1px solid rgba(99,153,34,0.4)', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>✓</button>
                    <button onClick={() => { setPayingDebt(null); setPayAmount('') }} style={{ padding: '4px 6px', background: 'none', color: 'var(--c-text-4)', border: '0.5px solid var(--c-border)', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>✕</button>
                  </div>
                )}

                {editingDebt?.id === debt.id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 4 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', fontSize: 12 }}>{symbol}</span>
                      <input
                        autoFocus type="text" inputMode="decimal" placeholder="0.00"
                        value={editAmount}
                        onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setEditAmount(e.target.value) : null}
                        onKeyDown={e => {
                          if (e.key === 'Enter') updateDebtPayment(debt.id, debt.name, editingDebt.oldAmount)
                          if (e.key === 'Escape') { setEditingDebt(null); setEditAmount('') }
                        }}
                        style={{ width: '100%', padding: '4px 6px 4px 20px', border: '0.5px solid var(--c-input-border)', borderRadius: 4, fontSize: 12, outline: 'none', background: 'var(--c-input-bg)', color: 'var(--c-text-1)' }}
                      />
                    </div>
                    <button onClick={() => updateDebtPayment(debt.id, debt.name, editingDebt.oldAmount)} style={{ padding: '4px 8px', background: 'rgba(99,153,34,0.2)', color: 'var(--c-sorted-text)', border: '1px solid rgba(99,153,34,0.4)', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>✓</button>
                    <button onClick={() => { setEditingDebt(null); setEditAmount('') }} style={{ padding: '4px 6px', background: 'none', color: 'var(--c-text-4)', border: '0.5px solid var(--c-border)', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>✕</button>
                  </div>
                )}

                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Cycle summary */}
        <div className="glass-card" style={{ padding: '16px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 14 }}>Cycle summary</div>
          {[
            { label: 'Sorted',      value: sortedTotal,   pillClass: 'pill-sorted' },
            { label: 'Pending',     value: pendingTotal,  pillClass: 'pill-pending' },
            { label: 'Skipped',     value: skippedTotal,  pillClass: 'pill-skipped' },
            { label: 'Untouched',   value: untouchedTotal, pillClass: 'pill-untouched' },
            { label: 'Unallocated', value: remaining - skippedTotal - untouchedTotal, pillClass: 'pill-sorted' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className={`status-pill ${row.pillClass}`}>{row.label}</span>
              <span style={{ fontSize: 13, color: 'var(--c-text-1)' }}>{formatCurrency(row.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
