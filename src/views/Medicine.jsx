import React, { useState } from "react";
import { Pill, PhoneCall, Repeat, CircleCheck, Plus } from "lucide-react";
import { COLORS } from "../theme.js";
import { STAGES, uid, todayISO, daysFromNow, fmtDate, addDays, withHistory } from "../data.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, StatCard, TableHead, Modal, Textarea } from "../components/ui.jsx";

const TEMPLATE = "minmax(160px,1.1fr) minmax(220px,1.6fr) 140px 150px 220px 140px";
const ICONS = { "Medicine Prescribed": Pill, "Medicine Follow-up": PhoneCall, "Treatment Ongoing": Repeat, "Treatment Completed": CircleCheck };
export const medicineTone = (s) => (s === "Treatment Completed" ? "green" : s === "Treatment Ongoing" ? "teal" : s === "Medicine Follow-up" ? "yellow" : "sky");

export default function Medicine({ data, setData, onOpenPatient }) {
  const today = todayISO();
  const list = data.medicines || [];
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const EMPTY = { patientId: "", doctor: "", medicines: "", durationDays: 7, nextFollowup: daysFromNow(7) };
  const [form, setForm] = useState(EMPTY);
  const [logFor, setLogFor] = useState(null);
  const [log, setLog] = useState({ note: "", status: "", nextFollowup: "" });

  const add = () => {
    const p = data.patients.find((x) => x.id === form.patientId);
    if (!p || !form.medicines.trim()) return;
    const rec = { id: uid(), patientId: p.id, patientName: p.name, doctor: form.doctor || p.doctor || "", medicines: form.medicines.trim(), prescribedOn: today, durationDays: Number(form.durationDays) || 0, nextFollowup: form.nextFollowup, status: "Medicine Prescribed", log: [] };
    setData((d) => withHistory({ ...d, medicines: [rec, ...(d.medicines || [])] }, p.id, "Medicine", `Prescribed: ${rec.medicines}`));
    setForm(EMPTY);
    setShowAdd(false);
  };
  const update = (m, patch) =>
    setData((d) => {
      const next = { ...d, medicines: d.medicines.map((x) => (x.id === m.id ? { ...x, ...patch } : x)) };
      return patch.status ? withHistory(next, m.patientId, "Medicine", patch.status) : next;
    });
  const openLog = (m) => { setLogFor(m); setLog({ note: "", status: m.status === "Medicine Prescribed" ? "Medicine Follow-up" : m.status, nextFollowup: m.nextFollowup && m.nextFollowup > today ? m.nextFollowup : daysFromNow(7) }); };
  const saveLog = () => {
    const m = logFor;
    setData((d) => withHistory({
      ...d,
      medicines: d.medicines.map((x) => (x.id === m.id ? { ...x, status: log.status, nextFollowup: log.status === "Treatment Completed" ? "" : log.nextFollowup, log: [...(x.log || []), { date: today, note: log.note.trim() }] } : x)),
    }, m.patientId, "Medicine", `Follow-up: ${log.status}${log.note.trim() ? ", " + log.note.trim() : ""}`));
    setLogFor(null);
  };

  const rows = list.filter((m) => filter === "All" || m.status === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Btn kind="primary" icon={Plus} onClick={() => setShowAdd((s) => !s)}>Prescribe medicine</Btn>
      </div>
      {showAdd && (
        <AddPanel title="New prescription">
          <Field label="Patient"><Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Doctor"><Input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} placeholder="Dr. name" /></Field>
          <Field label="Medicines"><Input value={form.medicines} onChange={(e) => setForm({ ...form, medicines: e.target.value })} placeholder="e.g. Tab Paracetamol 650 BD" /></Field>
          <Field label="Duration (days)"><Input type="number" min="0" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} /></Field>
          <Field label="Follow-up on"><Input type="date" value={form.nextFollowup} onChange={(e) => setForm({ ...form, nextFollowup: e.target.value })} /></Field>
          <Btn kind="primary" onClick={add} disabled={!form.patientId || !form.medicines.trim()}>Save</Btn>
        </AddPanel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, calc(50% - 10px)), 1fr))", gap: 20, marginBottom: 24 }}>
        {STAGES.medicine.map((st) => (
          <StatCard key={st} label={st} value={list.filter((m) => m.status === st).length} tone={medicineTone(st)} icon={ICONS[st]} onClick={() => setFilter(filter === st ? "All" : st)} active={filter === st} />
        ))}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{filter === "All" ? "All prescriptions" : filter}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {filter !== "All" && <Btn kind="link" small onClick={() => setFilter("All")}>Show all</Btn>}
            <span style={{ fontSize: 14, color: COLORS.inkSoft }}>{rows.length}</span>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1080 }}>
            <TableHead columns={["Patient / Doctor", "Medicines", "Prescribed", "Next follow-up", "Status", "Action"]} template={TEMPLATE} />
            {rows.map((m, i) => {
              const ends = m.durationDays ? addDays(m.prescribedOn, Number(m.durationDays)) : "";
              const overdue = m.nextFollowup && m.nextFollowup < today && m.status !== "Treatment Completed";
              const last = (m.log || [])[m.log.length - 1];
              return (
                <div key={m.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: TEMPLATE, gap: 12, alignItems: "center", padding: "14px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none", fontSize: 13.5 }}>
                  <div>
                    <div role="button" tabIndex={0} onClick={() => onOpenPatient && onOpenPatient(m.patientId)} onKeyDown={(e) => e.key === "Enter" && onOpenPatient && onOpenPatient(m.patientId)} style={{ color: COLORS.ink, fontWeight: 500, cursor: "pointer" }}>{m.patientName}</div>
                    <div style={{ fontSize: 12.5, color: COLORS.slate }}>{m.doctor || "—"}</div>
                  </div>
                  <div>
                    <div style={{ color: COLORS.ink }}>{m.medicines}</div>
                    {last && <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 2 }}>Last follow-up {fmtDate(last.date)}{last.note ? `: ${last.note}` : ""}</div>}
                  </div>
                  <div style={{ color: COLORS.inkSoft }}>
                    {fmtDate(m.prescribedOn)}
                    {ends && <div style={{ fontSize: 12, color: COLORS.slate }}>{m.durationDays} days, to {fmtDate(ends)}</div>}
                  </div>
                  <div style={{ color: overdue ? COLORS.red : COLORS.inkSoft, fontWeight: overdue ? 600 : 400 }}>
                    {m.status === "Treatment Completed" ? "—" : m.nextFollowup ? fmtDate(m.nextFollowup) : "Not set"}
                    {overdue && <div style={{ fontSize: 11.5 }}>Overdue</div>}
                  </div>
                  <Select value={m.status} onChange={(e) => update(m, { status: e.target.value })} aria-label="Status" style={{ minHeight: 36, padding: "6px 10px" }}>{STAGES.medicine.map((s) => <option key={s}>{s}</option>)}</Select>
                  <div>{m.status !== "Treatment Completed" ? <Btn small icon={PhoneCall} onClick={() => openLog(m)}>Log follow-up</Btn> : <Badge tone="green" dot>Completed</Badge>}</div>
                </div>
              );
            })}
            {rows.length === 0 && <div style={{ padding: "28px 24px", fontSize: 14, color: COLORS.inkSoft }}>{list.length ? "No prescriptions with this status." : "No prescriptions yet."}</div>}
          </div>
        </div>
      </Card>

      <Modal open={!!logFor} onClose={() => setLogFor(null)} title="Medicine follow-up" subtitle={logFor ? `${logFor.patientName}: ${logFor.medicines}` : ""} width={520}>
        <div style={{ display: "grid", gap: 14 }}>
          <Field label="How is the patient doing?"><Textarea value={log.note} onChange={(e) => setLog({ ...log, note: e.target.value })} placeholder="Response to medicine, side effects, changes" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Status"><Select value={log.status} onChange={(e) => setLog({ ...log, status: e.target.value })}>{STAGES.medicine.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            {log.status !== "Treatment Completed" && <Field label="Next follow-up"><Input type="date" value={log.nextFollowup} onChange={(e) => setLog({ ...log, nextFollowup: e.target.value })} /></Field>}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn onClick={() => setLogFor(null)}>Cancel</Btn>
            <Btn kind="primary" onClick={saveLog}>Save follow-up</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
