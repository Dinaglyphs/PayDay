import React, { useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'

const STATUS_CONFIG = {
  untouched: { dotClass: 'dot-untouched', bgVar: 'var(--c-untouched-bg)', textVar: 'var(--c-untouched-text)', label: 'Untouched' },
  pending:   { dotClass: 'dot-pending',   bgVar: 'var(--c-pending-bg)',   textVar: 'var(--c-pending-text)',   label: 'Pending' },
  sorted:    { dotClass: 'dot-sorted',    bgVar: 'var(--c-sorted-bg)',    textVar: 'var(--c-sorted-text)',    label: 'Sorted' },
  skipped:   { dotClass: 'dot-skipped',   bgVar: 'var(--c-skipped-bg)',   textVar: 'var(--c-skipped-text)',  label: 'Skipped' },
}

export default function BillRow({ bill, onStatusChange, onActualChange, onUpdateTemplate, isSessionOnly }) {
  const { formatAmount: formatCurrency } = useCurrency()
  const cfg = STATUS_CONFIG[bill.status] || STATUS_CONFIG.untouched
  const actualDiffers = Math.abs((parseFloat(bill.actual) || 0) - bill.budgeted) > 0.001
  const [showTemplatePrompt, setShowTemplatePrompt] = useState(false)

  function handleActualChange(e) {
    const val = e.target.value
    if (val === '' || /^\d*\.?\d*$/.test(val)) onActualChange(val)
  }

  function handleActualBlur(e) {
    const val = parseFloat(e.target.value)
    if (!isNaN(val) && Math.abs(val - bill.budgeted) > 0.001 && !isSessionOnly) {
      setShowTemplatePrompt(true)
    }
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px', borderBottom: '0.5px solid var(--c-border-light)'
      }}>
        <div className={`status-dot ${cfg.dotClass}`} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--c-text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {bill.name}
            {isSessionOnly && <span style={{ fontSize: 10, color: 'var(--c-text-4)', marginLeft: 6, fontStyle: 'italic' }}>this cycle</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--c-text-4)' }}>{bill.category}</div>
        </div>

        <div className="col-budgeted" style={{ fontSize: 13, color: 'var(--c-text-3)', minWidth: 70, textAlign: 'right' }}>
          {formatCurrency(bill.budgeted)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 80 }}>
          <input
            type="text"
            inputMode="decimal"
            value={bill.actual !== undefined && bill.actual !== '' ? bill.actual : bill.budgeted}
            onChange={handleActualChange}
            onBlur={handleActualBlur}
            style={{
              width: 80, padding: '3px 6px', border: '0.5px solid var(--c-input-border)',
              borderRadius: 4, fontSize: 13, textAlign: 'right',
              color: actualDiffers ? '#F5B942' : 'var(--c-text-1)',
              background: 'var(--c-input-bg)', outline: 'none'
            }}
          />
          {actualDiffers && (
            <div style={{ fontSize: 10, color: 'var(--c-text-4)', marginTop: 1 }}>
              budget: {formatCurrency(bill.budgeted)}
            </div>
          )}
        </div>

        <select
          value={bill.status}
          onChange={e => onStatusChange(e.target.value)}
          style={{
            padding: '3px 8px', borderRadius: 20, border: '1px solid',
            borderColor: bill.status === 'sorted' ? 'rgba(99,153,34,0.4)'
              : bill.status === 'pending' ? 'rgba(239,159,39,0.4)'
              : bill.status === 'skipped' ? 'rgba(226,75,74,0.4)'
              : 'rgba(255,255,255,0.12)',
            background: cfg.bgVar, color: cfg.textVar,
            fontSize: 11, fontWeight: 500, cursor: 'pointer',
            outline: 'none', appearance: 'none', WebkitAppearance: 'none',
            minWidth: 80, textAlign: 'center', textAlignLast: 'center',
            backgroundImage: 'none',
          }}
        >
          <option value="untouched">Untouched</option>
          <option value="pending">Pending</option>
          <option value="sorted">Sorted</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      {showTemplatePrompt && (
        <div style={{
          background: 'rgba(239,159,39,0.1)', borderBottom: '0.5px solid rgba(239,159,39,0.3)',
          padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 12, color: 'var(--c-pending-text)', flex: 1 }}>Update template for future cycles?</span>
          <button onClick={() => { onUpdateTemplate && onUpdateTemplate(parseFloat(bill.actual)); setShowTemplatePrompt(false) }}
            style={{ fontSize: 12, color: 'var(--c-pending-text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: '2px 8px' }}>Yes</button>
          <button onClick={() => setShowTemplatePrompt(false)}
            style={{ fontSize: 12, color: 'var(--c-text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px' }}>Just this cycle</button>
        </div>
      )}
    </div>
  )
}
