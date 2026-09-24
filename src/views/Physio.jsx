import React, { useState } from "react";
import { PersonStanding, Dumbbell, CircleCheck, TrendingUp, Plus, Minus, MessageSquare } from "lucide-react";
import { COLORS } from "../theme.js";
import { STAGES, uid, todayISO, fmtDate, withHistory } from "../data.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, StatCard, TableHead, Modal, Textarea, ProgressBar } from "../components/ui.jsx";

const TEMPLATE = "minmax(160px,1.1fr) 150px 230px 200px minmax(200px,1.3fr) 130px";
const ICONS = { "Physio Advised": PersonStanding, "Physio Started": Dumbbell, "Sessions Completed": CircleCheck, "Follow-up / Progress": TrendingUp };
export const physioTone = (s) => (s === "Sessions Completed" ? "green" : s === "Physio Started" ? "teal" : s === "Follow-up / Progress" ? "yellow" : "sky");

export default function Physio({ data, setData, onOpenPatient }) {
  const today = todayISO();
  const list = data.physio || [];
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const EMPTY = { patientId: "", advisedBy: "", therapist: "", plannedSessions: 10 };
  const [form, setForm] = useState(EMPTY);
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState({ text: "", status: "" });

  const add = () => {
    const p = data.patients.find((x) => x.id === form.patientId);
    if (!p) return;
    const rec = { id: uid(), patientId: p.id, patientName: p.name, advisedBy: form.advisedBy || p.doctor || "", therapist: form.therapist, advisedOn: today, startedOn: "", plannedSessions: Number(form.plannedSessions) || 0, sessionsDone: 0, status: "Physio Advised", log: [] };
    setData((d) => withHistory({ ...d, physio: [rec, ...(d.physio || [])] }, p.id, "Physio", `Physio advised, ${rec.plannedSessions} sessions`));
    setForm(EMPTY);
    setShowAdd(false);
  };
  const update = (r, patch, historyText) =>
    setData((d) => {
      const next = { ...d, physio: d.physio.map((x) => (x.id === r.id ? { ...x, ...patch } : x)) };
      return historyText ? withHistory(next, r.patientId, "Physio", historyText) : next;
    });
  // Session counter moves the status along: first session starts physio, the last one completes it.
  const changeSessions = (r, delta) => {
    const done = Math.max(0, (r.sessionsDone || 0) + delta);
    let status = r.status;
    const patch = { sessionsDone: done };
    if (delta > 0 && r.status === "Physio Advised") { status = "Physio Started"; patch.startedOn = r.startedOn || today; }
    if (delta > 0 && r.plannedSessions && done >= r.plannedSessions && status === "Physio Started") status = "Sessions Completed";
    patch.status = status;
    update(r, patch, status !== r.status ? status : delta > 0 ? `Session ${done} done` : null);
  };
  const saveNote = () => {
    const r = noteFor;
    update(r, { status: note.status, log: [...(r.log || []), { date: today, note: note.text.trim() }] }, `Progress: ${note.text.trim() || note.status}`);
    setNoteFor(null);
  };

  const rows = list.filter((r) => filter === "All" || r.status === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Btn kind="primary" icon={Plus} onClick={() => setShowAdd((s) => !s)}>Advise physio</Btn>
      </div>
      {showAdd && (
        <AddPanel title="Physiotherapy advised">
          <Field label="Patient"><Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Advised by"><Input value={form.advisedBy} onChange={(e) => setForm({ ...form, advisedBy: e.target.value })} placeholder="Dr. name" /></Field>
          <Field label="Therapist"><Input value={form.therapist} onChange={(e) => setForm({ ...form, therapist: e.target.value })} placeholder="Therapist name" /></Field>
          <Field label="Planned sessions"><Input type="number" min="1" value={form.plannedSessions} onChange={(e) => setForm({ ...form, plannedSessions: e.target.value })} /></Field>
          <Btn kind="primary" onClick={add} disabled={!form.patientId}>Save</Btn>
        </AddPanel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, calc(50% - 10px)), 1fr))", gap: 20, marginBottom: 24 }}>
        {STAGES.physio.map((st) => (
          <StatCard key={st} label={st} value={list.filter((r) => r.status === st).length} tone={physioTone(st)} icon={ICONS[st]} onClick={() => setFilter(filter === st ? "All" : st)} active={filter === st} />
        ))}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{filter === "All" ? "All physiotherapy plans" : filter}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {filter !== "All" && <Btn kind="link" small onClick={() => setFilter("All")}>Show all</Btn>}
            <span style={{ fontSize: 14, color: COLORS.inkSoft }}>{rows.length}</span>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1100 }}>
            <TableHead columns={["Patient / Advised by", "Advised / Started", "Sessions", "Status", "Latest progress", "Action"]} template={TEMPLATE} />
            {rows.map((r, i) => {
              const last = (r.log || [])[r.log.length - 1];
              const pct = r.plannedSessions ? (r.sessionsDone / r.plannedSessions) * 100 : 0;
              return (
                <div key={r.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: TEMPLATE, gap: 12, alignItems: "center", padding: "14px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none", fontSize: 13.5 }}>
                  <div>
                    <div role="button" tabIndex={0} onClick={() => onOpenPatient && onOpenPatient(r.patientId)} onKeyDown={(e) => e.key === "Enter" && onOpenPatient && onOpenPatient(r.patientId)} style={{ color: COLORS.ink, fontWeight: 500, cursor: "pointer" }}>{r.patientName}</div>
                    <div style={{ fontSize: 12.5, color: COLORS.slate }}>{r.advisedBy || "—"}{r.therapist ? `, ${r.therapist}` : ""}</div>
                  </div>
                  <div style={{ color: COLORS.inkSoft }}>
                    {fmtDate(r.advisedOn)}
                    <div style={{ fontSize: 12, color: COLORS.slate }}>{r.startedOn ? `Started ${fmtDate(r.startedOn)}` : "Not started"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button className="icon-btn" aria-label="Remove a session" onClick={() => changeSessions(r, -1)} disabled={!r.sessionsDone} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${COLORS.line}`, background: "#fff", cursor: r.sessionsDone ? "pointer" : "not-allowed", opacity: r.sessionsDone ? 1 : 0.4, display: "inline-flex", alignItems: "center", justifyContent: "center", color: COLORS.ink }}><Minus size={14} /></button>
                    <div style={{ flex: 1, minWidth: 90 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 5 }}>{r.sessionsDone} / {r.plannedSessions || "?"}</div>
                      <ProgressBar value={pct} tone={pct >= 100 ? "green" : "blue"} />
                    </div>
                    <button className="icon-btn" aria-label="Add a session" onClick={() => changeSessions(r, 1)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: COLORS.blue, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Plus size={14} /></button>
                  </div>
                  <Select value={r.status} onChange={(e) => update(r, { status: e.target.value, startedOn: e.target.value !== "Physio Advised" ? r.startedOn || today : r.startedOn }, e.target.value)} aria-label="Status" style={{ minHeight: 36, padding: "6px 10px" }}>{STAGES.physio.map((s) => <option key={s}>{s}</option>)}</Select>
                  <div style={{ fontSize: 12.5, color: last ? COLORS.ink : COLORS.slate }}>{last ? <>{last.note || "Progress noted"}<div style={{ color: COLORS.slate, marginTop: 2 }}>{fmtDate(last.date)}</div></> : "No notes yet"}</div>
                  <Btn small icon={MessageSquare} onClick={() => { setNoteFor(r); setNote({ text: "", status: r.status === "Sessions Completed" ? "Follow-up / Progress" : r.status }); }}>Progress</Btn>
                </div>
              );
            })}
            {rows.length === 0 && <div style={{ padding: "28px 24px", fontSize: 14, color: COLORS.inkSoft }}>{list.length ? "No plans with this status." : "No physiotherapy plans yet."}</div>}
          </div>
        </div>
      </Card>

      <Modal open={!!noteFor} onClose={() => setNoteFor(null)} title="Physio progress" subtitle={noteFor ? `${noteFor.patientName}, ${noteFor.sessionsDone} of ${noteFor.plannedSessions} sessions` : ""} width={520}>
        <div style={{ display: "grid", gap: 14 }}>
          <Field label="Progress note"><Textarea value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} placeholder="Range of motion, pain, mobility, home exercises" /></Field>
          <Field label="Status"><Select value={note.status} onChange={(e) => setNote({ ...note, status: e.target.value })}>{STAGES.physio.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          {noteFor && (noteFor.log || []).length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Earlier notes</div>
              {[...noteFor.log].reverse().map((l, i) => <div key={i} style={{ fontSize: 12.5, color: COLORS.inkSoft, padding: "6px 0", borderTop: `1px solid ${COLORS.line}` }}>{fmtDate(l.date)}: {l.note || "—"}</div>)}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn onClick={() => setNoteFor(null)}>Cancel</Btn>
            <Btn kind="primary" onClick={saveNote}>Save</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
