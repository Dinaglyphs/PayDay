# PayDay *by Dinaglyphs*

A personal payday management desktop app for Windows. Built with Electron, React, and Vite.

PayDay helps you take control of every pay cycle — log your income, track bills, manage debts, store payslips, and review your financial patterns over time. Everything runs locally on your machine. No accounts, no cloud, no subscriptions.

---

## Features

### Pay Cycle Management
- Start a new pay cycle by entering your paycheck and any other income
- Bills are pre-loaded from your template so you're not starting from scratch each month
- Mark bills as **Sorted**, **Pending**, or **Skipped** as you work through them
- Log the actual amount paid against each bill (budgeted vs actual)
- Smart category auto-detection when you add a new bill by name
- Close a cycle when done — it gets archived with a full snapshot

### Bill Categories
Bills are organised across eight categories:
Housing · Utilities · Debt Repayment · Transport · Food & Living · Savings · Personal · Other

### Debt Tracker
- Add debts with type (Credit Card, Loan, Personal) and opening balance
- Log payments against debts each cycle — they reduce the live balance automatically
- Payoff projection calculated from your average monthly reduction across past cycles
- Track total outstanding vs total paid across all debts

### Cycle History
- Every closed cycle is stored and browsable
- Full breakdown per cycle: income, confirmed out (bills + debt payments), pending, skipped, and remaining
- Export any cycle as **XLSX (Excel)** or **PDF**
- Delete individual cycle records

### Payslips Vault
- Upload PDF payslips and tag them with a month and year
- Stored locally in a dedicated folder alongside your app data
- Download any stored payslip at any time
- Delete payslips you no longer need

### Annual Wrap & Patterns
- Bar chart of monthly remaining balance across the year
- Year selector to compare across multiple years
- Spending patterns view showing category breakdowns over time
- Requires at least two closed cycles to activate

### Settings
- Manage your bill template (add, edit, delete recurring bills)
- Manage debts from the Debt Tracker screen
- Light / Dark theme toggle (defaults to dark)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 28 |
| UI framework | React 18 |
| Build tool | Vite 5 |
| Charts | Chart.js 4 + react-chartjs-2 |
| Excel export | SheetJS (xlsx) |
| PDF generation | pdf-lib |
| Installer | electron-builder 24 |

---

## Data & Privacy

All data is stored locally in a SQLite database (`payday.db`) placed next to the installed application executable. If a legacy `payday-data.json` file is found on first launch, it is automatically migrated to the database. Payslip PDFs are stored in a `payday-payslips/` folder in the same location. Nothing is sent to any server. There is no telemetry.

---

## Getting Started (Development)

### Prerequisites
- Node.js 18 or later
- npm

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

This starts the Vite dev server and launches Electron concurrently. The app loads from `http://localhost:3000` in dev mode.

### Build for production

```bash
npm run build
```

This bundles the React app with Vite, then packages everything into a Windows MSI installer via electron-builder. Output is written to the `dist/` folder.

> **Note:** Building the MSI target requires [WiX Toolset v3](https://github.com/wixtoolset/wix3/releases) to be installed on your machine. Download and install it before running the build.

---

## Project Structure

```
├── electron/
│   ├── main.js          # Electron main process, IPC handlers
│   ├── preload.js       # Context bridge — exposes API to renderer
│   └── pdfExport.js     # PDF generation logic (pdf-lib)
├── src/
│   ├── screens/
│   │   ├── Setup.jsx        # First-run setup
│   │   ├── Session.jsx      # Active pay cycle screen
│   │   ├── CycleDetail.jsx  # Historical cycle view + export
│   │   ├── DebtTracker.jsx  # Debt management
│   │   ├── Payslips.jsx     # Payslip vault
│   │   ├── AnnualWrap.jsx   # Annual reports + patterns
│   │   └── Settings.jsx     # App settings + bill template
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── StatCard.jsx
│   │   ├── BillRow.jsx
│   │   ├── StartSessionModal.jsx
│   │   └── CloseSessionModal.jsx
│   ├── App.jsx
│   └── styles/index.css     # Glassmorphism design system
├── public/
│   └── icon.ico
└── package.json
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server + Electron |
| `npm run build:react` | Build React app only (outputs to `build/`) |
| `npm run build` | Full production build → MSI installer in `dist/` |
| `npm run preview` | Preview the Vite production build |

---

## Design

PayDay uses a glassmorphism design system built on a deep violet base (`#0D0010`) with magenta/fuchsia accents. All components use CSS custom properties for theming, with `backdrop-filter` frosted glass cards, gradient progress bars, and glow status indicators.

---

## Credits

Vibecoded by **Opeyemi Daniel Abatan** · [@dinaglyphs](https://github.com/dinaglyphs)
