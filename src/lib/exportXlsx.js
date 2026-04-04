import * as XLSX from 'xlsx'

function buildCycleWorkbook(cycle, currencySymbol = '£') {
  const bills = [...(cycle.bills || [])].sort((a, b) => {
    const order = ['sorted', 'pending', 'skipped', 'untouched']
    return order.indexOf(a.status) - order.indexOf(b.status)
  })

  const billsConfirmedOut = bills.filter(b => b.status === 'sorted').reduce((s, b) => s + (parseFloat(b.actual) || 0), 0)
  const pendingTotal      = bills.filter(b => b.status === 'pending').reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)
  const skippedTotal      = bills.filter(b => b.status === 'skipped').reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)

  const payments  = cycle.debtPayments  || []
  const snapshots = cycle.debtSnapshots || []

  const debtPaid     = payments.reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0)
  const confirmedOut = billsConfirmedOut + debtPaid
  const remaining    = (cycle.totalIncome || 0) - confirmedOut - pendingTotal
  const unallocated  = remaining - skippedTotal

  const cap = str => str.charAt(0).toUpperCase() + str.slice(1)

  const rows = []
  rows.push(['PayDay by Dinaglyphs — Cycle Report'])
  rows.push(['Date:', cycle.date])
  rows.push(['Exported:', new Date().toLocaleDateString('en-GB')])
  rows.push([])

  rows.push(['SUMMARY'])
  rows.push(['Total Income',  parseFloat(cycle.totalIncome) || 0])
  rows.push(['Confirmed Out', confirmedOut])
  rows.push(['Remaining',     remaining])
  rows.push([])

  rows.push(['BILLS'])
  rows.push(['Name', 'Category', `Budgeted (${currencySymbol})`, `Actual (${currencySymbol})`, 'Status'])
  bills.forEach(b => {
    rows.push([b.name || '', b.category || '', parseFloat(b.budgeted) || 0, parseFloat(b.actual) || 0, cap(b.status || 'untouched')])
  })
  rows.push([])

  rows.push(['CYCLE TOTALS'])
  rows.push(['Sorted',      billsConfirmedOut])
  rows.push(['Pending',     pendingTotal])
  rows.push(['Skipped',     skippedTotal])
  rows.push(['Unallocated', unallocated])
  rows.push([])

  if (payments.length > 0) {
    rows.push(['DEBT PAYMENTS THIS CYCLE'])
    rows.push(['Debt Name', `Amount Paid (${currencySymbol})`])
    payments.forEach(p => rows.push([p.debtName || '', parseFloat(p.amountPaid) || 0]))
    rows.push([])
  }

  if (snapshots.length > 0) {
    rows.push(['DEBT BALANCES AT CLOSE'])
    rows.push(['Debt Name', `Balance (${currencySymbol})`])
    snapshots.forEach(d => rows.push([d.name || '', parseFloat(d.balance) || 0]))
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 32 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Cycle Summary')
  return wb
}

export function exportXlsx(cycle, currencySymbol = '£') {
  const wb  = buildCycleWorkbook(cycle, currencySymbol)
  XLSX.writeFile(wb, `PayDay-Cycle-${cycle.date}.xlsx`)
}
