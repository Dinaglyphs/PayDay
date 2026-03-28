import React from 'react'
import { useCurrency } from '../context/CurrencyContext'

export default function DebtRow({ debt, onBalanceChange }) {
  const { formatAmount: formatCurrency } = useCurrency()
  const pct = debt.startingBalance > 0
    ? Math.max(0, Math.min(100, (debt.balance / debt.startingBalance) * 100))
    : 0

  return (
    <div style={{ padding: '12px 0', borderBottom: '0.5px solid #f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{debt.name}</span>
          <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>{debt.type}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onBalanceChange && (
            <input
              type="text"
              inputMode="decimal"
              value={debt.balance}
              onChange={e => {
                if (/^\d*\.?\d*$/.test(e.target.value) || e.target.value === '') {
                  onBalanceChange(e.target.value)
                }
              }}
              style={{
                width: 80, padding: '3px 6px', border: '0.5px solid #d1d5db',
                borderRadius: 4, fontSize: 13, textAlign: 'right',
                background: '#fafafa', outline: 'none'
              }}
            />
          )}
          {!onBalanceChange && (
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{formatCurrency(debt.balance)}</span>
          )}
        </div>
      </div>
      <div style={{ background: '#f3f4f6', borderRadius: 4, height: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#ef4444', borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
        {formatCurrency(debt.balance)} of {formatCurrency(debt.startingBalance)} starting balance
      </div>
    </div>
  )
}
