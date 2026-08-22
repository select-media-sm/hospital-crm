import React, { useState } from "react";
import { Scissors, Plus } from "lucide-react";
import { COLORS } from "../theme.js";
import { STAGES, uid } from "../data.js";
import { surgeryTone } from "../lib/tones.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, SectionTitle } from "../components/ui.jsx";

export default function Surgery({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ patientId: "", surgeon: "", type: "" });

  const addSurgery = () => {
    const patient = data.patients.find((p) => p.id === form.patientId);
    if (!patient || !form.type.trim()) return;
    const surgery = { id: uid(), patientId: patient.id, patientName: patient.name, surgeon: form.surgeon || patient.doctor || "Unassigned", type: form.type.trim(), stage: "Recommended", date: "" };
    setData((d) => ({ ...d, surgeries: [surgery, ...d.surgeries] }));
    setForm({ patientId: "", surgeon: "", type: "" });
    setShowAdd(false);
  };
  const setStage = (id, stage) => setData((d) => ({ ...d, surgeries: d.surgeries.map((s) => (s.id === id ? { ...s, stage } : s)) }));
  const setDate = (id, date) => setData((d) => ({ ...d, surgeries: d.surgeries.map((s) => (s.id === id ? { ...s, date } : s)) }));

  return (
    <div>
      <SectionTitle title="Surgery pipeline" icon={Scissors} subtitle="Recommended through discharge" action={<Btn kind="primary" icon={Plus} onClick={() => setShowAdd((s) => !s)}>Add surgery</Btn>} />
      {showAdd && (
        <AddPanel>
          <Field label="Patient"><Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Surgeon"><Input value={form.surgeon} onChange={(e) => setForm({ ...form, surgeon: e.target.value })} placeholder="Dr. name" /></Field>
          <Field label="Surgery type"><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Total Knee Replacement" /></Field>
          <Btn kind="primary" onClick={addSurgery}>Save</Btn>
        </AddPanel>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        {data.surgeries.map((s) => (
          <Card key={s.id}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr auto", gap: 10, alignItems: "center" }}>
              <div><div style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500 }}>{s.patientName}</div><div style={{ fontSize: 12, color: COLORS.slate }}>{s.type} · {s.surgeon}</div></div>
              <Badge tone={surgeryTone(s.stage)}>{s.stage}</Badge>
              <Input type="date" value={s.date} onChange={(e) => setDate(s.id, e.target.value)} />
              <Select value={s.stage} onChange={(e) => setStage(s.id, e.target.value)} style={{ width: 160 }}>{STAGES.surgery.map((st) => <option key={st}>{st}</option>)}</Select>
            </div>
          </Card>
        ))}
        {data.surgeries.length === 0 && <Card><div style={{ fontSize: 13, color: COLORS.slate }}>No surgeries in the pipeline.</div></Card>}
      </div>
    </div>
  );
}
