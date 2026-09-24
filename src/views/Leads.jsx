import React, { useState } from "react";
import { UserPlus, UserCheck, Clock, UserX, ArrowRight, MessageCircle, FileSpreadsheet, FileText, Upload, X } from "lucide-react";
import { COLORS } from "../theme.js";
import { uid, todayISO, daysFromNow, fmtDate, LEAD_SOURCES, withHistory } from "../data.js";
import { leadTone } from "../lib/tones.js";
import { leadPatientId, opdStatusForPatient } from "../lib/pipeline.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, SectionTitle, StatCard, TableHead, Modal } from "../components/ui.jsx";
import MessageComposer from "../components/MessageComposer.jsx";
import { LEAD_TEMPLATES } from "../lib/messaging.js";
import { logMessage } from "../lib/commLog.js";
import { downloadWorkbook, downloadCSV } from "../lib/excel.js";

const TEMPLATE = "36px minmax(170px,1.4fr) 130px minmax(160px,1.2fr) 190px 150px 170px 52px";
const EMPTY = { name: "", mobile: "", email: "", source: "Walk-in", department: "", doctor: "", stage: "New Lead", nextFollowup: "" };

export default function Leads({ data, setData, onOpenPatient, onNavigate }) {
  const today = todayISO();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState("All");
  const [convertId, setConvertId] = useState(null);
  const [conv, setConv] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [composeFor, setComposeFor] = useState(null); // array of leads

  const count = (st) => data.leads.filter((l) => l.stage === st).length;

  const addLead = () => {
    if (!form.name.trim()) return;
    const lead = { id: uid(), name: form.name.trim(), mobile: form.mobile.trim(), email: form.email.trim(), lastContacted: null, source: form.source, department: form.department, doctor: form.doctor, stage: form.stage, nextFollowup: form.stage === "Follow-up Required" ? form.nextFollowup || daysFromNow(1) : "", patientId: "", createdAt: todayISO() };
    setData((d) => ({ ...d, leads: [lead, ...d.leads] }));
    setForm(EMPTY);
    setShowAdd(false);
  };

  const updateLead = (id, patch) => setData((d) => ({ ...d, leads: d.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  const setStage = (l, stage) => updateLead(l.id, { stage, nextFollowup: stage === "Follow-up Required" ? l.nextFollowup || daysFromNow(1) : l.nextFollowup });

  const startConvert = (l) => {
    setConvertId(l.id);
    setConv({ doctor: l.doctor || "", age: "", gender: "Female", email: l.email || "", bookOpd: true, date: todayISO(), time: "10:00" });
  };

  const doConvert = () => {
    const lead = data.leads.find((l) => l.id === convertId);
    if (!lead) return;
    setData((d) => {
      let next = { ...d };
      let pid = leadPatientId(d, lead);
      if (!pid) {
        pid = uid();
        const patient = { id: pid, name: lead.name, age: conv.age, gender: conv.gender, mobile: lead.mobile, email: conv.email, referredBy: lead.source === "Referral" ? "Referral" : "Self", source: lead.source || "Walk-in", doctor: conv.doctor, department: lead.department || "", createdAt: todayISO(), notes: `Converted from lead (${lead.source})`, history: [{ date: todayISO(), type: "Registration", detail: `Converted from ${lead.source} lead` }] };
        next.patients = [patient, ...d.patients];
      }
      next.leads = d.leads.map((l) => (l.id === lead.id ? { ...l, stage: "Converted", patientId: pid, nextFollowup: "" } : l));
      if (conv.bookOpd) {
        const appt = { id: uid(), patientId: pid, patientName: lead.name, doctor: conv.doctor || "Unassigned", date: conv.date, time: conv.time, type: "New", status: "Booked" };
        next.appointments = [appt, ...d.appointments];
        next = withHistory(next, pid, "OPD", `OPD booked for ${fmtDate(conv.date)} at ${conv.time}`);
      }
      return next;
    });
    setConvertId(null);
  };

  const rows = data.leads.filter((l) => filter === "All" || l.stage === filter);
  const selectedLeads = data.leads.filter((l) => selected.has(l.id));
  const allVisibleSelected = rows.length > 0 && rows.every((l) => selected.has(l.id));
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => { const n = new Set(s); if (allVisibleSelected) rows.forEach((l) => n.delete(l.id)); else rows.forEach((l) => n.add(l.id)); return n; });

  const exportRows = (list) => [
    ["Name", "Mobile", "Email", "Source", "Department", "Doctor", "Status", "Next follow-up", "Added on", "OPD status", "Last contacted"],
    ...list.map((l) => {
      const pid = l.stage === "Converted" ? leadPatientId(data, l) : "";
      return [l.name, l.mobile || "", l.email || "", l.source || "", l.department || "", l.doctor || "", l.stage, l.stage === "Follow-up Required" ? l.nextFollowup || "" : "", l.createdAt || "", pid ? opdStatusForPatient(data, pid) : "", l.lastContacted ? `${l.lastContacted.date} (${l.lastContacted.channel})` : ""];
    }),
  ];
  const exportName = (list) => `leads-${list === selectedLeads ? "selected" : filter === "All" ? "all" : filter.toLowerCase().replace(/[^a-z]+/g, "-")}-${today}`;
  const exportExcel = (list) => downloadWorkbook(exportName(list) + ".xlsx", [{ name: "Leads", rows: exportRows(list) }]);
  const exportCsv = (list) => downloadCSV(exportName(list) + ".csv", exportRows(list));
  const toRecipient = (l) => ({ id: l.id, name: l.name, mobile: l.mobile, email: l.email, doctor: l.doctor, department: l.department });
  const convertLead = data.leads.find((l) => l.id === convertId);

  return (
    <div>
      <SectionTitle
        title="Lead Management"
        subtitle="Track new enquiries, follow up, and convert them into OPD patients"
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {onNavigate && <Btn icon={Upload} onClick={() => onNavigate("import")}>Import</Btn>}
            <Btn icon={FileSpreadsheet} onClick={() => exportExcel(rows)} disabled={!rows.length} title="Download the leads in this list as Excel">Export Excel</Btn>
            <Btn icon={FileText} onClick={() => exportCsv(rows)} disabled={!rows.length} title="Download the leads in this list as CSV">CSV</Btn>
            <Btn kind="primary" icon={UserPlus} onClick={() => setShowAdd((s) => !s)}>Add lead</Btn>
          </div>
        }
      />

      {showAdd && (
        <AddPanel title="New lead">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Patient name" /></Field>
          <Field label="Mobile"><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="98xxxxxxxx" /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Optional" /></Field>
          <Field label="Source"><Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Department" /></Field>
          <Field label="Doctor"><Input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} placeholder="Dr. name" /></Field>
          <Field label="Status">
            <Select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
              <option>New Lead</option>
              <option>Follow-up Required</option>
            </Select>
          </Field>
          {form.stage === "Follow-up Required" && <Field label="Next follow-up"><Input type="date" value={form.nextFollowup} onChange={(e) => setForm({ ...form, nextFollowup: e.target.value })} /></Field>}
          <Btn kind="primary" onClick={addLead} disabled={!form.name.trim()}>Save lead</Btn>
        </AddPanel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, calc(50% - 10px)), 1fr))", gap: 20, marginBottom: 28 }}>
        <StatCard label="New Leads" value={count("New Lead")} tone="sky" icon={UserPlus} onClick={() => setFilter(filter === "New Lead" ? "All" : "New Lead")} active={filter === "New Lead"} />
        <StatCard label="Converted" value={count("Converted")} tone="green" icon={UserCheck} onClick={() => setFilter(filter === "Converted" ? "All" : "Converted")} active={filter === "Converted"} />
        <StatCard label="Pending / Follow-up Required" value={count("Follow-up Required")} tone="yellow" icon={Clock} onClick={() => setFilter(filter === "Follow-up Required" ? "All" : "Follow-up Required")} active={filter === "Follow-up Required"} />
        <StatCard label="Lost" value={count("Lost")} tone="red" icon={UserX} onClick={() => setFilter(filter === "Lost" ? "All" : "Lost")} active={filter === "Lost"} />
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 26px", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{filter === "All" ? "All leads" : filter === "Follow-up Required" ? "Pending / Follow-up Required" : filter}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {filter !== "All" && <Btn kind="link" small onClick={() => setFilter("All")}>Show all</Btn>}
            <span style={{ fontSize: 14, color: COLORS.inkSoft }}>{rows.length} lead{rows.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "12px 22px", background: COLORS.bluePale, borderTop: `1px solid ${COLORS.line}` }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.blueDeep }}>{selected.size} selected</span>
            <Btn small kind="primary" icon={MessageCircle} onClick={() => setComposeFor(selectedLeads)}>Message</Btn>
            <Btn small icon={FileSpreadsheet} onClick={() => exportExcel(selectedLeads)}>Export Excel</Btn>
            <Btn small icon={FileText} onClick={() => exportCsv(selectedLeads)}>CSV</Btn>
            <Btn small kind="link" icon={X} onClick={() => setSelected(new Set())}>Clear</Btn>
          </div>
        )}
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1140 }}>
            <TableHead columns={[<input key="all" type="checkbox" aria-label="Select all leads in this list" checked={allVisibleSelected} onChange={toggleAll} style={{ width: 16, height: 16, accentColor: COLORS.blue, cursor: "pointer" }} />, "Lead", "Source", "Department / Doctor", "Status", "Follow-up / OPD", "Action", ""]} template={TEMPLATE} />
            {rows.map((l, i) => {
              const pid = l.stage === "Converted" ? leadPatientId(data, l) : "";
              const overdue = l.stage === "Follow-up Required" && l.nextFollowup && l.nextFollowup < today;
              return (
                <div key={l.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: TEMPLATE, gap: 12, alignItems: "center", padding: "15px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none", background: selected.has(l.id) ? COLORS.mint : undefined }}>
                  <input type="checkbox" aria-label={`Select ${l.name}`} checked={selected.has(l.id)} onChange={() => toggle(l.id)} style={{ width: 16, height: 16, accentColor: COLORS.blue, cursor: "pointer" }} />
                  <div>
                    <div style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500 }}>{l.name}</div>
                    <div style={{ fontSize: 12.5, color: COLORS.slate }}>{l.mobile || "No mobile"}, added {fmtDate(l.createdAt)}</div>
                    {l.lastContacted && <div style={{ fontSize: 12, color: COLORS.blueDeep, marginTop: 1 }}>Messaged {fmtDate(l.lastContacted.date)} on {l.lastContacted.channel}</div>}
                  </div>
                  <Badge tone="slate">{l.source}</Badge>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{[l.department, l.doctor].filter(Boolean).join(", ") || "—"}</div>
                  {l.stage === "Converted" ? (
                    <Badge tone="green" dot>Converted</Badge>
                  ) : (
                    <Select value={l.stage} onChange={(e) => setStage(l, e.target.value)} aria-label={`Status for ${l.name}`}>
                      <option>New Lead</option>
                      <option>Follow-up Required</option>
                      <option>Lost</option>
                    </Select>
                  )}
                  <div>
                    {l.stage === "Follow-up Required" ? (
                      <div>
                        <Input type="date" value={l.nextFollowup || ""} onChange={(e) => updateLead(l.id, { nextFollowup: e.target.value })} style={{ minHeight: 36, padding: "6px 10px", borderColor: overdue ? COLORS.red : COLORS.line }} aria-label="Next follow-up" />
                        {overdue && <div style={{ fontSize: 11.5, color: COLORS.red, fontWeight: 600, marginTop: 3 }}>Overdue</div>}
                      </div>
                    ) : l.stage === "Converted" && pid ? (
                      <span style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{opdStatusForPatient(data, pid)}</span>
                    ) : (
                      <span style={{ fontSize: 12.5, color: COLORS.slate }}>—</span>
                    )}
                  </div>
                  <div>
                    {l.stage === "Converted" ? (
                      pid ? <Btn kind="link" small onClick={() => onOpenPatient && onOpenPatient(pid)}>View patient</Btn> : <span style={{ fontSize: 12.5, color: COLORS.slate }}>No patient record</span>
                    ) : l.stage === "Lost" ? (
                      <Badge tone={leadTone("Lost")}>Closed</Badge>
                    ) : (
                      <Btn small icon={ArrowRight} onClick={() => startConvert(l)}>Convert to patient</Btn>
                    )}
                  </div>
                  <button className="icon-btn" onClick={() => setComposeFor([l])} title="Send WhatsApp, SMS or email" aria-label={`Message ${l.name}`} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${COLORS.line}`, background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#25A15B" }}>
                    <MessageCircle size={17} />
                  </button>
                </div>
              );
            })}
            {rows.length === 0 && <div style={{ padding: "30px 26px", fontSize: 14, color: COLORS.inkSoft }}>{filter === "All" ? "No leads yet. Add one, or import a batch from Import leads." : "No leads with this status."}</div>}
          </div>
        </div>
      </Card>

      <Modal open={!!convertLead} onClose={() => setConvertId(null)} title={`Convert ${convertLead?.name || ""}`} subtitle="Creates a patient record and, optionally, books the first OPD visit">
        {convertLead && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 14, marginBottom: 18 }}>
              <Field label="Doctor"><Input value={conv.doctor} onChange={(e) => setConv({ ...conv, doctor: e.target.value })} placeholder="Dr. name" /></Field>
              <Field label="Age"><Input value={conv.age} onChange={(e) => setConv({ ...conv, age: e.target.value })} placeholder="Age" /></Field>
              <Field label="Gender"><Select value={conv.gender} onChange={(e) => setConv({ ...conv, gender: e.target.value })}>{["Female", "Male", "Other"].map((g) => <option key={g}>{g}</option>)}</Select></Field>
              <Field label="Email"><Input type="email" value={conv.email} onChange={(e) => setConv({ ...conv, email: e.target.value })} placeholder="name@email.com" /></Field>
            </div>
            <div style={{ background: COLORS.mint, borderRadius: 12, padding: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: COLORS.ink, cursor: "pointer" }}>
                <input type="checkbox" checked={conv.bookOpd} onChange={(e) => setConv({ ...conv, bookOpd: e.target.checked })} style={{ width: 17, height: 17, accentColor: COLORS.blue }} />
                Book OPD appointment now
              </label>
              {conv.bookOpd && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                  <Field label="Date"><Input type="date" value={conv.date} onChange={(e) => setConv({ ...conv, date: e.target.value })} /></Field>
                  <Field label="Time"><Input type="time" value={conv.time} onChange={(e) => setConv({ ...conv, time: e.target.value })} /></Field>
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <Btn onClick={() => setConvertId(null)}>Cancel</Btn>
              <Btn kind="primary" icon={UserCheck} onClick={doConvert}>{conv.bookOpd ? "Convert and book OPD" : "Convert to patient"}</Btn>
            </div>
          </div>
        )}
      </Modal>

      <MessageComposer
        open={!!composeFor}
        onClose={() => setComposeFor(null)}
        title="Message leads"
        recipients={(composeFor || []).map(toRecipient)}
        templates={LEAD_TEMPLATES}
        onOpened={(r, info) => setData(logMessage("lead", r, info))}
      />
    </div>
  );
}
