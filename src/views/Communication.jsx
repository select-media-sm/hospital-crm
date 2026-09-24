import React, { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { COLORS } from "../theme.js";
import { TEMPLATES, uid, todayISO } from "../data.js";
import { commTone } from "../lib/tones.js";
import { Card, Btn, Badge, Select, Field, AddPanel, SectionTitle } from "../components/ui.jsx";
import { fmtDate } from "../data.js";

export default function Communication({ data, setData }) {
  const [form, setForm] = useState({ patientId: "", channel: "WhatsApp", template: "Appointment reminder" });

  const send = () => {
    const patient = data.patients.find((p) => p.id === form.patientId);
    if (!patient) return;
    const message = TEMPLATES[form.template](patient);
    const comm = { id: uid(), patientId: patient.id, patientName: patient.name, channel: form.channel, template: form.template, message, status: "Sent", sentAt: todayISO() };
    setData((d) => ({
      ...d,
      communications: [comm, ...d.communications],
      patients: d.patients.map((p) => (p.id === patient.id ? { ...p, history: [...p.history, { date: todayISO(), type: "Communication", detail: `${form.channel} sent: ${form.template}` }] } : p)),
    }));
    setTimeout(() => {
      setData((d) => ({ ...d, communications: d.communications.map((c) => (c.id === comm.id ? { ...c, status: "Delivered" } : c)) }));
    }, 1200);
  };

  const sorted = [...data.communications].sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));

  return (
    <div>
      <SectionTitle title="Patient communication" icon={MessageCircle} subtitle="WhatsApp, SMS, and email — reminders, reports, and follow-ups" />
      <AddPanel>
        <Field label="Patient"><Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <Field label="Channel"><Select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>{["WhatsApp", "SMS", "Email"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Template"><Select value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })}>{Object.keys(TEMPLATES).map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Btn kind="primary" icon={Send} onClick={send}>Send</Btn>
      </AddPanel>
      <Card style={{ padding: 0 }}>
        {sorted.map((c, i) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.1fr 0.8fr 2fr 1fr auto", gap: 10, alignItems: "center", padding: "14px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
            <div style={{ fontSize: 13.5, color: COLORS.ink, fontWeight: 500 }}>{c.patientName}</div>
            <Badge tone="blue">{c.channel}</Badge>
            <div style={{ fontSize: 12.5, color: COLORS.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.message}</div>
            <div style={{ fontSize: 12, color: COLORS.slate }}>{fmtDate(c.sentAt)}</div>
            <Badge tone={commTone(c.status)}>{c.status}</Badge>
          </div>
        ))}
        {sorted.length === 0 && <div style={{ padding: 22, fontSize: 13, color: COLORS.slate }}>No messages sent yet.</div>}
      </Card>
    </div>
  );
}
