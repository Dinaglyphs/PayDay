const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')
const db = require('./db')

const isDev = !app.isPackaged
let mainWindow

function getPayslipsDir() {
  if (app.isPackaged) {
    return path.join(path.dirname(app.getPath('exe')), 'payday-payslips')
  } else {
    return path.join(__dirname, '..', 'payday-payslips')
  }
}

function buildCycleWorkbook(cycle, currencySymbol = '£') {
  const bills = [...(cycle.bills || [])].sort((a, b) => {
    const order = ['sorted', 'pending', 'skipped', 'untouched']
    return order.indexOf(a.status) - order.indexOf(b.status)
  })

  const billsConfirmedOut = bills
    .filter(b => b.status === 'sorted')
    .reduce((s, b) => s + (parseFloat(b.actual) || 0), 0)
  const pendingTotal = bills
    .filter(b => b.status === 'pending')
    .reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)
  const skippedTotal = bills
    .filter(b => b.status === 'skipped')
    .reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)

  const payments  = cycle.debtPayments  || []
  const snapshots = cycle.debtSnapshots || []

  const debtPaid     = payments.reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0)
  const confirmedOut = billsConfirmedOut + debtPaid
  const remaining    = (cycle.totalIncome || 0) - confirmedOut - pendingTotal
  const unallocated  = remaining - skippedTotal

  const cap = (str) => str.charAt(0).toUpperCase() + str.slice(1)

  const rows = []

  // ── Header ──────────────────────────────────────────────────────────────
  rows.push(['PayDay by Dinaglyphs — Cycle Report'])
  rows.push(['Date:', cycle.date])
  rows.push(['Exported:', new Date().toLocaleDateString('en-GB')])
  rows.push([])

  // ── Summary ──────────────────────────────────────────────────────────────
  rows.push(['SUMMARY'])
  rows.push(['Total Income',  parseFloat(cycle.totalIncome) || 0])
  rows.push(['Confirmed Out', confirmedOut])
  rows.push(['Remaining',     remaining])
  rows.push([])

  // ── Bills ─────────────────────────────────────────────────────────────────
  rows.push(['BILLS'])
  rows.push(['Name', 'Category', `Budgeted (${currencySymbol})`, `Actual (${currencySymbol})`, 'Status'])
  bills.forEach(b => {
    rows.push([
      b.name     || '',
      b.category || '',
      parseFloat(b.budgeted) || 0,
      parseFloat(b.actual)   || 0,
      cap(b.status || 'untouched'),
    ])
  })
  rows.push([])

  // ── Cycle totals ──────────────────────────────────────────────────────────
  rows.push(['CYCLE TOTALS'])
  rows.push(['Sorted',      billsConfirmedOut])
  rows.push(['Pending',     pendingTotal])
  rows.push(['Skipped',     skippedTotal])
  rows.push(['Unallocated', unallocated])
  rows.push([])

  // ── Debt payments ─────────────────────────────────────────────────────────
  if (payments.length > 0) {
    rows.push(['DEBT PAYMENTS THIS CYCLE'])
    rows.push(['Debt Name', `Amount Paid (${currencySymbol})`])
    payments.forEach(p => {
      rows.push([p.debtName || '', parseFloat(p.amountPaid) || 0])
    })
    rows.push([])
  }

  // ── Debt balances ─────────────────────────────────────────────────────────
  if (snapshots.length > 0) {
    rows.push(['DEBT BALANCES AT CLOSE'])
    rows.push(['Debt Name', `Balance (${currencySymbol})`])
    snapshots.forEach(d => {
      rows.push([d.name || '', parseFloat(d.balance) || 0])
    })
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)

  ws['!cols'] = [
    { wch: 32 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 14 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Cycle Summary')
  return wb
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'default',
    title: 'PayDay by Dinaglyphs'
  })
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'))
  }
  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  await db.init(app)
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Data ───────────────────────────────────────────────────────────────────

ipcMain.handle('read-data', () => {
  try { return db.readAll() } catch (e) { console.error('read-data error:', e); return null }
})

ipcMain.handle('write-data', (event, data) => {
  try { db.writeAll(data, app); return true } catch (e) { console.error('write-data error:', e); return false }
})

// ── Export XLSX ────────────────────────────────────────────────────────────

ipcMain.handle('export-xlsx', async (event, { cycleData, currencySymbol }) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      defaultPath: `PayDay-Cycle-${cycleData.date}.xlsx`,
      filters: [{ name: 'Excel Spreadsheet', extensions: ['xlsx'] }]
    })
    if (canceled || !filePath) return { success: false, canceled: true }
    const wb = buildCycleWorkbook(cycleData, currencySymbol || '£')
    XLSX.writeFile(wb, filePath)
    return { success: true, filePath }
  } catch (err) {
    console.error('export-xlsx error:', err)
    return { success: false, error: err.message }
  }
})

// ── Export PDF ─────────────────────────────────────────────────────────────

const { generateCyclePDF } = require('./pdfExport')

ipcMain.handle('export-pdf', async (event, { cycleData, currencySymbol }) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      defaultPath: `PayDay-Cycle-${cycleData.date}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return { success: false, canceled: true }
    await generateCyclePDF(cycleData, filePath, currencySymbol || '£')
    return { success: true, filePath }
  } catch (err) {
    console.error('export-pdf error:', err)
    return { success: false, error: err.message }
  }
})

// ── Payslips ───────────────────────────────────────────────────────────────

ipcMain.handle('upload-payslip', async (event, { month, year }) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { filePaths, canceled } = await dialog.showOpenDialog(win, {
      title: 'Select your payslip PDF',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      properties: ['openFile']
    })
    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, canceled: true }
    }

    const srcPath    = filePaths[0]
    const origName   = path.basename(srcPath)
    const id         = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const filename   = `payslip-${year}-${String(month).padStart(2, '0')}-${id}.pdf`
    const dir        = getPayslipsDir()

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.copyFileSync(srcPath, path.join(dir, filename))

    const payslip = {
      id,
      month: parseInt(month),
      year:  parseInt(year),
      filename,
      originalName: origName,
      uploadedAt: new Date().toISOString()
    }
    return { success: true, payslip }
  } catch (err) {
    console.error('upload-payslip error:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('download-payslip', async (event, { filename, month, year }) => {
  try {
    const win     = BrowserWindow.fromWebContents(event.sender)
    const srcPath = path.join(getPayslipsDir(), filename)

    if (!fs.existsSync(srcPath)) {
      return { success: false, error: 'File not found on disk' }
    }

    const defaultName = `Payslip-${year}-${String(month).padStart(2, '0')}.pdf`
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      defaultPath: defaultName,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return { success: false, canceled: true }

    fs.copyFileSync(srcPath, filePath)
    return { success: true, filePath }
  } catch (err) {
    console.error('download-payslip error:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('delete-payslip', async (event, { filename }) => {
  try {
    const filePath = path.join(getPayslipsDir(), filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    return { success: true }
  } catch (err) {
    console.error('delete-payslip error:', err)
    return { success: false, error: err.message }
  }
})
