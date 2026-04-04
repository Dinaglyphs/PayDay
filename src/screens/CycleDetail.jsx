import React, { useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'
import { exportXlsx } from '../lib/exportXlsx'
import { exportPdf }  from '../lib/exportPdf'

const STATUS_ORDER = ['sorted', 'pending', 'skipped', 'untouched']

function pillClass(status) {
  if (status === 'sorted')  return 'pill-sorted'
  if (status === 'pending') return 'pill-pending'
  if (status === 'skipped') return 'pill-skipped'
  return 'pill-untouched'
}

export default function CycleDetail({ cycle, onBack, onDelete }) {
  const { formatAmount: fmt, symbol } = useCurrency()
  const [confirmDelete,  setConfirmDelete]  = useState(false)
  const [exportXlsxState, setExportXlsxState] = useState(null)
  const [exportPdfState,  setExportPdfState]  = useState(null)

  if (!cycle) return null

  const bills = [...(cycle.bills || [])].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  )

  const billsConfirmedOut = bills.filter(b => b.status === 'sorted').reduce((s, b) => s + (parseFloat(b.actual) || 0), 0)
  const pendingTotal      = bills.filter(b => b.status === 'pending').reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)
  const skippedTotal      = bills.filter(b => b.status === 'skipped').reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)

  const payments  = cycle.debtPayments  || []
  const snapshots = cycle.debtSnapshots || []

  const debtPaid     = payments.reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0)
  const confirmedOut = billsConfirmedOut + debtPaid
  const remaining    = (cycle.totalIncome || 0) - confirmedOut - pendingTotal
  const unallocated  = remaining - skippedTotal

  const isExporting = exportXlsxState === 'loading' || exportPdfState === 'loading'

  async function handleExportXlsx() {
    setExportXlsxState('loading')
    try {
      exportXlsx(cycle, symbol)
      setExportXlsxState('done')
    } catch (err) {
      console.error('XLSX export error:', err)
      setExportXlsxState('error')
    } finally {
      setTimeout(() => setExportXlsxState(null), 3000)
    }
  }

  async function handleExportPdf() {
    setExportPdfState('loading')
    try {
      await exportPdf(cycle, symbol)
      setExportPdfState('done')
    } catch (err) {
      console.error('PDF export error:', err)
      setExportPdfState('error')
    } finally {
      setTimeout(() => setExportPdfState(null), 3000)
    }
  }

  function exportBtnLabel(type) {
    const state = type === 'xlsx' ? exportXlsxState : exportPdfState
    if (state === 'loading') return 'Saving...'
    if (state === 'done')    return '✓ Saved'
    if (state === 'error')   return 'Error'
    return type === 'xlsx' ? 'Export XLSX' : 'Export PDF'
  }

  function exportBtnStyle(type) {
    const state = type === 'xlsx' ? exportXlsxState : exportPdfState
    if (state === 'done')  return { background: 'rgba(99,153,34,0.15)', borderColor: 'rgba(99,153,34,0.4)', color: 'var(--c-sorted-text)' }
    if (state === 'error') return { background: 'rgba(226,75,74,0.15)', borderColor: 'rgba(226,75,74,0.4)', color: 'var(--c-skipped-text)' }
    return {}
  }

  const th = {
    padding: '8px 12px', fontSize: 11, fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.4px',
    borderBottom: '0.5px solid var(--c-border)',
    color: 'var(--c-text-4)', textAlign: 'left'
  }
  const td = { padding: '9px 12px', fontSize: 13, color: 'var(--c-text-2)', borderBottom: '0.5px solid var(--c-border-light)' }

  return (
    <div className="content-page">

      {/* Back + title row */}
      <div className="cycle-header">
        <div className="cycle-header-top">
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(204,51,153,0.8)', fontSize: 13, padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 500, color: 'var(--c-text-1)', margin: 0, flex: 1 }}>Cycle — {cycle.date}</h1>
        </div>
        <div className="cycle-header-actions">
          <button onClick={handleExportXlsx} disabled={isExporting} className="btn-secondary" style={{ padding: '6px 14px', ...exportBtnStyle('xlsx') }}>
            {exportBtnLabel('xlsx')}
          </button>
          <button onClick={handleExportPdf} disabled={isExporting} className="btn-secondary" style={{ padding: '6px 14px', ...exportBtnStyle('pdf') }}>
            {exportBtnLabel('pdf')}
          </button>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="btn-danger" style={{ padding: '6px 14px', fontSize: 12 }}>
              Delete cycle
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Delete?</span>
              <button onClick={() => onDelete(cycle.id)} className="btn-danger" style={{ padding: '5px 12px', fontSize: 12, background: 'rgba(226,75,74,0.25)', fontWeight: 500 }}>Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}>No</button>
            </div>
          )}
        </div>
      </div>

      {/* Summary boxes */}
      <div className="stats-grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total income',  value: fmt(cycle.totalIncome) },
          { label: 'Confirmed out', value: fmt(confirmedOut) },
          { label: 'Remaining',     value: fmt(remaining) },
        ].map(item => (
          <div key={item.label} className="glass-card stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--c-text-1)' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Bills */}
      <div className="glass-card" style={{ marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--c-border)' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text-1)' }}>Bills</span>
        </div>

        {/* Desktop table */}
        <div className="bills-table-desktop">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="table-header-row">
                <th style={th}>Bill</th>
                <th style={th}>Category</th>
                <th style={{ ...th, textAlign: 'right' }}>Budgeted</th>
                <th style={{ ...th, textAlign: 'right' }}>Actual</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill.id || bill.name}>
                  <td style={{ ...td, color: 'var(--c-text-1)' }}>{bill.name}</td>
                  <td style={td}>{bill.category || '—'}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmt(bill.budgeted)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 500, color: 'var(--c-text-1)' }}>{fmt(bill.actual)}</td>
                  <td style={td}>
                    <span className={`status-pill ${pillClass(bill.status)}`}>
                      {(bill.status || 'untouched').charAt(0).toUpperCase() + (bill.status || 'untouched').slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="bills-cards-mobile">
          {bills.map(bill => (
            <div key={bill.id || bill.name} style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--c-border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--c-text-1)', fontWeight: 500, flex: 1, marginRight: 8 }}>{bill.name}</span>
                <span className={`status-pill ${pillClass(bill.status)}`}>
                  {(bill.status || 'untouched').charAt(0).toUpperCase() + (bill.status || 'untouched').slice(1)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-text-3)' }}>
                <span>{bill.category || '—'}</span>
                <span style={{ color: 'var(--c-text-2)' }}>
                  <span style={{ color: 'var(--c-text-4)' }}>budget </span>{fmt(bill.budgeted)}
                  <span style={{ margin: '0 6px', color: 'var(--c-border)' }}>·</span>
                  <span style={{ color: 'var(--c-text-1)', fontWeight: 500 }}>actual </span>{fmt(bill.actual)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bills-footer" style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'var(--c-bg-row)', borderTop: '0.5px solid var(--c-border)', flexWrap: 'wrap' }}>
          <span className="status-pill pill-sorted">Sorted: {fmt(billsConfirmedOut)}</span>
          <span className="status-pill pill-pending">Pending: {fmt(pendingTotal)}</span>
          <span className="status-pill pill-skipped">Skipped: {fmt(skippedTotal)}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-2)' }}>Unallocated: {fmt(unallocated)}</span>
        </div>
      </div>

      {/* Debt payments */}
      {payments.length > 0 && (
        <div className="glass-card" style={{ marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--c-border)' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text-1)' }}>Debt payments this cycle</span>
          </div>
          {payments.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderBottom: '0.5px solid var(--c-border-light)' }}>
              <span style={{ fontSize: 13, color: 'var(--c-text-2)' }}>{p.debtName}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-sorted-text)' }}>{fmt(p.amountPaid)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Debt snapshot */}
      {snapshots.length > 0 && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--c-border)' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text-1)' }}>Debt balances at close</span>
          </div>
          {snapshots.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderBottom: '0.5px solid var(--c-border-light)' }}>
              <span style={{ fontSize: 13, color: 'var(--c-text-2)' }}>{d.name}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#F5B942' }}>{fmt(d.balance)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
