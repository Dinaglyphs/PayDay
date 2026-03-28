import React, { useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'

export default function StartSessionModal({ onConfirm, onClose }) {
  const { symbol, formatAmount } = useCurrency()
  const [paycheck, setPaycheck] = useState('')
  const [otherIncome, setOtherIncome] = useState('0')
  const total = (parseFloat(paycheck) || 0) + (parseFloat(otherIncome) || 0)
  const canStart = parseFloat(paycheck) > 0

  return (
    <div className="modal-overlay">
      <div className="modal-panel" style={{ width: 380 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--c-text-1)', margin: '0 0 20px' }}>Start new session</h2>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: 'var(--c-text-3)', display: 'block', marginBottom: 5 }}>Paycheck amount</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', fontSize: 13 }}>{symbol}</span>
            <input
              autoFocus type="text" inputMode="decimal" value={paycheck} placeholder="0.00"
              onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setPaycheck(e.target.value) : null}
              style={{ width: '100%', padding: '8px 10px 8px 24px', border: '0.5px solid var(--c-input-border)', borderRadius: 6, fontSize: 14, outline: 'none', background: 'var(--c-input-bg)', color: 'var(--c-text-1)' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: 'var(--c-text-3)', display: 'block', marginBottom: 5 }}>
            Other income <span style={{ color: 'var(--c-text-4)' }}>(optional)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', fontSize: 13 }}>{symbol}</span>
            <input
              type="text" inputMode="decimal" value={otherIncome} placeholder="0.00"
              onChange={e => /^\d*\.?\d*$/.test(e.target.value) || e.target.value === '' ? setOtherIncome(e.target.value) : null}
              style={{ width: '100%', padding: '8px 10px 8px 24px', border: '0.5px solid var(--c-input-border)', borderRadius: 6, fontSize: 14, outline: 'none', background: 'var(--c-input-bg)', color: 'var(--c-text-1)' }}
            />
          </div>
        </div>

        {total > 0 && (
          <div style={{ background: 'var(--c-bg-row)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 13, color: 'var(--c-text-2)', border: '0.5px solid var(--c-border-light)' }}>
            Total income: <strong style={{ color: 'var(--c-text-1)' }}>{formatAmount(total)}</strong>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => { if (!canStart) return; onConfirm(parseFloat(paycheck), parseFloat(otherIncome) || 0) }}
            disabled={!canStart}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: 13 }}
          >Start session</button>
        </div>
      </div>
    </div>
  )
}
