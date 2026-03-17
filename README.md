# FinTrack — Expense Tracker

A sleek personal/small-business expense tracking app built with **Angular 19.2** featuring a dark luxury UI.

## Features
- **Dashboard** — Balance overview, savings rate, spending donut chart, monthly bar chart, recent transactions
- **Transactions** — Add, edit, delete; filter by type/category/search; sort by date/amount/title
- **Reports** — Monthly & weekly charts, category breakdown, net savings trend, KPI cards
- **Export** — CSV and PDF export with formatted reports

## Tech Stack
- Angular 19.2 (standalone components, signals)
- Chart.js 4.x
- jsPDF + jspdf-autotable
- SCSS with CSS custom properties (dark theme)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4200)
npm start

# Production build
npm run build
```

## Project Structure
```
src/app/
├── models/          # Transaction model + category constants
├── data/            # Hardcoded seed transactions (42 entries, Jan–Mar 2025)
├── services/        # TransactionService (signals), ExportService
└── components/
    ├── dashboard/          # Overview page
    ├── transactions/       # CRUD table
    ├── reports/            # Charts & analytics
    └── transaction-form/   # Add/Edit modal
```
