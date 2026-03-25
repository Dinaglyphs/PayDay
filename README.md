# PayDay by Dinaglyphs

A personal payday management desktop app for Windows. Built to replace the spreadsheet habit — not with another spreadsheet, but with a purpose-built workflow tool that mirrors how you actually think on payday.

---

## What it does

PayDay gives you one focused session per pay cycle. You open it on payday, your bills are already loaded. You work through each payment, mark statuses as you go, and close the session when you're done. Every cycle is saved. Over time, the app builds a financial picture you can actually learn from.

No accounts. No subscription. No internet connection required. Your data lives on your machine.

---

## How it works

### The payday session

When you start a new session, you enter two numbers: your paycheck and any other income that came in that cycle. Your bills load automatically from your template. From there, you work through each one.

Every bill has four states:

| Status | Colour | Meaning |
|--------|--------|---------|
| Untouched | Grey | Not yet dealt with |
| Pending | Amber | Payment initiated or waiting to clear |
| Sorted | Green | Confirmed paid |
| Skipped | Red | Consciously deferring this cycle |

Click a bill row to cycle through statuses. The actual amount is pre-filled with your budgeted amount — tap it to edit inline if the real payment differs. Four live figures update as you work: total income, confirmed out, in motion, and remaining.

When you're done, hit Close cycle. The app asks you to confirm or update each debt balance, then saves the cycle to your history.

### Bill template

Your recurring bills live in a master template that pre-loads into every new session. Set it up once during onboarding and update it whenever something changes — either from Settings, or directly mid-session. When you edit an amount mid-session, the app asks: just this cycle, or update the template for future cycles too?

### Debt tracker

Tracks all your debts with three figures per debt: original balance, total paid so far, and current balance remaining. A green progress bar fills left to right as each debt reduces. Once you have two or more saved cycles, the app calculates a projected clearance date per debt based on your actual average monthly reduction. Total debt outstanding across all debts is displayed prominently at the top.

You can also pay toward any debt directly from within a payday session. The payment is recorded against the cycle and the debt balance updates immediately.

### Annual wrap

Pulls your saved cycles and shows you: total earned, total spent, total debt reduced, a month-by-month balance chart, debt trajectory across the year, pattern callouts (best month, worst month, most skipped bill, average unallocated money per cycle), and other income trends. Requires at least two saved cycles to generate.

### PDF and TXT export

Every saved cycle can be exported as a branded PDF report or a plain text file. The PDF follows the Dinaglyphs brand identity — dark background, magenta and fuchsia accents, colour-coded bill statuses. Both exports include the full bill breakdown, cycle totals, any debt payments made that cycle, and the debt snapshot at close.

---

## Getting started

### Prerequisites

- Windows 10 or later
- Node.js 18 or later

### Installation

```bash
git clone https://github.com/yourusername/payday.git
cd payday
npm install
```

### Running in development

```bash
npm run dev
```

### Building for Windows

```bash
npm run build
```

Two files are produced in the `dist/` folder:

- `PayDay-by-Dinaglyphs-Setup.exe` — standard installer with Start Menu and Desktop shortcuts
- `PayDay-by-Dinaglyphs-Portable.exe` — standalone executable, runs without installation

---

## First-run experience

The first time you open PayDay, a three-step welcome guide walks you through how the app works, explains the four bill statuses, and asks you to choose your currency. You then go through a short setup screen to add your recurring bills and current debts. This only happens once.

---

## Currency support

PayDay supports six currencies. You choose your currency during first-run setup and can change it at any time in Settings → Preferences. All monetary displays throughout the app — bills, debts, totals, charts, and PDF exports — update immediately when you change currency.

Supported currencies:

| Currency | Symbol |
|----------|--------|
| British Pound Sterling | £ |
| US Dollar | $ |
| Nigerian Naira | ₦ |
| Ghanaian Cedi | GH₵ |
| Kenyan Shilling | KSh |
| Euro | € |

---

## Data storage

All data is stored locally in a single JSON file in the app's installation directory:

```
[Install location]\payday-data.json
```

Nothing is sent anywhere. No cloud sync, no telemetry, no external connections of any kind. When you uninstall the app, the data file is removed with it. Reinstalling starts fresh.

To back up your data, copy `payday-data.json` to a safe location before uninstalling.

---

## Windows SmartScreen warning

If Windows shows a "Windows protected your PC" SmartScreen warning when installing, this is expected. The app does not yet have a paid Microsoft code signing certificate. To proceed:

1. Click "More info" on the SmartScreen dialog
2. Click "Run anyway"

The software is safe — it stores all data locally and makes no internet connections. If you want to avoid the warning entirely, use the Portable version which runs directly without triggering SmartScreen.

---

## Settings

**Bills tab** — manage your recurring bill template. Add, edit, or delete bills. Changes apply to future cycles only and do not alter any saved history.

**Debts tab** — manage your debt list. Edit current balances, add new debts, or remove cleared ones.

**Preferences tab** — change your currency and switch between dark and light mode. Both settings take effect immediately.

---

## Bill categories

When adding bills, you can assign one of the following categories:

Housing · Utilities · Debt repayment · Transport · Food & living · Savings · Personal · Other

---

## Keyboard shortcuts

| Action | Shortcut |
|--------|----------|
| Move between amount fields | Tab |
| Confirm amount edit | Enter |
| Cancel amount edit | Escape |

---

## Project structure

```
payday/
├── electron/
│   ├── main.js           — Electron entry point and IPC handlers
│   ├── preload.js        — Context bridge API
│   └── pdfExport.js      — Branded PDF generation via pdf-lib
├── src/
│   ├── App.jsx           — Root component and routing
│   ├── constants/
│   │   └── currencies.js — Supported currency definitions
│   ├── context/
│   │   └── CurrencyContext.jsx — Global currency state
│   ├── store/
│   │   └── dataStore.js  — All read/write to local JSON
│   ├── screens/
│   │   ├── Welcome.jsx   — First-run onboarding flow
│   │   ├── Setup.jsx     — Bill and debt template setup
│   │   ├── Session.jsx   — Active payday session
│   │   ├── DebtTracker.jsx
│   │   ├── AnnualWrap.jsx
│   │   └── Settings.jsx
│   └── components/
│       ├── Sidebar.jsx
│       ├── BillRow.jsx
│       ├── StatCard.jsx
│       ├── DebtRow.jsx
│       ├── CloseSessionModal.jsx
│       └── StartSessionModal.jsx
├── public/
│   ├── icon.ico          — Windows installer icon (multi-size)
│   ├── icon.png          — App window icon
│   ├── icon-source.png   — Gradient logo (welcome screen)
│   ├── icon-source-dark.png  — Dark logo (sidebar mark)
│   └── icon-source-light.png — Light logo (light mode)
└── build/
    ├── installer.nsh     — NSIS installer customisation
    └── README-INSTALL.txt
```

---

## Tech stack

Electron · React · Tailwind CSS · Chart.js · pdf-lib · Local JSON

---

## Roadmap

Cycle notes field (context for why a month looked the way it did) · Debt payoff strategy calculator (avalanche vs snowball) · Financial health score per cycle · Carry-forward alerts for skipped bills · CSV export of cycle history · Mobile companion app

---

## Licence

No License. All rights reserved.

---

*Vibecoded by Opeyemi Daniel Abatan · @dinaglyphs*
