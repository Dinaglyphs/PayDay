import React, { useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useCurrency } from '../context/CurrencyContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function getCycleBalance(cycle) {
  const out = cycle.bills.filter(b => b.status === 'sorted').reduce((s, b) => s + (parseFloat(b.actual) || 0), 0)
  return cycle.totalIncome - out
}

export default function AnnualWrap({ data, defaultTab = 'annual' }) {
  const { formatAmount: formatCurrency } = useCurrency()
  const cycles = data.cycles || []
  const years = [...new Set(cycles.map(c => c.date.split('-')[0]))].sort().reverse()
  const [year, setYear] = useState(years[0] || new Date().getFullYear().toString())
  const [tab, setTab] = useState(defaultTab)
  const yearlyCycles = cycles.filter(c => c.date.startsWith(year))

  if (cycles.length < 2) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <h1 style={{ fontSize: 16, fontWeight: 500, color: 'var(--c-text-1)', margin: '0 0 20px' }}>
          {tab === 'patterns' ? 'Patterns' : 'Annual wrap'}
        </h1>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--c-text-4)' }}>Close at least 2 cycles to see reports.</div>
        </div>
      </div>
    )
  }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthlyBalances = months.map((m, i) => {
    const mc = yearlyCycles.filter(c => parseInt(c.date.split('-')[1]) - 1 === i)
    if (mc.length === 0) return null
    return mc.reduce((sum, c) => sum + getCycleBalance(c), 0) / mc.length
  })

  const chartData = {
    labels: months,
    datasets: [{
      data: monthlyBalances.map(v => v || 0),
      backgroundColor: monthlyBalances.map(v => v === null ? 'rgba(255,255,255,0.06)' : v >= 0 ? 'rgba(99,153,34,0.6)' : 'rgba(226,75,74,0.6)'),
      borderRadius: 5,
    }]
  }

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'var(--c-border-light)' }, ticks: { callback: v => formatCurrency(v), color: 'var(--c-text-3)' } },
      x: { grid: { display: false }, ticks: { color: 'var(--c-text-3)' } }
    }
  }

  const totalIn = yearlyCycles.reduce((s, c) => s + c.totalIncome, 0)
  const totalOut = yearlyCycles.reduce((s, c) => s + c.bills.filter(b => b.status === 'sorted').reduce((ss, b) => ss + (parseFloat(b.actual) || 0), 0), 0)
  const avgUnallocated = yearlyCycles.length > 0 ? yearlyCycles.reduce((s, c) => s + getCycleBalance(c), 0) / yearlyCycles.length : 0

  const balances = yearlyCycles.map(c => ({ cycle: c, balance: getCycleBalance(c) }))
  const best  = balances.length > 0 ? balances.reduce((a, b) => b.balance > a.balance ? b : a) : null
  const worst = balances.length > 0 ? balances.reduce((a, b) => b.balance < a.balance ? b : a) : null

  const skippedCounts = {}
  yearlyCycles.forEach(c => c.bills.filter(b => b.status === 'skipped').forEach(b => { skippedCounts[b.name] = (skippedCounts[b.name] || 0) + 1 }))
  const mostSkipped = Object.entries(skippedCounts).sort((a, b) => b[1] - a[1])[0]
  const overspendCount = yearlyCycles.filter(c => c.bills.some(b => b.status === 'sorted' && parseFloat(b.actual) > b.budgeted)).length

  const tabBtn = (id, label) => (
    <button
      key={id} onClick={() => setTab(id)}
      className={tab === id ? 'tab-btn-active' : 'tab-btn-inactive'}
      style={{
        padding: '7px 16px', border: '0.5px solid var(--c-border)',
        borderRadius: id === 'annual' ? '6px 0 0 6px' : '0 6px 6px 0',
        background: tab === id ? 'rgba(153,0,153,0.2)' : 'var(--c-bg-card)',
        color: tab === id ? 'var(--c-text-1)' : 'var(--c-text-2)',
        fontSize: 13, cursor: 'pointer', fontWeight: tab === id ? 500 : 400
      }}
    >{label}</button>
  )

  return (
    <div style={{ padding: '24px 28px', maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {tabBtn('annual', 'Annual wrap')}
          {tabBtn('patterns', 'Patterns')}
        </div>
        <select
          value={year} onChange={e => setYear(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, fontSize: 13 }}
        >
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {tab === 'annual' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total income', value: formatCurrency(totalIn) },
              { label: 'Total spent', value: formatCurrency(totalOut) },
              { label: 'Avg unallocated', value: formatCurrency(avgUnallocated) },
            ].map(s => (
              <div key={s.label} className="glass-card stat-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--c-text-1)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: '20px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 14 }}>Monthly balance</div>
            {yearlyCycles.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--c-text-4)', fontSize: 13, padding: '30px 0' }}>No data for {year}</div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 12 }}>Other income trends</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {yearlyCycles.map(c => (
                <div key={c.id} style={{
                  background: c.otherIncome > 0 ? 'var(--c-sorted-bg)' : 'var(--c-bg-row)',
                  border: '0.5px solid var(--c-border-light)',
                  borderRadius: 8, padding: '8px 12px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 10, color: 'var(--c-text-4)', marginBottom: 2 }}>{c.date}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: c.otherIncome > 0 ? 'var(--c-sorted-text)' : 'var(--c-text-4)' }}>{formatCurrency(c.otherIncome || 0)}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Best month',       value: best  ? `${best.cycle.date} — ${formatCurrency(best.balance)}`   : '—' },
            { label: 'Worst month',      value: worst ? `${worst.cycle.date} — ${formatCurrency(worst.balance)}` : '—' },
            { label: 'Most skipped bill',value: mostSkipped ? `${mostSkipped[0]} (${mostSkipped[1]}×)` : 'None' },
            { label: 'Avg unallocated',  value: formatCurrency(avgUnallocated) },
            { label: 'Overspend cycles', value: `${overspendCount} cycle${overspendCount !== 1 ? 's' : ''}` },
            { label: 'Cycles this year', value: yearlyCycles.length.toString() },
          ].map(item => (
            <div key={item.label} className="glass-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text-1)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
