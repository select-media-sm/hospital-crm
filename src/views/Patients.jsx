import React, { useState } from "react";
import { Users, ArrowLeft, Plus } from "lucide-react";
import { COLORS, FONT_SERIF } from "../theme.js";
import { uid, todayISO, fmtDate, LEAD_SOURCES } from "../data.js";
import { apptTone, surgeryTone } from "../lib/tones.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, SectionTitle } from "../components/ui.jsx";

export default function Patients({ data, setData, initialOpenId }) {
  const [showAdd, setShowAdd] = useState(false);
  const [openId, setOpenId] = useState(initialOpenId || null);
  const EMPTY = { name: "", age: "", gender: "Female", mobile: "", email: "", doctor: "", department: "", referredBy: "Self", source: "Walk-in" };
  const [form, setForm] = useState(EMPTY);
  const [noteText, setNoteText] = useState("");

  const addPatient = () => {
    if (!form.name.trim()) return;
    const patient = { ...form, id: uid(), createdAt: todayISO(), notes: "", history: [{ date: todayISO(), type: "Registration", detail: "Patient registered" }] };
    setData((d) => ({ ...d, patients: [patient, ...d.patients] }));
    setForm(EMPTY);
    setShowAdd(false);
  };
  const addHistoryEntry = (patientId) => {
    if (!noteText.trim()) return;
    setData((d) => ({ ...d, patients: d.patients.map((p) => (p.id === patientId ? { ...p, history: [...p.history, { date: todayISO(), type: "Note", detail: noteText.trim() }] } : p)) }));
    setNoteText("");
  };

  const openPatient = data.patients.find((p) => p.id === openId);
  const patientAppts = openPatient ? data.appointments.filter((a) => a.patientId === openPatient.id).sort((a, b) => (a.date < b.date ? 1 : -1)) : [];
  const patientSurgeries = openPatient ? data.surgeries.filter((s) => s.patientId === openPatient.id) : [];

  return (
    <div>
      <SectionTitle title="Patients" icon={Users} subtitle="Master profile, visit history, and clinical timeline" action={<Btn kind="primary" icon={Plus} onClick={() => setShowAdd((s) => !s)}>Add patient</Btn>} />
      {showAdd && (
        <AddPanel>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></Field>
          <Field label="Age"><Input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" /></Field>
          <Field label="Gender"><Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>{["Female", "Male", "Other"].map((g) => <option key={g}>{g}</option>)}</Select></Field>
          <Field label="Mobile"><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="98xxxxxxxx" /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@email.com" /></Field>
          <Field label="Doctor"><Input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} placeholder="Dr. name" /></Field>
          <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Department" /></Field>
          <Field label="Referred by"><Input value={form.referredBy} onChange={(e) => setForm({ ...form, referredBy: e.target.value })} placeholder="Self or Dr. name" /></Field>
          <Field label="Lead source"><Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Btn kind="primary" onClick={addPatient}>Save patient</Btn>
        </AddPanel>
      )}

      {!openPatient && (
        <Card style={{ padding: 0 }}>
          {data.patients.map((p, i) => (
            <div key={p.id} className="row-hover" onClick={() => setOpenId(p.id)} style={{ cursor: "pointer", display: "grid", gridTemplateColumns: "1.5fr 0.6fr 1fr 1.2fr auto", gap: 10, alignItems: "center", padding: "14px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
              <div><div style={{ fontSize: 13.5, color: COLORS.ink, fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: 12, color: COLORS.slate }}>{p.mobile || "—"}</div></div>
              <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{p.age ? `${p.age}, ${p.gender}` : p.gender}</div>
              <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{p.doctor || "—"}</div>
              <Badge tone="slate">{p.department || "General"}</Badge>
              <span style={{ fontSize: 13, color: COLORS.blue, fontWeight: 600 }}>View profile</span>
            </div>
          ))}
          {data.patients.length === 0 && <div style={{ padding: 22, fontSize: 13, color: COLORS.slate }}>No patients yet.</div>}
        </Card>
      )}

      {openPatient && (
        <div>
          <Btn small icon={ArrowLeft} onClick={() => setOpenId(null)} style={{ marginBottom: 14 }}>Back to patients</Btn>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>
            <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
              <Card>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 19, fontWeight: 600, color: COLORS.ink }}>{openPatient.name}</div>
                <div style={{ fontSize: 12.5, color: COLORS.slate, marginTop: 2, marginBottom: 14 }}>{openPatient.age ? `${openPatient.age} yrs · ` : ""}{openPatient.gender} · Registered {fmtDate(openPatient.createdAt)}</div>
                <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: COLORS.inkSoft }}>Mobile</span><span style={{ color: COLORS.ink }}>{openPatient.mobile || "—"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span style={{ color: COLORS.inkSoft }}>Email</span><span style={{ color: COLORS.ink, wordBreak: "break-all", textAlign: "right" }}>{openPatient.email || "—"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: COLORS.inkSoft }}>Referred by</span><span style={{ color: COLORS.ink }}>{openPatient.referredBy || "Self"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: COLORS.inkSoft }}>Lead source</span><span style={{ color: COLORS.ink }}>{openPatient.source || "—"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: COLORS.inkSoft }}>Doctor</span><span style={{ color: COLORS.ink }}>{openPatient.doctor || "—"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: COLORS.inkSoft }}>Department</span><span style={{ color: COLORS.ink }}>{openPatient.department || "—"}</span></div>
                </div>
                {openPatient.notes && <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.line}`, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6 }}>{openPatient.notes}</div>}
              </Card>
              <Card>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginBottom: 10 }}>Visit history</div>
                {patientAppts.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.slate }}>No visits recorded.</div>}
                {patientAppts.map((a, i) => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
                    <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{fmtDate(a.date)} · {a.doctor}</div>
                    <Badge tone={apptTone(a.status)}>{a.status}</Badge>
                  </div>
                ))}
              </Card>
              {patientSurgeries.length > 0 && (
                <Card>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginBottom: 10 }}>Surgical history</div>
                  {patientSurgeries.map((s, i) => (
                    <div key={s.id} style={{ padding: "7px 0", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{s.type} · {s.surgeon}</div>
                        <Badge tone={surgeryTone(s.stage)}>{s.stage}</Badge>
                      </div>
                      {s.date && <div style={{ fontSize: 11.5, color: COLORS.slate, marginTop: 2 }}>{fmtDate(s.date)}</div>}
                    </div>
                  ))}
                </Card>
              )}
            </div>
            <Card>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>Clinical timeline</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a clinical note or update" />
                <Btn kind="primary" small onClick={() => addHistoryEntry(openPatient.id)}>Add</Btn>
              </div>
              <div>
                {[...openPatient.history].reverse().map((h, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 12, padding: "9px 0", borderTop: `1px solid ${COLORS.line}` }}>
                    <div style={{ width: 78, flexShrink: 0, fontSize: 12, color: COLORS.slate }}>{fmtDate(h.date)}</div>
                    <div style={{ flexShrink: 0 }}><Badge tone="blue">{h.type}</Badge></div>
                    <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{h.detail}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
