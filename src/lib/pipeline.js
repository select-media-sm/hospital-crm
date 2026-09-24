import { STAGES, SURGERY_GROUPS, OPD_ACTIVE } from "../data.js";
import { leadTone, surgeryTone, counsellingTone } from "./tones.js";

const mob = (m) => String(m || "").replace(/\D/g, "").slice(-10);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

// Where a converted lead stands in OPD: completed beats booked beats cancelled/no-show.
export function opdStatusForPatient(data, patientId) {
  const appts = data.appointments.filter((a) => a.patientId === patientId);
  if (appts.some((a) => a.status === "Completed")) return "OPD Completed";
  if (appts.some((a) => OPD_ACTIVE.includes(a.status))) return "OPD Booked";
  if (appts.some((a) => a.status === "Cancelled" || a.status === "No-show")) return "OPD Cancelled / No-show";
  return "OPD Not Booked Yet";
}

export function leadPatientId(data, lead) {
  if (lead.patientId) return lead.patientId;
  const p = data.patients.find((x) => lead.mobile && mob(x.mobile) === mob(lead.mobile));
  return p ? p.id : "";
}

// The four conversion stages, each with its sub-statuses and the records behind every count.
export function buildPipeline(data) {
  const leads = data.leads;

  const leadItems = [
    { label: "New Leads", tone: leadTone("New Lead"), records: leads.filter((l) => l.stage === "New Lead") },
    { label: "Converted", tone: leadTone("Converted"), records: leads.filter((l) => l.stage === "Converted") },
    { label: "Pending / Follow-up Required", tone: leadTone("Follow-up Required"), records: leads.filter((l) => l.stage === "Follow-up Required") },
    { label: "Lost", tone: leadTone("Lost"), records: leads.filter((l) => l.stage === "Lost"), muted: true },
  ].map((it) => ({ ...it, records: it.records.map((l) => ({ id: l.id, name: l.name, sub: `${l.source}${l.doctor ? ", " + l.doctor : ""}`, patientId: l.patientId })) }));

  const converted = leads.filter((l) => l.stage === "Converted").map((l) => ({ lead: l, pid: leadPatientId(data, l) }));
  const opdBuckets = { "OPD Booked": [], "OPD Completed": [], "OPD Cancelled / No-show": [], "OPD Not Booked Yet": [] };
  converted.forEach(({ lead, pid }) => {
    const st = pid ? opdStatusForPatient(data, pid) : "OPD Not Booked Yet";
    opdBuckets[st].push({ id: lead.id, name: lead.name, sub: lead.source, patientId: pid });
  });
  const opdItems = [
    { label: "OPD Booked", tone: "sky", records: opdBuckets["OPD Booked"] },
    { label: "OPD Completed", tone: "green", records: opdBuckets["OPD Completed"] },
    { label: "OPD Cancelled / No-show", tone: "red", records: opdBuckets["OPD Cancelled / No-show"] },
    { label: "Converted, OPD not booked yet", tone: "slate", records: opdBuckets["OPD Not Booked Yet"], muted: true },
  ];

  const couns = data.counselling || [];
  const counsItems = STAGES.counselling.map((st) => ({
    label: st,
    tone: counsellingTone(st),
    records: couns.filter((c) => c.status === st).map((c) => ({ id: c.id, name: c.patientName, sub: c.counsellor || "No counsellor", patientId: c.patientId })),
  }));

  const surg = data.surgeries;
  const surgOrder = STAGES.surgery.filter((s) => !SURGERY_GROUPS.done.includes(s));
  const surgItems = [
    ...surgOrder.map((st) => ({ label: st, tone: surgeryTone(st), records: surg.filter((s) => s.stage === st) })),
    { label: "Surgery Completed / Discharged", tone: "green", records: surg.filter((s) => SURGERY_GROUPS.done.includes(s.stage)), muted: true },
  ].map((it) => ({ ...it, records: it.records.map((s) => ({ id: s.id, name: s.patientName, sub: s.type, patientId: s.patientId })) }));

  const opdCompletedPatients = new Set(data.appointments.filter((a) => a.status === "Completed").map((a) => a.patientId)).size;
  const surgBooked = surg.filter((s) => SURGERY_GROUPS.booked.includes(s.stage) || SURGERY_GROUPS.done.includes(s.stage)).length;

  return [
    { key: "lead", title: "Lead Management", total: leads.length, rateLabel: "Lead → Patient", rate: pct(converted.length, leads.length), items: leadItems },
    { key: "opd", title: "Lead → OPD Conversion", total: converted.length, rateLabel: "OPD completed", rate: pct(opdBuckets["OPD Completed"].length, converted.length), items: opdItems },
    { key: "couns", title: "OPD → Counsellor", total: couns.length, rateLabel: "Referred after OPD", rate: pct(new Set(couns.map((c) => c.patientId)).size, opdCompletedPatients), items: counsItems },
    { key: "surg", title: "OPD / Surgery Conversion", total: surg.length, rateLabel: "Surgery booked", rate: pct(surgBooked, surg.length), items: surgItems },
  ];
}
