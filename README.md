# Select Care CRM

A premium hospital/clinic CRM covering the patient journey from lead through repeat
visit: Lead → Appointment → OPD → Diagnosis → Treatment → Surgery → Billing → Follow-up.

## Modules

- **Dashboard** — OPD, waiting patients, leads, follow-ups, surgeries, revenue trend,
  revenue split, lead funnel, and OPD→Surgery / Lead→Appointment conversion, all in one view.
- **Leads** — full funnel (New Lead → Contacted → Appointment Booked → OPD Completed →
  Diagnosis → Surgery Advised → Surgery Booked → Surgery Completed → Follow-up), convert
  to patient in one click.
- **Import leads** — upload a `.csv`, `.xlsx`, or `.xls` file, map its columns to CRM
  fields, preview with duplicate-mobile detection, and import in bulk.
- **Patients** — master profile, visit history, surgical history, and a running
  clinical timeline.
- **Appointments** — booking and live OPD queue status.
- **Surgery** — pipeline from Recommended through Discharged.
- **Follow-ups** — due-date tracking with overdue flags.
- **Communication** — WhatsApp/SMS/Email templates with simulated delivery status
  (no real messages are sent — see note below).
- **Billing** — consultation invoices (consultation/follow-up/procedure fee, discount,
  payment mode, paid/partial/unpaid) and surgery invoices (surgeon, assistant,
  anaesthetist, OT, room, implant, procedure, other charges), each with a downloadable,
  hospital-branded PDF invoice.
- **Reports** — revenue reports with date-range presets (today, 15 days, month,
  quarter, year, custom), by doctor and by payment mode, exportable to PDF, Excel, or
  print.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## Data storage

Data is stored in the browser's `localStorage`, seeded with sample patients, leads,
and invoices on first load. It persists across refreshes but is local to one browser —
there is no backend or database, so data does not sync across devices or staff.

## Not included in this build

Real WhatsApp/SMS/email delivery (needs a messaging gateway), OT scheduling, insurance/
TPA claim tracking, referral-doctor CRM, multi-branch management, role-based logins, and
the AI features from the original spec. These need real backend infrastructure — a
database, authentication, a messaging gateway — rather than just UI.

## Tech stack

React 18, Vite, recharts (dashboard/report charts), lucide-react (icons), jsPDF +
jspdf-autotable (PDF invoices and reports), SheetJS/`xlsx` (Excel export and CSV/Excel
import). No UI framework — styling is plain inline styles, so there's nothing extra to
configure.

## Project structure

```
src/
  theme.js              Color palette, fonts
  data.js                Stages, message templates, seed data, formatting helpers
  hooks/useCrmData.js    localStorage-backed data hook
  lib/finance.js         Invoice total/paid/outstanding calculations
  lib/pdf.js             PDF invoice & report generation
  lib/excel.js            Excel export + spreadsheet import parsing
  lib/tones.js            Status to badge color mapping
  components/ui.jsx       Shared Card, Button, Badge, Input, etc.
  views/                  One file per module (Dashboard, Leads, Billing, Reports, ...)
  App.jsx                 Sidebar navigation + routing
```
