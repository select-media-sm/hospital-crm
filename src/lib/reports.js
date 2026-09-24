import { SURGERY_GROUPS, OPD_ACTIVE, STAGES, fmtDate, fmtINR, podLabel, monthBounds, todayISO } from "../data.js";
import { unifiedInvoices } from "./finance.js";
import { conversionRates, dropOff, sourceWise, doctorWise, inRange, surgeryKeyDate, pct } from "./analytics.js";

export const REPORTS = [
  { key: "daily", title: "Daily CRM Report", mode: "day", blurb: "Everything that happened on one day, and what is due" },
  { key: "opd", title: "OPD Report", mode: "range", blurb: "Appointments by status, doctor and visit type" },
  { key: "counselling", title: "Counselling Report", mode: "range", blurb: "Referrals, outcomes and counsellor performance" },
  { key: "ipd", title: "OPD & Surgery Booking Report", mode: "range", blurb: "Surgery cases opened in the period, bookings and losses" },
  { key: "postop", title: "Post-op Follow-up Report", mode: "range", blurb: "Post-op visits, labs, imaging and reviews" },
  { key: "medphysio", title: "Medicine & Physio Tracking", mode: "range", blurb: "Medicine courses and physiotherapy progress" },
  { key: "revenue", title: "Revenue Report", mode: "range", blurb: "Billing, collection and outstanding" },
  { key: "monthly", title: "Monthly Management Dashboard", mode: "month", blurb: "Month vs previous month, for management" },
];

const count = (arr, fn) => arr.filter(fn).length;
const groupCount = (arr, keyFn) => arr.reduce((m, x) => { const k = keyFn(x) || "Unassigned"; m[k] = (m[k] || 0) + 1; return m; }, {});
const surgDateLabel = (s) => s.date ? fmtDate(s.date) : s.tentativeMonth ? new Date(s.tentativeMonth + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" }) + " (tentative)" : "—";
const postopStatus = (e, today) => (e.status === "Scheduled" && e.dueDate < today ? "Overdue" : e.status);

function daily(data, day) {
  const today = todayISO();
  const appts = data.appointments.filter((a) => a.date === day).sort((a, b) => (a.time > b.time ? 1 : -1));
  const leads = data.leads.filter((l) => l.createdAt === day);
  const couns = (data.counselling || []).filter((c) => c.referredOn === day);
  const surg = data.surgeries.filter((s) => s.date === day);
  const invoices = unifiedInvoices(data).filter((i) => i.date === day);
  const due = [
    ...data.followups.filter((f) => !f.done && f.dueDate <= day).map((f) => ["Call follow-up", f.patientName, f.note, fmtDate(f.dueDate), f.executive || "—"]),
    ...(data.postop || []).filter((e) => e.status === "Scheduled" && e.dueDate <= day).map((e) => ["Post-op: " + e.type, e.patientName, e.note || "", fmtDate(e.dueDate), "—"]),
    ...(data.medicines || []).filter((m) => m.status !== "Treatment Completed" && m.nextFollowup && m.nextFollowup <= day).map((m) => ["Medicine follow-up", m.patientName, m.medicines, fmtDate(m.nextFollowup), m.doctor || "—"]),
    ...data.leads.filter((l) => l.stage === "Follow-up Required" && l.nextFollowup && l.nextFollowup <= day).map((l) => ["Lead follow-up", l.name, l.source, fmtDate(l.nextFollowup), "—"]),
  ];
  return {
    summary: [
      { label: "New leads", value: leads.length },
      { label: "New patients registered", value: count(data.patients, (p) => p.createdAt === day) },
      { label: "OPD appointments", value: appts.length },
      { label: "OPD completed", value: count(appts, (a) => a.status === "Completed") },
      { label: "OPD cancelled / no-show", value: count(appts, (a) => a.status === "Cancelled" || a.status === "No-show") },
      { label: "Counselling referrals", value: couns.length },
      { label: "Surgeries on this day", value: surg.length },
      { label: "Calls logged", value: count(data.followups, (f) => f.lastFollowup === day) },
      { label: "Follow-ups due or overdue", value: due.length },
      { label: "Collection", value: fmtINR(invoices.reduce((a, i) => a + i.paid, 0)) },
    ],
    tables: [
      { title: "OPD appointments", columns: ["Time", "Patient", "Doctor", "Type", "Status"], rows: appts.map((a) => [a.time, a.patientName, a.doctor, a.type, a.status]) },
      { title: "New leads", columns: ["Name", "Mobile", "Source", "Status"], rows: leads.map((l) => [l.name, l.mobile || "—", l.source, l.stage]) },
      { title: "Counselling referrals", columns: ["Patient", "Doctor", "Counsellor", "Status"], rows: couns.map((c) => [c.patientName, c.doctor || "—", c.counsellor || "—", c.status]) },
      { title: "Surgeries", columns: ["Patient", "Surgery", "Surgeon", "Status"], rows: surg.map((s) => [s.patientName, s.type, s.surgeon, s.stage]) },
      { title: "Follow-ups due or overdue", columns: ["Type", "Patient", "Detail", "Due", "Owner"], rows: due },
      { title: "Invoices", columns: ["Invoice", "Patient", "Category", "Billed", "Collected"], rows: invoices.map((i) => [i.invoiceNo, i.patientName, i.category, fmtINR(i.total), fmtINR(i.paid)]) },
    ],
    periodLabel: fmtDate(day) + (day === today ? " (today)" : ""),
  };
}

function opd(data, from, to) {
  const appts = data.appointments.filter((a) => inRange(a.date, from, to)).sort((a, b) => (a.date + a.time > b.date + b.time ? -1 : 1));
  const done = count(appts, (a) => a.status === "Completed");
  const byDoc = {};
  appts.forEach((a) => {
    const r = (byDoc[a.doctor || "Unassigned"] = byDoc[a.doctor || "Unassigned"] || [0, 0, 0, 0, 0]);
    r[0]++; if (a.status === "Completed") r[1]++; if (OPD_ACTIVE.includes(a.status)) r[2]++; if (a.status === "No-show") r[3]++; if (a.status === "Cancelled") r[4]++;
  });
  const byType = groupCount(appts, (a) => a.type);
  return {
    summary: [
      { label: "Total appointments", value: appts.length },
      { label: "OPD completed", value: done },
      { label: "OPD booked (upcoming / in clinic)", value: count(appts, (a) => OPD_ACTIVE.includes(a.status)) },
      { label: "No-show", value: count(appts, (a) => a.status === "No-show") },
      { label: "Cancelled", value: count(appts, (a) => a.status === "Cancelled") },
      { label: "Completion rate", value: pct(done, appts.length) + "%" },
    ],
    charts: [{ title: "Appointments by status", data: STAGES.appt.map((s) => ({ name: s, value: count(appts, (a) => a.status === s) })).filter((x) => x.value) }],
    tables: [
      { title: "By doctor", columns: ["Doctor", "Total", "Completed", "Booked / active", "No-show", "Cancelled", "Completion %"], rows: Object.entries(byDoc).map(([k, r]) => [k, ...r, pct(r[1], r[0]) + "%"]) },
      { title: "By visit type", columns: ["Type", "Appointments"], rows: Object.entries(byType) },
      { title: "Appointments", columns: ["Date", "Time", "Patient", "Doctor", "Type", "Status"], rows: appts.map((a) => [fmtDate(a.date), a.time, a.patientName, a.doctor, a.type, a.status]) },
    ],
  };
}

function counselling(data, from, to) {
  const recs = (data.counselling || []).filter((c) => inRange(c.referredOn, from, to)).sort((a, b) => (a.referredOn < b.referredOn ? 1 : -1));
  const surgOf = (pid) => data.surgeries.find((s) => s.patientId === pid);
  const booked = (pid) => { const s = surgOf(pid); return s && (SURGERY_GROUPS.booked.includes(s.stage) || SURGERY_GROUPS.done.includes(s.stage)); };
  const byC = {};
  recs.forEach((c) => {
    const r = (byC[c.counsellor || "Unassigned"] = byC[c.counsellor || "Unassigned"] || [0, 0, 0, 0, 0]);
    r[0]++;
    const i = STAGES.counselling.indexOf(c.status);
    if (i === 1) r[1]++; if (i === 2) r[2]++; if (i === 3) r[3]++;
    if (booked(c.patientId)) r[4]++;
  });
  return {
    summary: [
      { label: "Total referrals", value: recs.length },
      ...STAGES.counselling.map((st) => ({ label: st, value: count(recs, (c) => c.status === st) })),
      { label: "Went on to book surgery", value: count(recs, (c) => booked(c.patientId)) },
    ],
    charts: [{ title: "Referrals by outcome", data: STAGES.counselling.map((s) => ({ name: s, value: count(recs, (c) => c.status === s) })).filter((x) => x.value) }],
    tables: [
      { title: "By counsellor", columns: ["Counsellor", "Referred", "Counselling completed", "Surgery advised", "Further investigation", "Surgery booked", "Booking %"], rows: Object.entries(byC).map(([k, r]) => [k, ...r, pct(r[4], r[0]) + "%"]) },
      { title: "Referrals", columns: ["Referred on", "Patient", "Doctor", "Counsellor", "Status", "Surgery status", "Notes"], rows: recs.map((c) => [fmtDate(c.referredOn), c.patientName, c.doctor || "—", c.counsellor || "—", c.status, surgOf(c.patientId)?.stage || "—", c.notes || ""]) },
    ],
  };
}

function ipd(data, from, to) {
  // Cases opened (booked or advised) in the period; older data without an opened date falls back to the surgery date.
  const surg = data.surgeries.filter((s) => inRange(s.createdAt || surgeryKeyDate(s), from, to)).sort((a, b) => (surgeryKeyDate(a) > surgeryKeyDate(b) ? 1 : -1));
  const today = todayISO();
  const upcoming = data.surgeries.filter((s) => s.stage === "Booked – Confirmed Surgery Date" && s.date && s.date >= today).sort((a, b) => (a.date > b.date ? 1 : -1));
  const g = (k) => count(surg, (s) => SURGERY_GROUPS[k].includes(s.stage));
  return {
    summary: [
      { label: "Surgery cases", value: surg.length },
      { label: "Booked – confirmed date", value: count(surg, (s) => s.stage === "Booked – Confirmed Surgery Date") },
      { label: "Tentative month", value: count(surg, (s) => s.stage === "Tentative Month Booking") },
      { label: "Pending (follow-up / financial)", value: g("pending") },
      { label: "Not converted", value: g("notConverted") },
      { label: "Surgery completed / discharged", value: g("done") },
      { label: "Booking rate", value: pct(g("booked") + g("done"), surg.length) + "%" },
    ],
    charts: [{ title: "Cases by status", data: STAGES.surgery.map((s) => ({ name: s, value: count(surg, (x) => x.stage === s) })).filter((x) => x.value) }],
    tables: [
      { title: "By conversion status", columns: ["Status", "Cases", "Share"], rows: STAGES.surgery.map((st) => [st, count(surg, (s) => s.stage === st), pct(count(surg, (s) => s.stage === st), surg.length) + "%"]).filter((r) => r[1]) },
      { title: "Upcoming confirmed surgeries (all dates ahead)", columns: ["Date", "Patient", "Surgery", "Surgeon"], rows: upcoming.map((s) => [fmtDate(s.date), s.patientName, s.type, s.surgeon]) },
      { title: "Surgery cases", columns: ["Patient", "Surgery", "Surgeon", "Status", "Date / month", "Notes or reason"], rows: surg.map((s) => [s.patientName, s.type, s.surgeon, s.stage, surgDateLabel(s), s.notes || ""]) },
    ],
  };
}

function postop(data, from, to) {
  const today = todayISO();
  const ev = (data.postop || []).filter((e) => inRange(e.dueDate, from, to)).sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
  const surgOf = (id) => data.surgeries.find((s) => s.id === id) || {};
  return {
    summary: [
      { label: "Visits / tests due", value: ev.length },
      { label: "Done", value: count(ev, (e) => e.status === "Done") },
      { label: "Scheduled (upcoming)", value: count(ev, (e) => e.status === "Scheduled" && e.dueDate >= today) },
      { label: "Overdue", value: count(ev, (e) => e.status === "Scheduled" && e.dueDate < today) },
      { label: "Missed", value: count(ev, (e) => e.status === "Missed") },
      { label: "Patients", value: new Set(ev.map((e) => e.patientId)).size },
      { label: "Compliance", value: pct(count(ev, (e) => e.status === "Done"), count(ev, (e) => e.status !== "Scheduled" || e.dueDate < today)) + "%" },
    ],
    tables: [
      { title: "By type", columns: ["Type", "Due", "Done", "Overdue", "Missed"], rows: STAGES.postop.map((t) => { const x = ev.filter((e) => e.type === t); return [t, x.length, count(x, (e) => e.status === "Done"), count(x, (e) => e.status === "Scheduled" && e.dueDate < today), count(x, (e) => e.status === "Missed")]; }) },
      { title: "Post-op schedule", columns: ["Due date", "Patient", "Surgery", "Post-op day", "Type", "Status", "Result"], rows: ev.map((e) => { const s = surgOf(e.surgeryId); return [fmtDate(e.dueDate), e.patientName, s.type || "—", s.date ? podLabel(s.date, e.dueDate) : "—", e.type, postopStatus(e, today), e.result || ""]; }) },
    ],
  };
}

function medphysio(data, from, to) {
  const today = todayISO();
  const meds = (data.medicines || []).filter((m) => inRange(m.prescribedOn, from, to) || m.status !== "Treatment Completed");
  const phys = (data.physio || []).filter((p) => inRange(p.advisedOn, from, to) || p.status !== "Sessions Completed");
  return {
    note: "Includes records started in the period plus everything still active.",
    summary: [
      ...STAGES.medicine.map((st) => ({ label: st, value: count(meds, (m) => m.status === st) })),
      { label: "Medicine follow-ups overdue", value: count(meds, (m) => m.status !== "Treatment Completed" && m.nextFollowup && m.nextFollowup < today) },
      ...STAGES.physio.map((st) => ({ label: st, value: count(phys, (p) => p.status === st) })),
      { label: "Physio sessions done", value: phys.reduce((a, p) => a + (p.sessionsDone || 0), 0) + " of " + phys.reduce((a, p) => a + (p.plannedSessions || 0), 0) },
    ],
    tables: [
      { title: "Medicine treatment", columns: ["Patient", "Doctor", "Medicines", "Prescribed", "Days", "Next follow-up", "Status"], rows: meds.map((m) => [m.patientName, m.doctor || "—", m.medicines, fmtDate(m.prescribedOn), m.durationDays || "—", m.status === "Treatment Completed" ? "—" : fmtDate(m.nextFollowup), m.status]) },
      { title: "Physiotherapy", columns: ["Patient", "Advised by", "Therapist", "Advised on", "Sessions", "Status", "Latest progress"], rows: phys.map((p) => [p.patientName, p.advisedBy || "—", p.therapist || "—", fmtDate(p.advisedOn), `${p.sessionsDone} / ${p.plannedSessions}`, p.status, (p.log || []).slice(-1)[0]?.note || ""]) },
    ],
  };
}

function revenue(data, from, to) {
  const inv = unifiedInvoices(data).filter((i) => inRange(i.date, from, to)).sort((a, b) => (a.date < b.date ? 1 : -1));
  const sum = (arr, k) => arr.reduce((a, i) => a + i[k], 0);
  const grp = (keyFn) => {
    const m = {};
    inv.forEach((i) => { const k = keyFn(i) || "Unassigned"; (m[k] = m[k] || []).push(i); });
    return Object.entries(m).map(([k, arr]) => [k, arr.length, sum(arr, "total"), sum(arr, "paid"), sum(arr, "outstanding")]).sort((a, b) => b[2] - a[2]);
  };
  const byDoc = grp((i) => i.doctor);
  const byMode = grp((i) => i.mode);
  const money = (rows) => rows.map((r) => [r[0], r[1], fmtINR(r[2]), fmtINR(r[3]), fmtINR(r[4])]);
  return {
    summary: [
      { label: "Total billed", value: fmtINR(sum(inv, "total")) },
      { label: "Collected", value: fmtINR(sum(inv, "paid")) },
      { label: "Outstanding", value: fmtINR(sum(inv, "outstanding")) },
      { label: "Invoices", value: inv.length },
      { label: "Consultation revenue", value: fmtINR(sum(inv.filter((i) => i.category === "Consultation"), "total")) },
      { label: "Surgery revenue", value: fmtINR(sum(inv.filter((i) => i.category === "Surgery"), "total")) },
    ],
    charts: [
      { title: "Billed by doctor", money: true, data: byDoc.map((r) => ({ name: r[0], value: r[2] })) },
      { title: "Billed by payment mode", money: true, data: byMode.map((r) => ({ name: r[0], value: r[2] })) },
    ],
    tables: [
      { title: "By doctor", columns: ["Doctor", "Invoices", "Billed", "Collected", "Outstanding"], rows: money(byDoc) },
      { title: "By payment mode", columns: ["Mode", "Invoices", "Billed", "Collected", "Outstanding"], rows: money(byMode) },
      { title: "Invoices", columns: ["Invoice", "Date", "Patient", "Category", "Doctor", "Mode", "Billed", "Collected", "Status"], rows: inv.map((i) => [i.invoiceNo, fmtDate(i.date), i.patientName, i.category, i.doctor || "—", i.mode, fmtINR(i.total), fmtINR(i.paid), i.status]) },
    ],
  };
}

function monthMetrics(data, from, to) {
  const inv = unifiedInvoices(data).filter((i) => inRange(i.date, from, to));
  return {
    "Leads received": count(data.leads, (l) => inRange(l.createdAt, from, to)),
    "New patients registered": count(data.patients, (p) => inRange(p.createdAt, from, to)),
    "OPD completed": count(data.appointments, (a) => a.status === "Completed" && inRange(a.date, from, to)),
    "OPD cancelled / no-show": count(data.appointments, (a) => (a.status === "Cancelled" || a.status === "No-show") && inRange(a.date, from, to)),
    "Counselling referrals": count(data.counselling || [], (c) => inRange(c.referredOn, from, to)),
    "Surgeries booked": count(data.surgeries, (s) => SURGERY_GROUPS.booked.includes(s.stage) && inRange(surgeryKeyDate(s), from, to)),
    "Surgeries done": count(data.surgeries, (s) => SURGERY_GROUPS.done.includes(s.stage) && inRange(s.date, from, to)),
    "Surgery cases lost": count(data.surgeries, (s) => SURGERY_GROUPS.notConverted.includes(s.stage) && inRange(surgeryKeyDate(s), from, to)),
    "Post-op visits / tests done": count(data.postop || [], (e) => e.status === "Done" && inRange(e.dueDate, from, to)),
    "Medicine courses started": count(data.medicines || [], (m) => inRange(m.prescribedOn, from, to)),
    "Physio plans started": count(data.physio || [], (p) => inRange(p.advisedOn, from, to)),
    "Revenue billed": inv.reduce((a, i) => a + i.total, 0),
    "Collected": inv.reduce((a, i) => a + i.paid, 0),
    "Outstanding": inv.reduce((a, i) => a + i.outstanding, 0),
  };
}
const MONEY = ["Revenue billed", "Collected", "Outstanding"];

function monthly(data, ym) {
  const [from, to] = monthBounds(ym);
  const [y, m] = ym.split("-").map(Number);
  const prevYm = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const [pf, pt] = monthBounds(prevYm);
  const cur = monthMetrics(data, from, to);
  const prev = monthMetrics(data, pf, pt);
  const rc = conversionRates(data, from, to);
  const rp = conversionRates(data, pf, pt);
  const change = (a, b) => (b === 0 ? (a === 0 ? "—" : "New") : `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}%`);
  const fmt = (k, v) => (MONEY.includes(k) ? fmtINR(v) : v);
  const monthName = (x) => new Date(x + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const drops = dropOff(data, from, to).rows.filter((r) => r.count);
  return {
    periodLabel: `${monthName(ym)}, compared with ${monthName(prevYm)}`,
    summary: [
      { label: "Leads received", value: cur["Leads received"], delta: change(cur["Leads received"], prev["Leads received"]) },
      { label: "OPD completed", value: cur["OPD completed"], delta: change(cur["OPD completed"], prev["OPD completed"]) },
      { label: "Surgeries booked", value: cur["Surgeries booked"], delta: change(cur["Surgeries booked"], prev["Surgeries booked"]) },
      { label: "Surgeries done", value: cur["Surgeries done"], delta: change(cur["Surgeries done"], prev["Surgeries done"]) },
      { label: "Revenue billed", value: fmtINR(cur["Revenue billed"]), delta: change(cur["Revenue billed"], prev["Revenue billed"]) },
      { label: "Collected", value: fmtINR(cur["Collected"]), delta: change(cur["Collected"], prev["Collected"]) },
    ],
    charts: [{ title: "Conversion rates this month", percent: true, data: rc.map((r) => ({ name: r.label, value: r.pct })) }],
    tables: [
      { title: "Month at a glance", columns: ["Metric", monthName(ym), monthName(prevYm), "Change"], rows: Object.keys(cur).map((k) => [k, fmt(k, cur[k]), fmt(k, prev[k]), change(cur[k], prev[k])]) },
      { title: "Conversion rates", columns: ["Stage", monthName(ym), monthName(prevYm)], rows: rc.map((r, i) => [r.label, r.den ? `${r.pct}% (${r.num}/${r.den})` : "—", rp[i].den ? `${rp[i].pct}% (${rp[i].num}/${rp[i].den})` : "—"]) },
      { title: "Source-wise conversion", columns: ["Source", "Leads", "OPD", "Counselled", "Surgery booked", "Lead→OPD %", "Lead→Surgery %"], rows: sourceWise(data, from, to).map((r) => [r.source, r.leads, r.opd, r.counselled, r.booked, r.leadOpdPct + "%", r.leadSurgPct + "%"]) },
      { title: "Doctor-wise performance", columns: ["Doctor", "OPD done", "Cancel / no-show", "Counselled", "Surgery booked", "Surgery done", "Revenue"], rows: doctorWise(data, from, to, "doctor").map((r) => [r.name, r.opdDone, r.dropped, r.counselled, r.booked, r.done, fmtINR(r.revenue)]) },
      { title: "Drop-offs", columns: ["Stage", "Reason", "Count"], rows: drops.map((r) => [r.stage, r.reason, r.count]) },
    ],
  };
}

export function buildReport(key, data, { from, to, day, month }) {
  const meta = REPORTS.find((r) => r.key === key);
  let body;
  if (key === "daily") body = daily(data, day);
  else if (key === "monthly") body = monthly(data, month);
  else body = { opd, counselling, ipd, postop, medphysio, revenue }[key](data, from, to);
  return { title: meta.title, periodLabel: body.periodLabel || `${fmtDate(from)} to ${fmtDate(to)}`, charts: [], ...body };
}
