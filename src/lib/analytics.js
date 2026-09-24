import { SURGERY_GROUPS } from "../data.js";
import { unifiedInvoices } from "./finance.js";
import { leadPatientId } from "./pipeline.js";

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const inRange = (d, from, to) => !!d && (!from || d >= from) && (!to || d <= to);

const opdDone = (data, pid) => data.appointments.some((a) => a.patientId === pid && a.status === "Completed");
const counselled = (data, pid) => (data.counselling || []).some((c) => c.patientId === pid);
const surgeryBooked = (data, pid) => data.surgeries.some((s) => s.patientId === pid && (SURGERY_GROUPS.booked.includes(s.stage) || SURGERY_GROUPS.done.includes(s.stage)));
const surgeryDone = (data, pid) => data.surgeries.some((s) => s.patientId === pid && SURGERY_GROUPS.done.includes(s.stage));
// Date a surgery case belongs to: confirmed/actual date, else tentative month, else when it was opened.
export const surgeryKeyDate = (s) => s.date || (s.tentativeMonth ? s.tentativeMonth + "-01" : "") || s.createdAt || "";

// The four stage-to-stage rates. Each stage's denominator is counted in the period by its own date.
export function conversionRates(data, from, to) {
  const leads = data.leads.filter((l) => inRange(l.createdAt, from, to));
  const leadOpd = leads.filter((l) => { const pid = leadPatientId(data, l); return pid && opdDone(data, pid); });

  const opdPatients = [...new Set(data.appointments.filter((a) => a.status === "Completed" && inRange(a.date, from, to)).map((a) => a.patientId))];
  const opdCouns = opdPatients.filter((pid) => counselled(data, pid));

  const counsPatients = [...new Set((data.counselling || []).filter((c) => inRange(c.referredOn, from, to)).map((c) => c.patientId))];
  const counsIpd = counsPatients.filter((pid) => surgeryBooked(data, pid));

  const ipdCases = data.surgeries.filter((s) => (SURGERY_GROUPS.booked.includes(s.stage) || SURGERY_GROUPS.done.includes(s.stage)) && inRange(surgeryKeyDate(s), from, to));
  const ipdDone = ipdCases.filter((s) => SURGERY_GROUPS.done.includes(s.stage));

  return [
    { key: "leadOpd", label: "Lead → OPD", num: leadOpd.length, den: leads.length, pct: pct(leadOpd.length, leads.length), hint: "Leads whose OPD visit is completed" },
    { key: "opdCouns", label: "OPD → Counselling", num: opdCouns.length, den: opdPatients.length, pct: pct(opdCouns.length, opdPatients.length), hint: "OPD patients referred to the counsellor" },
    { key: "counsIpd", label: "Counselling → OPD", num: counsIpd.length, den: counsPatients.length, pct: pct(counsIpd.length, counsPatients.length), hint: "Counselled patients with surgery booked" },
    { key: "ipdSurg", label: "OPD → Surgery", num: ipdDone.length, den: ipdCases.length, pct: pct(ipdDone.length, ipdCases.length), hint: "Booked cases where surgery was done" },
  ];
}

// Where patients drop out, grouped by stage.
export function dropOff(data, from, to) {
  const leadsLost = data.leads.filter((l) => l.stage === "Lost" && inRange(l.createdAt, from, to)).length;
  const appts = data.appointments.filter((a) => inRange(a.date, from, to));
  const surg = data.surgeries.filter((s) => inRange(surgeryKeyDate(s), from, to));
  const rows = [
    { stage: "Lead", reason: "Lead lost", count: leadsLost },
    { stage: "OPD", reason: "OPD cancelled", count: appts.filter((a) => a.status === "Cancelled").length },
    { stage: "OPD", reason: "OPD no-show", count: appts.filter((a) => a.status === "No-show").length },
    ...SURGERY_GROUPS.notConverted.map((st) => ({ stage: "Surgery", reason: st, count: surg.filter((s) => s.stage === st).length })),
    { stage: "Surgery (at risk)", reason: "Poor Patient / Financial Assistance", count: surg.filter((s) => s.stage === "Poor Patient / Financial Assistance").length },
  ];
  const total = rows.filter((r) => r.stage !== "Surgery (at risk)").reduce((a, r) => a + r.count, 0);
  return { rows: rows.map((r) => ({ ...r, share: pct(r.count, total) })), total };
}

// One row per lead source, following each lead through the journey.
export function sourceWise(data, from, to) {
  const by = {};
  data.leads.filter((l) => inRange(l.createdAt, from, to)).forEach((l) => {
    const k = l.source || "Unknown";
    const r = (by[k] = by[k] || { source: k, leads: 0, converted: 0, opd: 0, counselled: 0, booked: 0, done: 0, lost: 0 });
    r.leads++;
    if (l.stage === "Lost") r.lost++;
    const pid = l.stage === "Converted" ? leadPatientId(data, l) : "";
    if (!pid) return;
    r.converted++;
    if (opdDone(data, pid)) r.opd++;
    if (counselled(data, pid)) r.counselled++;
    if (surgeryBooked(data, pid)) r.booked++;
    if (surgeryDone(data, pid)) r.done++;
  });
  return Object.values(by)
    .map((r) => ({ ...r, leadOpdPct: pct(r.opd, r.leads), leadSurgPct: pct(r.booked, r.leads) }))
    .sort((a, b) => b.leads - a.leads);
}

// Doctor-wise (or department/unit-wise) performance from OPD visits in the period.
export function doctorWise(data, from, to, by = "doctor") {
  const patient = (id) => data.patients.find((p) => p.id === id) || {};
  const keyOf = (a) => (by === "doctor" ? a.doctor || "Unassigned" : patient(a.patientId).department || "Unassigned");
  const rows = {};
  const ensure = (k) => (rows[k] = rows[k] || { name: k, opdBooked: 0, opdDone: 0, dropped: 0, patients: new Set(), counselled: 0, booked: 0, done: 0, revenue: 0 });
  data.appointments.filter((a) => inRange(a.date, from, to)).forEach((a) => {
    const r = ensure(keyOf(a));
    r.opdBooked++;
    if (a.status === "Completed") { r.opdDone++; r.patients.add(a.patientId); }
    if (a.status === "Cancelled" || a.status === "No-show") r.dropped++;
  });
  Object.values(rows).forEach((r) => {
    r.patients.forEach((pid) => {
      if (counselled(data, pid)) r.counselled++;
      if (surgeryBooked(data, pid)) r.booked++;
      if (surgeryDone(data, pid)) r.done++;
    });
  });
  unifiedInvoices(data).filter((i) => inRange(i.date, from, to)).forEach((i) => {
    const k = by === "doctor" ? i.doctor || "Unassigned" : patient(i.patientId).department || "Unassigned";
    ensure(k).revenue += i.total;
  });
  return Object.values(rows)
    .map(({ patients, ...r }) => ({ ...r, uniquePatients: patients.size, opdCounsPct: pct(r.counselled, patients.size), surgeryPct: pct(r.booked, patients.size) }))
    .sort((a, b) => b.opdDone - a.opdDone || b.revenue - a.revenue);
}
