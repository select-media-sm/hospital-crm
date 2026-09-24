import React, { useState } from "react";
import { CalendarCheck, Hourglass, CircleX, CircleCheck, Plus } from "lucide-react";
import { COLORS } from "../theme.js";
import { STAGES, SURGERY_GROUPS, uid, todayISO, fmtDate, withHistory } from "../data.js";
import { surgeryTone } from "../lib/tones.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, SectionTitle, StatCard, TableHead } from "../components/ui.jsx";

const TEMPLATE = "minmax(180px,1.3fr) 260px 170px minmax(200px,1.4fr)";
const GROUP_META = {
  booked: { label: "Booked", tone: "green", icon: CalendarCheck },
  pending: { label: "Pending", tone: "yellow", icon: Hourglass },
  notConverted: { label: "Not converted", tone: "red", icon: CircleX },
  done: { label: "Completed / Discharged", tone: "teal", icon: CircleCheck },
};
const OPTGROUPS = [
  ["Booked", SURGERY_GROUPS.booked],
  ["Pending", SURGERY_GROUPS.pending],
  ["Not converted", SURGERY_GROUPS.notConverted],
  ["After surgery", SURGERY_GROUPS.done],
];
const fmtMonth = (m) => (m ? new Date(m + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "");

export function StatusSelect({ value, onChange, ...rest }) {
  return (
    <Select value={value} onChange={onChange} {...rest}>
      {OPTGROUPS.map(([label, list]) => (
        <optgroup key={label} label={label}>
          {list.map((s) => <option key={s}>{s}</option>)}
        </optgroup>
      ))}
    </Select>
  );
}

export default function Surgery({ data, setData, onOpenPatient, embedded }) {
  const today = todayISO();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ patientId: "", surgeon: "", type: "", stage: "Follow-up Pending" });
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("All");

  const addSurgery = () => {
    const patient = data.patients.find((p) => p.id === form.patientId);
    if (!patient || !form.type.trim()) return;
    const surgery = { id: uid(), patientId: patient.id, patientName: patient.name, surgeon: form.surgeon || patient.doctor || "Unassigned", type: form.type.trim(), stage: form.stage, date: "", tentativeMonth: "", notes: "" };
    setData((d) => withHistory({ ...d, surgeries: [surgery, ...d.surgeries] }, patient.id, "Surgery", `${surgery.type}: ${surgery.stage}`));
    setForm({ patientId: "", surgeon: "", type: "", stage: "Follow-up Pending" });
    setShowAdd(false);
  };
  const update = (s, patch) =>
    setData((d) => {
      const next = { ...d, surgeries: d.surgeries.map((x) => (x.id === s.id ? { ...x, ...patch } : x)) };
      return patch.stage ? withHistory(next, s.patientId, "Surgery", `${s.type}: ${patch.stage}`) : next;
    });

  const inGroup = (s, g) => g === "all" || SURGERY_GROUPS[g].includes(s.stage);
  const rows = data.surgeries.filter((s) => inGroup(s, group) && (status === "All" || s.stage === status));

  return (
    <div>
      {embedded ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: COLORS.inkSoft }}>Every advised surgery, from follow-up to booking, or the reason it did not convert</div>
          <Btn kind="primary" icon={Plus} onClick={() => setShowAdd((s) => !s)}>Add surgery case</Btn>
        </div>
      ) : (
        <SectionTitle title="IPD / Surgery Conversion" subtitle="Every advised surgery, from follow-up to booking, or the reason it did not convert" action={<Btn kind="primary" icon={Plus} onClick={() => setShowAdd((s) => !s)}>Add surgery case</Btn>} />
      )}
      {showAdd && (
        <AddPanel title="New surgery case">
          <Field label="Patient"><Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Surgeon"><Input value={form.surgeon} onChange={(e) => setForm({ ...form, surgeon: e.target.value })} placeholder="Dr. name" /></Field>
          <Field label="Surgery type"><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Total Knee Replacement" /></Field>
          <Field label="Status"><StatusSelect value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} /></Field>
          <Btn kind="primary" onClick={addSurgery} disabled={!form.patientId || !form.type.trim()}>Save case</Btn>
        </AddPanel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 20 }}>
        {Object.entries(GROUP_META).map(([g, m]) => (
          <StatCard key={g} label={m.label} value={data.surgeries.filter((s) => SURGERY_GROUPS[g].includes(s.stage)).length} tone={m.tone} icon={m.icon} onClick={() => { setGroup(group === g ? "all" : g); setStatus("All"); }} active={group === g} />
        ))}
      </div>

      <Card style={{ marginBottom: 24, padding: "18px 22px" }}>
        <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 12 }}>Conversion status breakdown</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {STAGES.surgery.map((st) => {
            const n = data.surgeries.filter((s) => s.stage === st).length;
            const on = status === st;
            return (
              <button key={st} onClick={() => { setStatus(on ? "All" : st); setGroup("all"); }} aria-pressed={on} style={{ fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12.5, fontWeight: 500, border: `1px solid ${on ? COLORS.blue : COLORS.line}`, background: on ? COLORS.bluePale : "#fff", color: n ? COLORS.ink : COLORS.slate }}>
                {st}
                <span style={{ fontWeight: 700, color: n ? COLORS.blueDeep : COLORS.slate }}>{n}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 26px", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{status !== "All" ? status : group === "all" ? "All surgery cases" : GROUP_META[group].label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {(group !== "all" || status !== "All") && <Btn kind="link" small onClick={() => { setGroup("all"); setStatus("All"); }}>Show all</Btn>}
            <span style={{ fontSize: 14, color: COLORS.inkSoft }}>{rows.length} case{rows.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            <TableHead columns={["Patient / Surgery", "Conversion status", "Date / Month", "Notes or reason"]} template={TEMPLATE} />
            {rows.map((s, i) => {
              const confirmed = s.stage === "Booked – Confirmed Surgery Date";
              const tentative = s.stage === "Tentative Month Booking";
              return (
                <div key={s.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: TEMPLATE, gap: 14, alignItems: "center", padding: "15px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
                  <div>
                    <div role="button" tabIndex={0} onClick={() => onOpenPatient && onOpenPatient(s.patientId)} onKeyDown={(e) => e.key === "Enter" && onOpenPatient && onOpenPatient(s.patientId)} style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500, cursor: "pointer" }}>{s.patientName}</div>
                    <div style={{ fontSize: 12.5, color: COLORS.slate }}>{s.type}, {s.surgeon}</div>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <Badge tone={surgeryTone(s.stage)} dot>{s.stage}</Badge>
                    <StatusSelect value={s.stage} onChange={(e) => update(s, { stage: e.target.value })} aria-label={`Status for ${s.patientName}`} style={{ minHeight: 34, padding: "5px 10px", fontSize: 12.5 }} />
                  </div>
                  <div>
                    {confirmed || SURGERY_GROUPS.done.includes(s.stage) ? (
                      <>
                        <Input type="date" value={s.date || ""} onChange={(e) => update(s, { date: e.target.value })} aria-label="Surgery date" style={{ minHeight: 36, padding: "6px 10px", borderColor: confirmed && !s.date ? COLORS.yellow : COLORS.line }} />
                        {confirmed && !s.date && <div style={{ fontSize: 11.5, color: COLORS.yellowDeep, marginTop: 3 }}>Add the confirmed date</div>}
                        {confirmed && s.date && s.date >= today && <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 3 }}>{fmtDate(s.date)}</div>}
                      </>
                    ) : tentative ? (
                      <>
                        <Input type="month" value={s.tentativeMonth || ""} onChange={(e) => update(s, { tentativeMonth: e.target.value })} aria-label="Tentative month" style={{ minHeight: 36, padding: "6px 10px" }} />
                        {s.tentativeMonth && <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 3 }}>{fmtMonth(s.tentativeMonth)}</div>}
                      </>
                    ) : (
                      <span style={{ fontSize: 12.5, color: COLORS.slate }}>—</span>
                    )}
                  </div>
                  <Input key={s.id + s.stage} defaultValue={s.notes || ""} onBlur={(e) => e.target.value !== (s.notes || "") && update(s, { notes: e.target.value })} placeholder={SURGERY_GROUPS.notConverted.includes(s.stage) ? "Why did it not convert?" : "Add a note"} aria-label="Notes" style={{ minHeight: 36, padding: "6px 10px" }} />
                </div>
              );
            })}
            {rows.length === 0 && <div style={{ padding: "30px 26px", fontSize: 14, color: COLORS.inkSoft }}>{data.surgeries.length ? "No cases with this status." : "No surgery cases yet. Open one from Counselling once surgery is advised, or add one here."}</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}
