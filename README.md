# PayDay *by Dinaglyphs*

> A personal salary and bill management app — track your income, recurring bills, debts, and payslips across every pay cycle.

Built with **React 18 + Vite**, backed by **Supabase** (auth, database, file storage), and available as both a **web app** (Vercel) and a **desktop app** (Electron for Windows).

---

## Features

### Payday Session
Start a new pay cycle by entering your paycheck and any other income. Bills are pre-loaded from your template so you're never starting from scratch. Work through them one by one — mark each as **Sorted**, **Pending**, or **Skipped**, and log the actual amount paid. Record debt payments as you go. Close the session when done; it locks into history with a full snapshot.

### Debt Tracker
Add credit cards, loans, and personal debts with their current balance. PayDay captures a balance snapshot at every session close and tracks reduction over time. Payoff projection is calculated from your average monthly reduction across past cycles.

### Payslips Vault
Upload PDF or image payslips and tag them with a month and year. Stored in Supabase Storage. Download or delete them any time.

### Annual Wrap
A yearly overview of income, spending, and remaining balance across all closed cycles. Bar chart, year selector, and per-category breakdowns.

### Patterns
Spending pattern analysis across your full pay history. Requires at least two closed cycles.

### Settings
Manage your recurring bills template and debt list. Changes to the template apply to future sessions — past cycles are never modified. Currency (world currencies supported) and light/dark appearance preferences are also here.

### Account Management
Full account deletion from Settings → Preferences → Danger Zone. Two-step confirmation triggers a server-side `delete_account()` RPC that wipes all your data and removes the auth user in one shot.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5 |
| Styling | Tailwind CSS + CSS custom properties |
| Auth | Supabase Auth (email/password, magic link, password recovery) |
| Database | Supabase (PostgreSQL) with Row Level Security |
| File storage | Supabase Storage (payslips) |
| Charts | Chart.js 4 + react-chartjs-2 |
| PDF generation | pdf-lib |
| Excel export | SheetJS (xlsx) |
| Desktop wrapper | Electron 28 + electron-builder |
| Deployment | Vercel (web) |

---

## Project Structure

```
src/
├── App.jsx                    # Root: auth state, data loading, smart persist
├── main.jsx                   # Vite entry point
├── screens/
│   ├── Welcome.jsx            # Onboarding flow (multi-step)
│   ├── Setup.jsx              # First-run template setup (bills + debts)
│   ├── Auth.jsx               # Sign in / sign up / magic link
│   ├── ResetPassword.jsx      # Password recovery handler
│   ├── Session.jsx            # Active payday session
│   ├── CycleDetail.jsx        # View a closed cycle + export
│   ├── DebtTracker.jsx        # Debt overview + balance history
│   ├── Payslips.jsx           # Payslip upload + viewer
│   ├── AnnualWrap.jsx         # Yearly summary + charts
│   ├── Settings.jsx           # Template management + preferences
│   └── About.jsx              # About PayDay
├── components/
│   ├── Sidebar.jsx            # Navigation + cycle history
│   ├── BillRow.jsx            # Bill row in active session
│   ├── DebtRow.jsx            # Debt row in tracker
│   ├── StatCard.jsx           # Reusable stat display card
│   ├── StartSessionModal.jsx  # Income entry modal
│   ├── CloseSessionModal.jsx  # Session close + debt payment modal
│   └── ErrorBoundary.jsx      # Top-level error boundary
├── context/
│   └── CurrencyContext.jsx    # Currency code, symbol, formatter (app-wide)
├── store/
│   └── dataStore.js           # All Supabase read/write operations
├── lib/
│   └── supabase.js            # Supabase client initialisation
└── styles/
    └── index.css              # Global styles, CSS variables, responsive rules

supabase/
├── schema.sql                 # Full DB schema — run once to initialise
└── migration.sql              # Incremental migrations (run after schema)

electron/                      # Electron main process (desktop builds)
public/                        # Static assets (icons, logo variants)
```

---

## Database Schema

Eight tables, all scoped by `user_id` with Row Level Security enforced at the Postgres level:

| Table | Purpose |
|---|---|
| `preferences` | Key/value user preferences (currency, theme) |
| `template_bills` | Recurring bill template per user |
| `template_debts` | Debt list template per user |
| `cycles` | Pay cycles (open or closed) |
| `cycle_bills` | Bill records within each cycle |
| `cycle_debt_payments` | Debt payments made during a cycle |
| `cycle_debt_snapshots` | Debt balances captured at cycle close |
| `payslips` | Payslip metadata (file reference + month/year) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/Dinaglyphs/PayDay.git
cd PayDay
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql` to create all tables and RLS policies
3. Then run `supabase/migration.sql` for any incremental changes
4. Enable **Email Auth** under Authentication → Providers
5. Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run in development (web)

```bash
npx vite
# or
npm run preview
```

### 4. Run in development (desktop)

```bash
npm run dev
```

Starts Vite and Electron concurrently. The app loads from `http://localhost:3000`.

---

## Building

### Web (Vite only)

```bash
npm run build:react
```

Output goes to `build/`. Deploy this folder to any static host.

### Desktop (Windows)

```bash
npm run build
```

Produces:
- NSIS installer (`.exe`)
- Portable executable
- MSI installer

All written to `dist/`. Targets Windows x64.

---

## Deployment (Vercel)

The web app auto-deploys on every push to `main` via Vercel's GitHub integration.

Set these environment variables in Vercel project settings:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

| Setting | Value |
|---|---|
| Build command | `npm run build:react` |
| Output directory | `build` |
| Node.js version | 18.x |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server + Electron |
| `npm run build:react` | Build React app only (outputs to `build/`) |
| `npm run build` | Full desktop build → Windows installers in `dist/` |
| `npm run preview` | Preview the Vite production build in browser |

---

## Bill Categories

Bills are organised across eight categories:

`Housing` · `Utilities` · `Debt repayment` · `Transport` · `Food & living` · `Savings` · `Personal` · `Other`

---

## Design

PayDay uses a glassmorphism design system with two complete themes (light and dark). The dark theme is built on a deep violet base (`#0D0010`) with magenta/fuchsia accents (`#CC3399`). Light theme uses clean whites with green active states. All theming is driven by CSS custom properties — no hardcoded colours in components.

The layout is fully responsive: sidebar collapses to a slide-in drawer on mobile, all tables reflow to card views, and the sidebar uses `100dvh` for correct height on iOS Safari.

---

## Password Reset

Supabase sends the reset email. When the user clicks the link, a `PASSWORD_RECOVERY` auth event fires. `App.jsx` intercepts this and renders the `ResetPassword` screen, which calls `supabase.auth.updateUser({ password })` to complete the update.

---

## Account Deletion

Settings → Preferences → Danger Zone. A two-step confirmation calls the `delete_account()` Postgres function (`security definer`), which deletes all user data across every table and removes the auth user record. The Supabase auth listener then clears the app state automatically.

---

## Credits

Vibecoded by **Opeyemi Daniel Abatan** · [@dinaglyphs](https://github.com/dinaglyphs)

---

*Copyright © 2026 Opeyemi Daniel Abatan. All rights reserved.*
