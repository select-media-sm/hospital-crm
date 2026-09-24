import React, { useState } from "react";
import { HeartPulse, CalendarClock, AlertTriangle, CircleCheck, Plus, ListChecks } from "lucide-react";
import { COLORS } from "../theme.js";
import { STAGES, SURGERY_GROUPS, uid, todayISO, fmtDate, podLabel, daysBetween, makePostopSchedule, withHistory } from "../data.js";
import { Card, Btn, Badge, Input, Select, StatCard, TableHead } from "../components/ui.jsx";

const TEMPLATE = "150px 170px 150px 130px minmax(200px,1fr)";
const statusTone = (e, today) => (e.status === "Done" ? "green" : e.status === "Missed" ? "red" : e.dueDate < today ? "red" : e.dueDate === today ? "yellow" : "sky");
const statusText = (e, today) => (e.status === "Scheduled" && e.dueDate < today ? "Overdue" : e.status === "Scheduled" && e.dueDate === today ? "Due today" : e.status);

export default function PostOp({ data, setData, onOpenPatient }) {
  const today = todayISO();
  const events = data.postop || [];
  const cases = data.surgeries.filter((s) => SURGERY_GROUPS.done.includes(s.stage)).sort((a, b) => ((a.date || "") < (b.date || "") ? 1 : -1));
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(null);
  const [form, setForm] = useState({ type: STAGES.postop[0], dueDate: today, note: "" });

  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndISO = weekEnd.toISOString().slice(0, 10);
  const open = events.filter((e) => e.status === "Scheduled");
  const stats = {
    patients: cases.length,
    thisWeek: open.filter((e) => e.dueDate >= today && e.dueDate <= weekEndISO).length,
    overdue: open.filter((e) => e.dueDate < today).length,
    done: events.filter((e) => e.status === "Done").length,
  };

  const updateEvent = (e, patch) =>
    setData((d) => {
      const next = { ...d, postop: d.postop.map((x) => (x.id === e.id ? { ...x, ...patch } : x)) };
      return patch.status && patch.status !== "Scheduled" ? withHistory(next, e.patientId, "Post-op", `${e.type}: ${patch.status}`) : next;
    });
  const applySchedule = (s) => setData((d) => ({ ...d, postop: [...(d.postop || []), ...makePostopSchedule({ ...s, date: s.date || today }, uid)] }));
  const addEvent = (s) => {
    const ev = { id: uid(), surgeryId: s.id, patientId: s.patientId, patientName: s.patientName, type: form.type, dueDate: form.dueDate, status: "Scheduled", note: form.note.trim(), result: "" };
    setData((d) => ({ ...d, postop: [...(d.postop || []), ev] }));
    setAdding(null);
    setForm({ type: STAGES.postop[0], dueDate: today, note: "" });
  };

  const visibleCases = cases.filter((s) => {
    if (filter === "all") return true;
    const ev = events.filter((e) => e.surgeryId === s.id && e.status === "Scheduled");
    if (filter === "overdue") return ev.some((e) => e.dueDate < today);
    if (filter === "week") return ev.some((e) => e.dueDate >= today && e.dueDate <= weekEndISO);
    return true;
  });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, calc(50% - 10px)), 1fr))", gap: 20, marginBottom: 24 }}>
        <StatCard label="Patients in post-op care" value={stats.patients} tone="teal" icon={HeartPulse} onClick={() => setFilter("all")} active={filter === "all"} />
        <StatCard label="Due in the next 7 days" value={stats.thisWeek} tone="sky" icon={CalendarClock} onClick={() => setFilter(filter === "week" ? "all" : "week")} active={filter === "week"} />
        <StatCard label="Overdue" value={stats.overdue} tone="red" icon={AlertTriangle} onClick={() => setFilter(filter === "overdue" ? "all" : "overdue")} active={filter === "overdue"} />
        <StatCard label="Visits / tests done" value={stats.done} tone="green" icon={CircleCheck} />
      </div>

      {visibleCases.length === 0 && (
        <Card><div style={{ fontSize: 14, color: COLORS.inkSoft }}>{cases.length ? "No patients match this filter." : "No operated patients yet. When a surgery is marked Surgery Completed in Appointments, the patient appears here with a standard post-op schedule."}</div></Card>
      )}

      {visibleCases.map((s) => {
        const ev = events.filter((e) => e.surgeryId === s.id).sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
        const done = ev.filter((e) => e.status === "Done").length;
        const next = ev.find((e) => e.status === "Scheduled");
        return (
          <Card key={s.id} style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "18px 22px" }}>
              <div>
                <div role="button" tabIndex={0} onClick={() => onOpenPatient && onOpenPatient(s.patientId)} onKeyDown={(e) => e.key === "Enter" && onOpenPatient && onOpenPatient(s.patientId)} style={{ fontSize: 16, fontWeight: 600, color: COLORS.ink, cursor: "pointer" }}>{s.patientName}</div>
                <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>{s.type}, {s.surgeon}. Operated {fmtDate(s.date)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {s.date && <Badge tone="teal">{podLabel(s.date, today)}</Badge>}
                <Badge tone="slate">{done} of {ev.length} done</Badge>
                {next && <span style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Next: {next.type}, {fmtDate(next.dueDate)}</span>}
                {ev.length === 0 && <Btn small kind="soft" icon={ListChecks} onClick={() => applySchedule(s)}>Apply standard schedule</Btn>}
                <Btn small icon={Plus} onClick={() => { setAdding(adding === s.id ? null : s.id); setForm({ type: STAGES.postop[0], dueDate: today, note: "" }); }}>Add visit / test</Btn>
              </div>
            </div>

            {adding === s.id && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 12, alignItems: "end", padding: "14px 22px", background: COLORS.mint, borderTop: `1px solid ${COLORS.line}` }}>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} aria-label="Type">{STAGES.postop.map((t) => <option key={t}>{t}</option>)}</Select>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} aria-label="Due date" />
                <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. X-ray knee AP/lateral" aria-label="Note" />
                <Btn kind="primary" onClick={() => addEvent(s)}>Save</Btn>
              </div>
            )}

            {ev.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 820 }}>
                  <TableHead columns={["Post-op day", "Type", "Due date", "Status", "Result / notes"]} template={TEMPLATE} />
                  {ev.map((e, i) => {
                    const d = s.date ? daysBetween(s.date, e.dueDate) : null;
                    return (
                      <div key={e.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: TEMPLATE, gap: 12, alignItems: "center", padding: "12px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none", fontSize: 13.5 }}>
                        <div style={{ color: COLORS.inkSoft }}>{d === null ? "—" : `Day ${d} · Week ${Math.floor(d / 7) + 1}`}</div>
                        <div>
                          <div style={{ color: COLORS.ink, fontWeight: 500 }}>{e.type}</div>
                          {e.note && <div style={{ fontSize: 12, color: COLORS.slate }}>{e.note}</div>}
                        </div>
                        <Input type="date" value={e.dueDate} onChange={(x) => updateEvent(e, { dueDate: x.target.value })} aria-label="Due date" style={{ minHeight: 34, padding: "5px 9px" }} />
                        <div style={{ display: "grid", gap: 5 }}>
                          <Badge tone={statusTone(e, today)} dot>{statusText(e, today)}</Badge>
                          <Select value={e.status} onChange={(x) => updateEvent(e, { status: x.target.value })} aria-label="Status" style={{ minHeight: 32, padding: "4px 9px", fontSize: 12.5 }}>{STAGES.postopStatus.map((t) => <option key={t}>{t}</option>)}</Select>
                        </div>
                        <Input key={e.id + e.status} defaultValue={e.result} onBlur={(x) => x.target.value !== e.result && updateEvent(e, { result: x.target.value })} placeholder={e.type === "Lab Investigation" ? "Key values" : e.type === "MRI / Imaging" ? "Findings" : "Notes"} aria-label="Result" style={{ minHeight: 34, padding: "5px 9px" }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
