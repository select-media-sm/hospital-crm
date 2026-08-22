import React, { useState } from "react";
import { BellRing, Plus } from "lucide-react";
import { COLORS } from "../theme.js";
import { uid, todayISO, daysFromNow, fmtDate } from "../data.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, SectionTitle } from "../components/ui.jsx";

export default function Followups({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ patientId: "", note: "", dueDate: daysFromNow(7) });
  const today = todayISO();

  const addFollowup = () => {
    const patient = data.patients.find((p) => p.id === form.patientId);
    if (!patient || !form.note.trim()) return;
    const f = { id: uid(), patientId: patient.id, patientName: patient.name, note: form.note.trim(), dueDate: form.dueDate, done: false };
    setData((d) => ({ ...d, followups: [f, ...d.followups] }));
    setForm({ patientId: "", note: "", dueDate: daysFromNow(7) });
    setShowAdd(false);
  };
  const toggleDone = (id) => setData((d) => ({ ...d, followups: d.followups.map((f) => (f.id === id ? { ...f, done: !f.done } : f)) }));
  const pending = data.followups.filter((f) => !f.done).sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
  const done = data.followups.filter((f) => f.done);

  return (
    <div>
      <SectionTitle title="Follow-ups" icon={BellRing} subtitle="Recovery and repeat-visit tracking" action={<Btn kind="primary" icon={Plus} onClick={() => setShowAdd((s) => !s)}>Add follow-up</Btn>} />
      {showAdd && (
        <AddPanel>
          <Field label="Patient"><Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Note"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Wound check" /></Field>
          <Field label="Due date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <Btn kind="primary" onClick={addFollowup}>Save</Btn>
        </AddPanel>
      )}
      <Card style={{ padding: 0, marginBottom: 18 }}>
        {pending.map((f, i) => (
          <div key={f.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 1fr auto", gap: 10, alignItems: "center", padding: "14px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
            <div style={{ fontSize: 13.5, color: COLORS.ink, fontWeight: 500 }}>{f.patientName}</div>
            <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{f.note}</div>
            <Badge tone={f.dueDate < today ? "red" : f.dueDate === today ? "yellow" : "slate"}>{f.dueDate < today ? "Overdue · " : ""}{fmtDate(f.dueDate)}</Badge>
            <Btn small onClick={() => toggleDone(f.id)}>Mark done</Btn>
          </div>
        ))}
        {pending.length === 0 && <div style={{ padding: 22, fontSize: 13, color: COLORS.slate }}>No pending follow-ups.</div>}
      </Card>
      {done.length > 0 && (
        <div>
          <div style={{ fontSize: 12.5, color: COLORS.slate, marginBottom: 8 }}>Completed</div>
          <Card style={{ padding: 0 }}>
            {done.map((f, i) => (
              <div key={f.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 1fr auto", gap: 10, alignItems: "center", padding: "11px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none", opacity: 0.6 }}>
                <div style={{ fontSize: 13, color: COLORS.ink }}>{f.patientName}</div>
                <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{f.note}</div>
                <div style={{ fontSize: 12, color: COLORS.slate }}>{fmtDate(f.dueDate)}</div>
                <Btn small onClick={() => toggleDone(f.id)}>Reopen</Btn>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
