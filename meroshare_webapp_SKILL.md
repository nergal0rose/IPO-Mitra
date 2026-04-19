---
name: meroshare-webapp
description: >
  Complete build plan and reference for a MeroShare IPO automation web application.
  Use this skill when the user says anything like "build the meroshare app", "work on
  the IPO web app", "add a feature to the IPO app", "build the dashboard", "set up the
  backend", or any task related to this specific project. Contains full feature spec,
  tech stack, architecture, screen-by-screen UI plan, API design, database schema,
  and build order. Always read this before writing any code for this project.
---

# MeroShare IPO Web App — Master Build Plan

A local-first web application that lets Prakash manage IPO applications for his entire
family from a single dashboard. Connects to the MeroShare REST API. No browser
automation. Data stored locally. Runs on localhost.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Fast dev, component reuse, familiar ecosystem |
| Styling | Tailwind CSS | Utility-first, no fighting CSS specificity |
| UI Components | shadcn/ui | Clean, accessible, copy-paste components |
| Charts | Recharts | Lightweight, React-native charting |
| Backend | FastAPI (Python) | Already have MeroShare logic in Python; async-ready |
| Database | SQLite via SQLModel | Zero config, local file, good for single-user |
| Auth (app) | Simple PIN lock | Protects credentials on localhost |
| Notifications | SMTP email + optional | Alert on allotment result |
| Packaging | None — runs locally | `npm run dev` + `uvicorn` |

---

## Feature List

### F1 — Account Management
- Add / edit / delete family member accounts
- Store: name, DP ID, username, password (AES-256 encrypted at rest), CRN, default kitta, transaction PIN
- Per-account connection status (last login result + timestamp)
- **Account health check** — test-login all accounts at once, show green/red status
- Account grouping (e.g. "Primary", "Family")

### F2 — IPO Dashboard (Home)
- Live list of currently open IPOs pulled from MeroShare `/active/`
- Cards showing: company name, share type, open/close date, price, minimum kitta
- Countdown timer to close date for each IPO
- Color coding: closing today = red, closing tomorrow = orange, rest = normal
- Mark IPO as "Skip" (blacklist) — will not auto-apply for this IPO
- Mark IPO as "Priority" — apply extra kitta

### F3 — Single Apply
- Pick one account + one IPO
- Set custom kitta amount
- Preview payload before submitting
- Submit and show response inline
- Log result

### F4 — Bulk Apply
- Select which accounts to include (checkboxes, default = all)
- Select which IPOs to apply for (default = all non-skipped open ones)
- Override kitta globally or per-IPO per-account
- **Dry Run toggle** — simulate without submitting
- Progress indicator as each account/IPO combination runs
- Live result table updating as applications fire
- Summary at end: X applied, Y skipped, Z failed

### F5 — Application History (Single Report)
- Per-account view of all submitted applications
- Table: company, applied kitta, date applied, status, allotted kitta
- Filter by: account, date range, status (pending / allotted / not allotted)
- Click any row to see full allotment detail

### F6 — Bulk Report
- Cross-account report — all family members in one table
- Pivot view: IPO as rows, family members as columns, allotted kitta in cells
- Summary row: total allotted per IPO, total per person
- Win rate per account (allotted / applied over time)
- Export to Excel (.xlsx) and PDF
- Print-friendly layout

### F7 — IPO Calendar
- Monthly calendar view showing IPO open/close dates
- Click a date to see which IPOs open/close that day
- Upcoming IPOs section (from NEPSE announcements — manual entry or scrape)

### F8 — Portfolio Tracker
- Record of all allotted shares across all accounts
- Track listing date, listing price vs offer price
- Gain/loss per IPO per account
- Total portfolio value from IPO investments
- Manual price update or NEPSE Alpha API integration

### F9 — Notifications
- Email alert when allotment results are published
- Summary email: "3 of 5 accounts got allotment for XYZ Ltd"
- Configurable SMTP (Gmail works with app password)
- Optional: show browser desktop notification

### F10 — Settings
- App PIN (protects the app on localhost)
- SMTP config for notifications
- Default kitta for new accounts
- IPO blacklist (permanent skip list by company name keyword)
- Auto-apply schedule toggle + time picker
- Theme: light / dark

### F11 — Scheduler (in-app)
- Toggle to enable daily auto-apply
- Set run time (default 09:30 NPT)
- View last run result and next scheduled run
- Manual "Run Now" button

---

## Screens / Pages

```
/                  → IPO Dashboard (open IPOs, quick apply)
/accounts          → Account management
/apply             → Apply page (single + bulk toggle)
/reports           → Reports (single/bulk toggle, filters)
/calendar          → IPO calendar
/portfolio         → Portfolio tracker
/settings          → App settings, notifications, scheduler
```

---

## Database Schema (SQLite)

### accounts
```sql
id          INTEGER PRIMARY KEY
name        TEXT
dp_id       TEXT
username    TEXT
password    TEXT  -- AES encrypted
crn         TEXT
transaction_pin TEXT  -- AES encrypted
default_kitta INTEGER DEFAULT 10
group_label TEXT DEFAULT 'Family'
active      BOOLEAN DEFAULT 1
created_at  DATETIME
```

### applications
```sql
id              INTEGER PRIMARY KEY
account_id      INTEGER REFERENCES accounts(id)
company_name    TEXT
company_share_id INTEGER
applied_kitta   INTEGER
applied_at      DATETIME
status          TEXT   -- PENDING / ALLOTTED / NOT_ALLOTTED / FAILED
allotted_kitta  INTEGER
raw_response    TEXT   -- full JSON stored for debugging
```

### ipo_overrides
```sql
id              INTEGER PRIMARY KEY
company_keyword TEXT   -- matched case-insensitively
action          TEXT   -- SKIP | PRIORITY
kitta_override  INTEGER  -- NULL = use account default
```

### portfolio
```sql
id              INTEGER PRIMARY KEY
account_id      INTEGER REFERENCES accounts(id)
company_name    TEXT
allotted_kitta  INTEGER
offer_price     REAL
listing_date    DATE
listing_price   REAL
current_price   REAL
updated_at      DATETIME
```

### scheduler_runs
```sql
id          INTEGER PRIMARY KEY
run_at      DATETIME
status      TEXT   -- SUCCESS | PARTIAL | FAILED
summary     TEXT   -- JSON: {applied, skipped, failed}
log         TEXT
```

---

## Backend API (FastAPI)

### Accounts
```
GET    /api/accounts              list all accounts
POST   /api/accounts              add account
PUT    /api/accounts/{id}         update account
DELETE /api/accounts/{id}         delete account
POST   /api/accounts/health-check test login for all accounts
```

### IPOs
```
GET    /api/ipos/open             fetch open IPOs from MeroShare
GET    /api/ipos/overrides        list skip/priority rules
POST   /api/ipos/overrides        add rule
DELETE /api/ipos/overrides/{id}   remove rule
```

### Apply
```
POST   /api/apply/single          apply one account to one IPO
POST   /api/apply/bulk            apply all accounts to all open IPOs
POST   /api/apply/dry-run         simulate bulk apply
```

### Reports
```
GET    /api/reports/account/{id}  single account application history
GET    /api/reports/bulk          all accounts combined
GET    /api/reports/export/xlsx   download Excel report
GET    /api/reports/export/pdf    download PDF report
```

### Portfolio
```
GET    /api/portfolio             all allotted shares
POST   /api/portfolio             add entry manually
PUT    /api/portfolio/{id}        update price
```

### Scheduler
```
GET    /api/scheduler/status      next run, last run, enabled flag
POST   /api/scheduler/toggle      enable / disable
POST   /api/scheduler/run-now     trigger immediately
GET    /api/scheduler/history     past run logs
```

### Notifications
```
POST   /api/notifications/test    send test email
PUT    /api/notifications/config  save SMTP settings
```

---

## Frontend Component Map

```
App
├── Layout (sidebar nav + top bar)
├── pages/
│   ├── Dashboard
│   │   ├── IPOCard (company name, countdown, price, actions)
│   │   ├── QuickApplyModal
│   │   └── AccountStatusBar (health check badges)
│   ├── Accounts
│   │   ├── AccountTable
│   │   ├── AccountForm (add/edit drawer)
│   │   └── HealthCheckPanel
│   ├── Apply
│   │   ├── ApplyModeToggle (Single / Bulk)
│   │   ├── SingleApplyForm
│   │   └── BulkApplyPanel
│   │       ├── AccountSelector (checkboxes)
│   │       ├── IPOSelector (checkboxes + kitta override)
│   │       ├── DryRunToggle
│   │       └── ProgressTable (live updating)
│   ├── Reports
│   │   ├── ReportModeToggle (Single / Bulk)
│   │   ├── SingleReport (account picker + table + filters)
│   │   └── BulkReport (pivot table + export buttons)
│   ├── Calendar
│   │   └── IPOCalendar
│   ├── Portfolio
│   │   ├── PortfolioTable
│   │   └── PortfolioStats (total invested, total gain/loss)
│   └── Settings
│       ├── SMTPConfig
│       ├── SchedulerConfig
│       ├── BlacklistManager
│       └── AppPINConfig
└── components/
    ├── StatusBadge
    ├── CountdownTimer
    ├── ConfirmDialog
    ├── ExportButton
    └── NotificationToast
```

---

## Build Order (Phases)

### Phase 1 — Core (build first)
1. FastAPI project setup + SQLite + SQLModel models
2. Credential encryption utility (AES-256, key derived from app PIN)
3. MeroShare API service class (port from meroshare.py)
4. Backend endpoints: accounts CRUD + `/ipos/open` + `/apply/bulk` + `/apply/single`
5. React + Vite setup with Tailwind + shadcn/ui
6. Account management page (add/edit/delete/health check)
7. IPO Dashboard page (open IPOs with countdown)
8. Apply page (single + bulk with dry-run)

### Phase 2 — Reports
9. Application logging (save every apply result to DB)
10. Single report page (per account, filterable table)
11. Bulk report page (pivot table, cross-account view)
12. Excel export (openpyxl)
13. PDF export (reportlab or weasyprint)

### Phase 3 — Quality of Life
14. IPO overrides (skip/priority rules)
15. Notifications (SMTP email on allotment)
16. Scheduler (APScheduler inside FastAPI)
17. Settings page

### Phase 4 — Portfolio + Polish
18. Portfolio tracker
19. IPO calendar
20. Dark mode
21. Mobile-responsive layout
22. App PIN lock screen

---

## Folder Structure

```
meroshare-app/
├── backend/
│   ├── main.py               FastAPI entry point
│   ├── database.py           SQLite + SQLModel setup
│   ├── models.py             DB models
│   ├── meroshare_api.py      MeroShare REST client
│   ├── crypto.py             AES encryption for credentials
│   ├── scheduler.py          APScheduler job
│   ├── routes/
│   │   ├── accounts.py
│   │   ├── ipos.py
│   │   ├── apply.py
│   │   ├── reports.py
│   │   ├── portfolio.py
│   │   ├── scheduler.py
│   │   └── notifications.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/              axios/fetch wrappers per endpoint
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Running the App

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev          # opens on http://localhost:5173
```

Backend serves API at `http://localhost:8000/api/...`
Frontend proxies `/api` to backend via Vite config.

---

## Security Notes

- Credentials stored AES-256 encrypted in SQLite. Key = PBKDF2 of app PIN.
- App PIN shown on first launch, required on every open.
- Never expose the backend port outside localhost.
- `.env` file holds encryption salt and SMTP password. Never commit to git.
- `meroshare.db` and `.env` added to `.gitignore` by default.

---

## When Claude Is Building This App

- Always check which phase we are in before writing code.
- Never skip the dry-run toggle when building the apply flow.
- Bulk apply must show a live progress table — not a spinner that blocks.
- All MeroShare API calls go through `meroshare_api.py` only — never scattered across routes.
- Every apply result (success or failure) must be written to the `applications` table.
- Credentials must never appear in API responses — strip before returning.
- When building reports, always build the data endpoint first, then the UI.
- Excel and PDF export are Phase 2 — do not block Phase 1 on them.
