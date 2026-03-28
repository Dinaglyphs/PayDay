import React from 'react'

export default function StatCard({ label, value, color }) {
  return (
    <div className="glass-card stat-card" style={{ padding: '16px 20px', minWidth: 0 }}>
      <div style={{ fontSize: 11, color: 'var(--c-text-4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 500, color: color || 'var(--c-text-1)' }}>
        {value}
      </div>
    </div>
  )
}
