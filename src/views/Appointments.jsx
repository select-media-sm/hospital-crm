import React, { useState } from "react";
import { CalendarCheck, Plus } from "lucide-react";
import { COLORS } from "../theme.js";
import { STAGES, uid, todayISO, fmtDate } from "../data.js";
import { apptTone } from "../lib/tones.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, SectionTitle } from "../components/ui.jsx";

export default function Appointments({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ patientId: "", doctor: "", date: todayISO(), time: "09:00", type: "New" });

  const addAppt = () => {
    const patient = data.patients.find((p) => p.id === form.patientId);
    if (!patient) return;
    const appt = { id: uid(), patientId: patient.id, patientName: patient.name, doctor: form.doctor || patient.doctor || "Unassigned", date: form.date, time: form.time, type: form.type, status: "Booked" };
    setData((d) => ({ ...d, appointments: [appt, ...d.appointments] }));
    setShowAdd(false);
  };
  const setStatus = (id, status) => setData((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === id ? { ...a, status } : a)) }));
  const sorted = [...data.appointments].sort((a, b) => (a.date + a.time > b.date + b.time ? -1 : 1));

  return (
    <div>
      <SectionTitle title="Appointments" icon={CalendarCheck} subtitle="Booking through consultation status" action={<Btn kind="primary" icon={Plus} onClick={() => setShowAdd((s) => !s)}>Book appointment</Btn>} />
      {showAdd && (
        <AddPanel>
          <Field label="Patient"><Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Doctor"><Input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} placeholder="Dr. name" /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Time"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["New", "Follow-up", "Emergency"].map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Btn kind="primary" onClick={addAppt}>Book</Btn>
        </AddPanel>
      )}
      <Card style={{ padding: 0 }}>
        {sorted.map((a, i) => (
          <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 0.8fr auto", gap: 10, alignItems: "center", padding: "14px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
            <div><div style={{ fontSize: 13.5, color: COLORS.ink, fontWeight: 500 }}>{a.patientName}</div><div style={{ fontSize: 12, color: COLORS.slate }}>{a.doctor}</div></div>
            <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{fmtDate(a.date)} · {a.time}</div>
            <Badge tone="slate">{a.type}</Badge>
            <Badge tone={apptTone(a.status)}>{a.status}</Badge>
            <Select value={a.status} onChange={(e) => setStatus(a.id, e.target.value)} style={{ width: 150 }}>{STAGES.appt.map((s) => <option key={s}>{s}</option>)}</Select>
          </div>
        ))}
        {sorted.length === 0 && <div style={{ padding: 22, fontSize: 13, color: COLORS.slate }}>No appointments yet.</div>}
      </Card>
    </div>
  );
}
