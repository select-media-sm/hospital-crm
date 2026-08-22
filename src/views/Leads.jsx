import React, { useState } from "react";
import { UserPlus, ArrowRight } from "lucide-react";
import { COLORS } from "../theme.js";
import { STAGES, uid, todayISO, fmtDate } from "../data.js";
import { leadTone } from "../lib/tones.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, SectionTitle } from "../components/ui.jsx";

export default function Leads({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", source: "Walk-in", department: "", doctor: "" });

  const addLead = () => {
    if (!form.name.trim()) return;
    const lead = { id: uid(), name: form.name.trim(), mobile: form.mobile.trim(), source: form.source, department: form.department, doctor: form.doctor, stage: "New Lead", createdAt: todayISO() };
    setData((d) => ({ ...d, leads: [lead, ...d.leads] }));
    setForm({ name: "", mobile: "", source: "Walk-in", department: "", doctor: "" });
    setShowAdd(false);
  };
  const setStage = (id, stage) => setData((d) => ({ ...d, leads: d.leads.map((l) => (l.id === id ? { ...l, stage } : l)) }));
  const convertToPatient = (lead) => {
    const patient = { id: uid(), name: lead.name, age: "", gender: "", mobile: lead.mobile, doctor: lead.doctor || "", department: lead.department || "", createdAt: todayISO(), notes: `Converted from lead (${lead.source})`, history: [{ date: todayISO(), type: "Registration", detail: `Converted from lead, source: ${lead.source}` }] };
    setData((d) => ({ ...d, patients: [patient, ...d.patients], leads: d.leads.map((l) => (l.id === lead.id ? { ...l, stage: "Appointment Booked" } : l)) }));
  };

  return (
    <div>
      <SectionTitle title="Leads" icon={UserPlus} subtitle="New lead through surgery-completed funnel, across sources" action={<Btn kind="primary" icon={UserPlus} onClick={() => setShowAdd((s) => !s)}>Add lead</Btn>} />
      {showAdd && (
        <AddPanel>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Patient name" /></Field>
          <Field label="Mobile"><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="98xxxxxxxx" /></Field>
          <Field label="Source"><Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{["Walk-in", "Google Ads", "Meta Ads", "Website", "Referral", "WhatsApp", "Instagram", "Camp", "Import"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Department" /></Field>
          <Field label="Doctor"><Input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} placeholder="Dr. name" /></Field>
          <Btn kind="primary" onClick={addLead}>Save lead</Btn>
        </AddPanel>
      )}
      <Card style={{ padding: 0 }}>
        {data.leads.map((l, i) => (
          <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr 1fr 1.5fr auto", gap: 10, alignItems: "center", padding: "14px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
            <div><div style={{ fontSize: 13.5, color: COLORS.ink, fontWeight: 500 }}>{l.name}</div><div style={{ fontSize: 12, color: COLORS.slate }}>{l.mobile || "—"} · {fmtDate(l.createdAt)}</div></div>
            <Badge tone="slate">{l.source}</Badge>
            <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{l.department || "—"}{l.doctor ? ` · ${l.doctor}` : ""}</div>
            <Select value={l.stage} onChange={(e) => setStage(l.id, e.target.value)} style={{ width: "100%" }}>{STAGES.lead.map((s) => <option key={s}>{s}</option>)}</Select>
            {!["Surgery Completed", "Follow-up", "Lost"].includes(l.stage) && !data.patients.some((p) => p.mobile === l.mobile && l.mobile) ? (
              <Btn small icon={ArrowRight} onClick={() => convertToPatient(l)}>Convert</Btn>
            ) : (
              <Badge tone={leadTone(l.stage)}>{l.stage === "Lost" ? "Closed" : "In CRM"}</Badge>
            )}
          </div>
        ))}
        {data.leads.length === 0 && <div style={{ padding: 22, fontSize: 13, color: COLORS.slate }}>No leads yet. Add one, or import a batch from the Import Leads tab.</div>}
      </Card>
    </div>
  );
}
