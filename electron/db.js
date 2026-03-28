const path = require('path')
const fs   = require('fs')

let SQL
let db

// ── Path helpers ─────────────────────────────────────────────────────────────

function getDbPath(app) {
  if (app.isPackaged) {
    return path.join(path.dirname(app.getPath('exe')), 'payday.db')
  }
  return path.join(__dirname, '..', 'payday.db')
}

function getJsonPath(app) {
  if (app.isPackaged) {
    return path.join(path.dirname(app.getPath('exe')), 'payday-data.json')
  }
  return path.join(__dirname, '..', 'payday-data.json')
}

function getWasmDir(app) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist')
  }
  return path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist')
}

// ── Init ─────────────────────────────────────────────────────────────────────

async function init(app) {
  const initSqlJs = require('sql.js')
  SQL = await initSqlJs({ locateFile: f => path.join(getWasmDir(app), f) })

  const dbPath = getDbPath(app)
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath))
  } else {
    db = new SQL.Database()
  }

  createSchema()
  migrateFromJson(app)
}

function save(app) {
  const data = db.export()
  fs.writeFileSync(getDbPath(app), Buffer.from(data))
}

// ── Query helpers ─────────────────────────────────────────────────────────────

function all(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function get(sql, params = []) {
  return all(sql, params)[0] || null
}

function run(sql, params = []) {
  db.run(sql, params)
}

// ── Schema ────────────────────────────────────────────────────────────────────

function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS preferences (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS template_bills (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL DEFAULT '',
      budgeted   REAL NOT NULL DEFAULT 0,
      category   TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS template_debts (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL DEFAULT '',
      type             TEXT NOT NULL DEFAULT '',
      starting_balance REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cycles (
      id           TEXT PRIMARY KEY,
      date         TEXT,
      paycheck     REAL DEFAULT 0,
      other_income REAL DEFAULT 0,
      total_income REAL DEFAULT 0,
      is_active    INTEGER NOT NULL DEFAULT 0,
      status       TEXT DEFAULT 'closed',
      closed_at    TEXT,
      created_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cycle_bills (
      id         TEXT PRIMARY KEY,
      cycle_id   TEXT NOT NULL,
      name       TEXT DEFAULT '',
      category   TEXT DEFAULT '',
      budgeted   REAL DEFAULT 0,
      actual     REAL DEFAULT 0,
      status     TEXT DEFAULT 'untouched',
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cycle_debt_payments (
      id          TEXT PRIMARY KEY,
      cycle_id    TEXT NOT NULL,
      debt_id     TEXT DEFAULT '',
      debt_name   TEXT DEFAULT '',
      amount_paid REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cycle_debt_snapshots (
      id       TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL,
      debt_id  TEXT DEFAULT '',
      name     TEXT DEFAULT '',
      balance  REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS payslips (
      id            TEXT PRIMARY KEY,
      month         INTEGER NOT NULL,
      year          INTEGER NOT NULL,
      filename      TEXT NOT NULL,
      original_name TEXT DEFAULT '',
      uploaded_at   TEXT NOT NULL
    );
  `)
}

// ── Migration from JSON ───────────────────────────────────────────────────────

function migrateFromJson(app) {
  const jsonPath = getJsonPath(app)
  if (!fs.existsSync(jsonPath)) return

  const existing = get('SELECT COUNT(*) as n FROM cycles')
  const prefExisting = get('SELECT COUNT(*) as n FROM preferences')
  if (existing.n > 0 || prefExisting.n > 0) return

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    _writeAll(data)
    console.log('[db] Migrated payday-data.json → payday.db')
  } catch (e) {
    console.error('[db] JSON migration failed:', e.message)
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────

function readAll() {
  // Preferences
  const prefRows = all('SELECT key, value FROM preferences')
  const preferences = {}
  for (const row of prefRows) {
    try { preferences[row.key] = JSON.parse(row.value) } catch { preferences[row.key] = row.value }
  }

  // Template
  const templateBills = all('SELECT * FROM template_bills ORDER BY sort_order')
  const templateDebts = all('SELECT * FROM template_debts')
  const template = (templateBills.length > 0 || templateDebts.length > 0) ? {
    bills: templateBills.map(b => ({ id: b.id, name: b.name, budgeted: b.budgeted, category: b.category })),
    debts: templateDebts.map(d => ({ id: d.id, name: d.name, type: d.type, startingBalance: d.starting_balance })),
  } : null

  // Closed cycles
  const cycleRows = all("SELECT * FROM cycles WHERE is_active = 0 ORDER BY created_at DESC")
  const cycles = cycleRows.map(buildCycleObject)

  // Active session
  const activeRow = get("SELECT * FROM cycles WHERE is_active = 1")
  const activeSession = activeRow ? buildCycleObject(activeRow) : null

  // Payslips
  const payslips = all('SELECT * FROM payslips ORDER BY year DESC, month DESC').map(p => ({
    id: p.id, month: p.month, year: p.year,
    filename: p.filename, originalName: p.original_name, uploadedAt: p.uploaded_at,
  }))

  return { preferences, template, cycles, activeSession, payslips }
}

function buildCycleObject(row) {
  const bills     = all('SELECT * FROM cycle_bills WHERE cycle_id = ? ORDER BY sort_order', [row.id])
  const payments  = all('SELECT * FROM cycle_debt_payments WHERE cycle_id = ?', [row.id])
  const snapshots = all('SELECT * FROM cycle_debt_snapshots WHERE cycle_id = ?', [row.id])
  return {
    id: row.id, date: row.date,
    paycheck: row.paycheck, otherIncome: row.other_income, totalIncome: row.total_income,
    status: row.status, closedAt: row.closed_at,
    bills:         bills.map(b => ({ id: b.id, name: b.name, category: b.category, budgeted: b.budgeted, actual: b.actual, status: b.status })),
    debtPayments:  payments.map(p => ({ debtId: p.debt_id, debtName: p.debt_name, amountPaid: p.amount_paid })),
    debtSnapshots: snapshots.map(s => ({ id: s.debt_id, name: s.name, balance: s.balance })),
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

function writeAll(data, app) {
  _writeAll(data)
  save(app)
}

function _writeAll(data) {
  // Preferences
  if (data.preferences) {
    for (const [key, value] of Object.entries(data.preferences)) {
      run('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)', [key, JSON.stringify(value)])
    }
  }

  // Template — clear and rewrite (small table)
  if (data.template) {
    db.exec('DELETE FROM template_bills; DELETE FROM template_debts;')
    ;(data.template.bills || []).forEach((b, i) => {
      run('INSERT INTO template_bills (id, name, budgeted, category, sort_order) VALUES (?, ?, ?, ?, ?)',
        [b.id, b.name, b.budgeted ?? 0, b.category ?? '', i])
    })
    ;(data.template.debts || []).forEach(d => {
      run('INSERT INTO template_debts (id, name, type, starting_balance) VALUES (?, ?, ?, ?)',
        [d.id, d.name, d.type ?? '', d.startingBalance ?? 0])
    })
  }

  // Clear is_active on all cycles first
  db.exec('UPDATE cycles SET is_active = 0')

  // Upsert closed cycles
  upsertCycles(data.cycles || [], 0)

  // Upsert active session
  if (data.activeSession) {
    upsertCycles([data.activeSession], 1)
  }

  // Payslips — sync: insert new, delete removed
  if (data.payslips) {
    const existing = new Set(all('SELECT id FROM payslips').map(r => r.id))
    const current  = new Set((data.payslips).map(p => p.id))

    for (const p of data.payslips) {
      if (!existing.has(p.id)) {
        run('INSERT INTO payslips (id, month, year, filename, original_name, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)',
          [p.id, p.month, p.year, p.filename, p.originalName ?? '', p.uploadedAt])
      }
    }
    for (const id of existing) {
      if (!current.has(id)) run('DELETE FROM payslips WHERE id = ?', [id])
    }
  }
}

function upsertCycles(cycles, isActive) {
  for (const cycle of cycles) {
    run(`INSERT INTO cycles (id, date, paycheck, other_income, total_income, is_active, status, closed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           date=excluded.date, paycheck=excluded.paycheck, other_income=excluded.other_income,
           total_income=excluded.total_income, is_active=excluded.is_active,
           status=excluded.status, closed_at=excluded.closed_at`,
      [cycle.id, cycle.date, cycle.paycheck ?? 0, cycle.otherIncome ?? 0,
       cycle.totalIncome ?? 0, isActive, cycle.status ?? (isActive ? 'open' : 'closed'), cycle.closedAt ?? null])

    // Bills — upsert each
    ;(cycle.bills || []).forEach((b, i) => {
      run(`INSERT INTO cycle_bills (id, cycle_id, name, category, budgeted, actual, status, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name=excluded.name, category=excluded.category, budgeted=excluded.budgeted,
             actual=excluded.actual, status=excluded.status, sort_order=excluded.sort_order`,
        [b.id, cycle.id, b.name, b.category ?? '', b.budgeted ?? 0, b.actual ?? 0, b.status ?? 'untouched', i])
    })

    // Debt payments — delete + reinsert (they can change in bulk)
    run('DELETE FROM cycle_debt_payments WHERE cycle_id = ?', [cycle.id])
    ;(cycle.debtPayments || []).forEach((p, i) => {
      run('INSERT INTO cycle_debt_payments (id, cycle_id, debt_id, debt_name, amount_paid) VALUES (?, ?, ?, ?, ?)',
        [`${cycle.id}-dp-${i}`, cycle.id, p.debtId ?? '', p.debtName ?? '', p.amountPaid ?? 0])
    })

    // Debt snapshots — delete + reinsert
    run('DELETE FROM cycle_debt_snapshots WHERE cycle_id = ?', [cycle.id])
    ;(cycle.debtSnapshots || []).forEach((s, i) => {
      run('INSERT INTO cycle_debt_snapshots (id, cycle_id, debt_id, name, balance) VALUES (?, ?, ?, ?, ?)',
        [`${cycle.id}-ds-${i}`, cycle.id, s.id ?? '', s.name ?? '', s.balance ?? 0])
    })
  }
}

module.exports = { init, readAll, writeAll }
