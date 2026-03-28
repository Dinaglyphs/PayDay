import React, { useState } from 'react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const th = {
  padding: '8px 16px', fontSize: 11, fontWeight: 500,
  textTransform: 'uppercase', letterSpacing: '0.4px',
  color: 'var(--c-text-4)', textAlign: 'left',
  borderBottom: '0.5px solid var(--c-border)',
}

export default function Payslips({ data, persist }) {
  const now          = new Date()
  const [month,        setMonth]        = useState(now.getMonth() + 1)
  const [year,         setYear]         = useState(now.getFullYear())
  const [uploadState,  setUploadState]  = useState(null)   // null | 'uploading' | 'done' | 'error'
  const [dlStates,     setDlStates]     = useState({})     // { [id]: 'loading' | 'done' | 'error' }
  const [confirmDelId, setConfirmDelId] = useState(null)

  const payslips = [...(data.payslips || [])].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year
    return b.month - a.month
  })

  // ── Upload ───────────────────────────────────────────────────────────────

  async function handleUpload() {
    if (!window.paydayAPI?.uploadPayslip) {
      setUploadState('error')
      setTimeout(() => setUploadState(null), 3000)
      return
    }
    setUploadState('uploading')
    try {
      const result = await window.paydayAPI.uploadPayslip({
        month: parseInt(month),
        year:  parseInt(year),
      })
      if (result?.canceled) { setUploadState(null); return }
      if (!result?.success) {
        console.error('Upload failed:', result?.error)
        setUploadState('error')
        setTimeout(() => setUploadState(null), 3000)
        return
      }
      const newPayslips = [...(data.payslips || []), result.payslip]
      await persist({ ...data, payslips: newPayslips })
      setUploadState('done')
      setTimeout(() => setUploadState(null), 2500)
    } catch (err) {
      console.error('Upload error:', err)
      setUploadState('error')
      setTimeout(() => setUploadState(null), 3000)
    }
  }

  // ── Download ─────────────────────────────────────────────────────────────

  async function handleDownload(p) {
    if (!window.paydayAPI?.downloadPayslip) return
    setDlStates(s => ({ ...s, [p.id]: 'loading' }))
    try {
      const result = await window.paydayAPI.downloadPayslip({
        filename: p.filename,
        month:    p.month,
        year:     p.year,
      })
      if (result?.canceled) { setDlStates(s => ({ ...s, [p.id]: null })); return }
      setDlStates(s => ({ ...s, [p.id]: result?.success ? 'done' : 'error' }))
      if (!result?.success) console.error('Download failed:', result?.error)
    } catch (err) {
      console.error('Download error:', err)
      setDlStates(s => ({ ...s, [p.id]: 'error' }))
    } finally {
      setTimeout(() => setDlStates(s => ({ ...s, [p.id]: null })), 2500)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(p) {
    try {
      if (window.paydayAPI?.deletePayslip) {
        await window.paydayAPI.deletePayslip({ filename: p.filename })
      }
    } catch (err) {
      console.error('Delete file error:', err)
    }
    const newPayslips = (data.payslips || []).filter(x => x.id !== p.id)
    await persist({ ...data, payslips: newPayslips })
    setConfirmDelId(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 28px', maxWidth: 760 }}>
      <h1 style={{ fontSize: 17, fontWeight: 500, color: 'var(--c-text-1)', margin: '0 0 20px' }}>
        Payslips
      </h1>

      {/* ── Upload card ─────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '18px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 14 }}>
          Upload a payslip
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>

          {/* Month */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Month
            </label>
            <select
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
              style={{
                background: 'var(--c-bg-input)', border: '1px solid var(--c-input-border)',
                color: 'var(--c-text-1)', borderRadius: 6,
                padding: '7px 10px', fontSize: 13, cursor: 'pointer',
              }}
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              min={2000}
              max={2099}
              style={{
                background: 'var(--c-bg-input)', border: '1px solid var(--c-input-border)',
                color: 'var(--c-text-1)', borderRadius: 6,
                padding: '7px 10px', fontSize: 13, width: 88,
              }}
            />
          </div>

          {/* Button */}
          <button
            onClick={handleUpload}
            disabled={uploadState === 'uploading'}
            className="btn-primary"
            style={{
              padding: '8px 20px', fontSize: 13,
              ...(uploadState === 'done'  ? { background: 'rgba(99,153,34,0.2)', border: '1px solid rgba(99,153,34,0.4)', color: 'var(--c-sorted-text)' } : {}),
              ...(uploadState === 'error' ? { background: 'rgba(226,75,74,0.15)', border: '1px solid rgba(226,75,74,0.4)', color: 'var(--c-skipped-text)' } : {}),
            }}
          >
            {uploadState === 'uploading' ? 'Opening...'
             : uploadState === 'done'    ? '✓ Saved'
             : uploadState === 'error'   ? 'Error'
             : 'Upload PDF'}
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--c-text-4)', marginTop: 10, lineHeight: 1.5 }}>
          PDF files only. Files are stored in a <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>payday-payslips</code> folder next to the app data.
        </div>
      </div>

      {/* ── Saved payslips ───────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '14px 16px', borderBottom: '0.5px solid var(--c-border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text-1)' }}>Saved payslips</span>
          <span style={{
            fontSize: 11, color: 'var(--c-text-4)',
            background: 'rgba(255,255,255,0.06)', borderRadius: 10,
            padding: '1px 8px',
          }}>
            {payslips.length}
          </span>
        </div>

        {payslips.length === 0 ? (
          <div style={{ padding: '32px 16px', fontSize: 13, color: 'var(--c-text-4)', textAlign: 'center' }}>
            No payslips uploaded yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="table-header-row">
                <th style={th}>Period</th>
                <th style={th}>Original file</th>
                <th style={th}>Uploaded</th>
                <th style={{ ...th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map(p => {
                const dlState   = dlStates[p.id]
                const confirming = confirmDelId === p.id
                const tdBase = {
                  padding: '10px 16px', fontSize: 13,
                  color: 'var(--c-text-2)',
                  borderBottom: '0.5px solid var(--c-border-light)',
                }
                return (
                  <tr key={p.id}>
                    <td style={{ ...tdBase, fontWeight: 500, color: 'var(--c-text-1)' }}>
                      {MONTHS[p.month - 1]} {p.year}
                    </td>
                    <td style={{ ...tdBase, fontSize: 12, color: 'var(--c-text-3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.originalName}
                    </td>
                    <td style={{ ...tdBase, fontSize: 12, color: 'var(--c-text-4)' }}>
                      {new Date(p.uploadedAt).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ ...tdBase, textAlign: 'right' }}>
                      {confirming ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Delete?</span>
                          <button
                            onClick={() => handleDelete(p)}
                            className="btn-danger"
                            style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500 }}
                          >Yes</button>
                          <button
                            onClick={() => setConfirmDelId(null)}
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                          >No</button>
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => handleDownload(p)}
                            disabled={dlState === 'loading'}
                            className="btn-secondary"
                            style={{
                              padding: '4px 12px', fontSize: 12,
                              ...(dlState === 'done'  ? { color: 'var(--c-sorted-text)' }  : {}),
                              ...(dlState === 'error' ? { color: 'var(--c-skipped-text)' } : {}),
                            }}
                          >
                            {dlState === 'loading' ? 'Saving...'
                             : dlState === 'done'  ? '✓ Saved'
                             : dlState === 'error' ? 'Error'
                             : 'Download'}
                          </button>
                          <button
                            onClick={() => setConfirmDelId(p.id)}
                            className="btn-danger"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                          >Delete</button>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
