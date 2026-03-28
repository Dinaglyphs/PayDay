import React, { useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'

export default function CloseSessionModal({ session, template, onConfirm, onClose }) {
  const { formatAmount: formatCurrency, symbol } = useCurrency()
  const [debtBalances, setDebtBalances] = useState(
    (template.debts || []).map(debt => {
      const snap = (session.debtSnapshots || []).find(s => s.id === debt.id)
      return { id: debt.id, name: debt.name, balance: snap ? snap.balance : debt.startingBalance }
    })
  )

  const payments = session.debtPayments || []

  function updateBalance(id, val) {
    setDebtBalances(prev => prev.map(d => d.id === id ? { ...d, balance: val } : d))
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel" style={{ width: 440 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--c-text-1)', margin: '0 0 6px' }}>Close this cycle</h2>
        <p style={{ fontSize: 13, color: 'var(--c-text-3)', margin: '0 0 20px' }}>Confirm or update your debt balances before saving.</p>

        {payments.length > 0 && (
          <div style={{ background: 'var(--c-bg-row)', borderRadius: 10, padding: '12px 14px', marginBottom: 18, border: '0.5px solid var(--c-border-light)' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Payments made this cycle
            </div>
            {payments.map(p => (
              <div key={p.debtId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--c-text-2)' }}>{p.debtName}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-sorted-text)' }}>{formatCurrency(p.amountPaid)}</span>
              </div>
            ))}
            <div style={{ borderTop: '0.5px solid var(--c-border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Total paid toward debts</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-sorted-text)' }}>
                {formatCurrency(payments.reduce((s, p) => s + p.amountPaid, 0))}
              </span>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
          Closing balances
        </div>

        {debtBalances.map(debt => (
          <div key={debt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--c-border-light)' }}>
            <span style={{ fontSize: 13, color: 'var(--c-text-2)' }}>{debt.name}</span>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', fontSize: 13 }}>{symbol}</span>
              <input
                type="text" inputMode="decimal" value={debt.balance}
                onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value) || e.target.value === '') updateBalance(debt.id, e.target.value) }}
                style={{ width: 100, padding: '5px 8px 5px 22px', border: '0.5px solid var(--c-input-border)', borderRadius: 6, fontSize: 13, textAlign: 'right', outline: 'none', background: 'var(--c-input-bg)', color: 'var(--c-text-1)' }}
              />
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>Cancel</button>
          <button
            onClick={() => onConfirm(debtBalances.map(d => ({ ...d, balance: parseFloat(d.balance) || 0 })))}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: 13 }}
          >Close cycle</button>
        </div>
      </div>
    </div>
  )
}
