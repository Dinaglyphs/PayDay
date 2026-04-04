import { supabase } from '../lib/supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getUid() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

function buildCycleObject(row, allBills, allPayments, allSnapshots) {
  const bills     = allBills.filter(b => b.cycle_id === row.id).sort((a, b) => a.sort_order - b.sort_order)
  const payments  = allPayments.filter(p => p.cycle_id === row.id)
  const snapshots = allSnapshots.filter(s => s.cycle_id === row.id)
  return {
    id: row.id, date: row.date,
    paycheck: row.paycheck, otherIncome: row.other_income, totalIncome: row.total_income,
    status: row.status, closedAt: row.closed_at,
    bills:         bills.map(b => ({ id: b.id, name: b.name, category: b.category, budgeted: b.budgeted, actual: b.actual, status: b.status })),
    debtPayments:  payments.map(p => ({ debtId: p.debt_id, debtName: p.debt_name, amountPaid: p.amount_paid })),
    debtSnapshots: snapshots.map(s => ({ id: s.debt_id, name: s.name, balance: s.balance })),
  }
}

// ── Load ──────────────────────────────────────────────────────────────────────

export async function loadData() {
  const uid = await getUid()
  if (!uid) return null

  // Preferences
  const { data: prefRows } = await supabase.from('preferences').select('key, value').eq('user_id', uid)
  const preferences = {}
  for (const row of (prefRows || [])) {
    try { preferences[row.key] = JSON.parse(row.value) } catch { preferences[row.key] = row.value }
  }

  // Template
  const [{ data: tBills }, { data: tDebts }] = await Promise.all([
    supabase.from('template_bills').select('*').eq('user_id', uid).order('sort_order'),
    supabase.from('template_debts').select('*').eq('user_id', uid),
  ])
  const template = (tBills?.length > 0 || tDebts?.length > 0) ? {
    bills: (tBills || []).map(b => ({ id: b.id, name: b.name, budgeted: b.budgeted, category: b.category })),
    debts: (tDebts || []).map(d => ({ id: d.id, name: d.name, type: d.type, startingBalance: d.starting_balance })),
  } : null

  // Cycles
  const [{ data: closedRows }, { data: activeRows }] = await Promise.all([
    supabase.from('cycles').select('*').eq('user_id', uid).eq('is_active', 0).order('created_at', { ascending: false }),
    supabase.from('cycles').select('*').eq('user_id', uid).eq('is_active', 1).limit(1),
  ])
  const activeRow = activeRows?.[0] ?? null
  const allCycleIds = [...(closedRows || []), ...(activeRow ? [activeRow] : [])].map(c => c.id)

  let allBills = [], allPayments = [], allSnapshots = []
  if (allCycleIds.length > 0) {
    const [bRes, pRes, sRes] = await Promise.all([
      supabase.from('cycle_bills').select('*').in('cycle_id', allCycleIds).order('sort_order'),
      supabase.from('cycle_debt_payments').select('*').in('cycle_id', allCycleIds),
      supabase.from('cycle_debt_snapshots').select('*').in('cycle_id', allCycleIds),
    ])
    allBills     = bRes.data || []
    allPayments  = pRes.data || []
    allSnapshots = sRes.data || []
  }

  const cycles       = (closedRows || []).map(r => buildCycleObject(r, allBills, allPayments, allSnapshots))
  const activeSession = activeRow ? buildCycleObject(activeRow, allBills, allPayments, allSnapshots) : null

  // Payslips
  const { data: payslipRows } = await supabase
    .from('payslips').select('*').eq('user_id', uid)
    .order('year', { ascending: false }).order('month', { ascending: false })
  const payslips = (payslipRows || []).map(p => ({
    id: p.id, month: p.month, year: p.year,
    filename: p.filename, originalName: p.original_name, uploadedAt: p.uploaded_at,
  }))

  return { preferences, template, cycles, activeSession, payslips }
}

// ── Save ──────────────────────────────────────────────────────────────────────

export async function saveData(data) {
  const uid = await getUid()
  if (!uid) return

  const ops = []

  // Preferences
  if (data.preferences) {
    const rows = Object.entries(data.preferences).map(([key, value]) => ({
      user_id: uid, key, value: JSON.stringify(value),
    }))
    ops.push(supabase.from('preferences').upsert(rows, { onConflict: 'user_id,key' }))
  }

  // Template — delete + reinsert (small tables, simplest approach)
  if (data.template) {
    ops.push(
      supabase.from('template_bills').delete().eq('user_id', uid).then(() => {
        if (!data.template.bills?.length) return
        return supabase.from('template_bills').insert(
          data.template.bills.map((b, i) => ({
            id: b.id, user_id: uid, name: b.name,
            budgeted: b.budgeted ?? 0, category: b.category ?? '', sort_order: i,
          }))
        )
      })
    )
    ops.push(
      supabase.from('template_debts').delete().eq('user_id', uid).then(() => {
        if (!data.template.debts?.length) return
        return supabase.from('template_debts').insert(
          data.template.debts.map(d => ({
            id: d.id, user_id: uid, name: d.name,
            type: d.type ?? '', starting_balance: d.startingBalance ?? 0,
          }))
        )
      })
    )
  }

  await Promise.all(ops)

  // Cycles — reset is_active, then upsert each cycle and its children
  await supabase.from('cycles').update({ is_active: 0 }).eq('user_id', uid)

  const allCycles = [
    ...(data.cycles || []).map(c => ({ ...c, _active: 0 })),
    ...(data.activeSession ? [{ ...data.activeSession, _active: 1 }] : []),
  ]

  for (const cycle of allCycles) {
    await supabase.from('cycles').upsert({
      id: cycle.id, user_id: uid, date: cycle.date,
      paycheck: cycle.paycheck ?? 0, other_income: cycle.otherIncome ?? 0,
      total_income: cycle.totalIncome ?? 0, is_active: cycle._active,
      status: cycle.status ?? (cycle._active ? 'open' : 'closed'),
      closed_at: cycle.closedAt ?? null,
    }, { onConflict: 'id' })

    // Bills — upsert each
    if (cycle.bills?.length > 0) {
      await supabase.from('cycle_bills').upsert(
        cycle.bills.map((b, i) => ({
          id: b.id, cycle_id: cycle.id, user_id: uid,
          name: b.name, category: b.category ?? '',
          budgeted: b.budgeted ?? 0, actual: b.actual ?? 0,
          status: b.status ?? 'untouched', sort_order: i,
        })),
        { onConflict: 'id' }
      )
    }

    // Debt payments — delete + reinsert
    await supabase.from('cycle_debt_payments').delete().eq('cycle_id', cycle.id)
    if (cycle.debtPayments?.length > 0) {
      await supabase.from('cycle_debt_payments').insert(
        cycle.debtPayments.map((p, i) => ({
          id: `${cycle.id}-dp-${i}`, cycle_id: cycle.id, user_id: uid,
          debt_id: p.debtId ?? '', debt_name: p.debtName ?? '', amount_paid: p.amountPaid ?? 0,
        }))
      )
    }

    // Debt snapshots — delete + reinsert
    await supabase.from('cycle_debt_snapshots').delete().eq('cycle_id', cycle.id)
    if (cycle.debtSnapshots?.length > 0) {
      await supabase.from('cycle_debt_snapshots').insert(
        cycle.debtSnapshots.map((s, i) => ({
          id: `${cycle.id}-ds-${i}`, cycle_id: cycle.id, user_id: uid,
          debt_id: s.id ?? '', name: s.name ?? '', balance: s.balance ?? 0,
        }))
      )
    }
  }

  // Payslips — sync metadata (insert new, delete removed)
  if (data.payslips) {
    const { data: existing } = await supabase.from('payslips').select('id').eq('user_id', uid)
    const existingIds = new Set((existing || []).map(r => r.id))
    const currentIds  = new Set(data.payslips.map(p => p.id))

    const toInsert = data.payslips.filter(p => !existingIds.has(p.id))
    const toDelete = [...existingIds].filter(id => !currentIds.has(id))

    if (toInsert.length > 0) {
      await supabase.from('payslips').insert(
        toInsert.map(p => ({
          id: p.id, user_id: uid, month: p.month, year: p.year,
          filename: p.filename, original_name: p.originalName ?? '', uploaded_at: p.uploadedAt,
        }))
      )
    }
    if (toDelete.length > 0) {
      await supabase.from('payslips').delete().in('id', toDelete)
    }
  }
}

export function emptyData() {
  return { template: null, cycles: [], activeSession: null }
}
