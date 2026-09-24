import React, { useState } from "react";
import { CalendarCheck, CalendarX, ClipboardCheck, Plus, HeartHandshake, Stethoscope, Scissors } from "lucide-react";
import { COLORS } from "../theme.js";
import { STAGES, OPD_ACTIVE, uid, todayISO, fmtDate, withHistory } from "../data.js";
import { apptTone } from "../lib/tones.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, SectionTitle, StatCard, TableHead } from "../components/ui.jsx";
import SurgeryConversion from "./Surgery.jsx";

const TEMPLATE = "minmax(170px,1.4fr) 160px 100px 120px 160px 180px";
const GROUPS = {
  booked: { label: "OPD Booked", match: (s) => OPD_ACTIVE.includes(s) },
  completed: { label: "OPD Completed", match: (s) => s === "Completed" },
  cancelled: { label: "OPD Cancelled / No-show", match: (s) => s === "Cancelled" || s === "No-show" },
};

export default function Appointments({ data, setData, onOpenPatient, initialTab = "opd" }) {
  const [tab, setTab] = useState(initialTab);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ patientId: "", doctor: "", date: todayISO(), time: "09:00", type: "New" });
  const [group, setGroup] = useState("all");
  const counsellors = data.counsellors || [];

  const addAppt = () => {
    const patient = data.patients.find((p) => p.id === form.patientId);
    if (!patient) return;
    const appt = { id: uid(), patientId: patient.id, patientName: patient.name, doctor: form.doctor || patient.doctor || "Unassigned", date: form.date, time: form.time, type: form.type, status: "Booked" };
    setData((d) => withHistory({ ...d, appointments: [appt, ...d.appointments] }, patient.id, "OPD", `OPD booked for ${fmtDate(form.date)}`));
    setShowAdd(false);
  };
  const setStatus = (a, status) =>
    setData((d) => {
      const next = { ...d, appointments: d.appointments.map((x) => (x.id === a.id ? { ...x, status } : x)) };
      return ["Completed", "No-show", "Cancelled"].includes(status) ? withHistory(next, a.patientId, "OPD", `OPD ${status.toLowerCase()} (${fmtDate(a.date)})`) : next;
    });

  const isReferred = (pid) => (data.counselling || []).some((c) => c.patientId === pid);
  const referToCounsellor = (a) => {
    const rec = { id: uid(), patientId: a.patientId, patientName: a.patientName, doctor: a.doctor, counsellor: counsellors[0] || "", referredOn: todayISO(), status: "Referred to Counsellor", notes: "" };
    setData((d) => withHistory({ ...d, counselling: [rec, ...(d.counselling || [])] }, a.patientId, "Counselling", `Referred to counsellor by ${a.doctor}`));
  };

  const count = (g) => data.appointments.filter((a) => GROUPS[g].match(a.status)).length;
  const sorted = [...data.appointments]
    .filter((a) => group === "all" || GROUPS[group].match(a.status))
    .sort((a, b) => (a.date + a.time > b.date + b.time ? -1 : 1));
  const toggle = (g) => setGroup(group === g ? "all" : g);

  return (
    <div>
      <SectionTitle
        title="Appointments"
        subtitle="OPD bookings, referrals to the counsellor, and OPD / surgery conversion"
        action={tab === "opd" && <Btn kind="primary" icon={Plus} onClick={() => setShowAdd((s) => !s)}>Book appointment</Btn>}
      />

      <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: `1px solid ${COLORS.line}`, marginBottom: 24, overflowX: "auto", scrollbarWidth: "none" }}>
        {[["opd", "OPD Appointments", Stethoscope, data.appointments.length], ["surgery", "OPD / Surgery Conversion", Scissors, data.surgeries.length]].map(([k, label, Icon, n]) => {
          const on = tab === k;
          return (
            <button key={k} role="tab" aria-selected={on} onClick={() => setTab(k)} style={{ fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0, whiteSpace: "nowrap", padding: "11px 16px", marginBottom: -1, border: "none", borderBottom: `2px solid ${on ? COLORS.blue : "transparent"}`, background: "transparent", cursor: "pointer", fontSize: 14.5, fontWeight: 600, color: on ? COLORS.blueDeep : COLORS.inkSoft }}>
              <Icon size={17} />
              {label}
              <span style={{ fontSize: 12, fontWeight: 700, padding: "1px 8px", borderRadius: 10, background: on ? COLORS.bluePale : "#EEF2F3", color: on ? COLORS.blueDeep : COLORS.inkSoft }}>{n}</span>
            </button>
          );
        })}
      </div>

      {tab === "surgery" && <SurgeryConversion embedded data={data} setData={setData} onOpenPatient={onOpenPatient} />}

      {tab === "opd" && (<>
      {showAdd && (
        <AddPanel title="Book OPD appointment">
          <Field label="Patient"><Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Doctor"><Input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} placeholder="Dr. name" /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Time"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["New", "Follow-up", "Emergency"].map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Btn kind="primary" onClick={addAppt} disabled={!form.patientId}>Book</Btn>
        </AddPanel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, calc(50% - 10px)), 1fr))", gap: 20, marginBottom: 28 }}>
        <StatCard label="OPD Booked" value={count("booked")} tone="sky" icon={CalendarCheck} onClick={() => toggle("booked")} active={group === "booked"} />
        <StatCard label="OPD Completed" value={count("completed")} tone="green" icon={ClipboardCheck} onClick={() => toggle("completed")} active={group === "completed"} />
        <StatCard label="OPD Cancelled / No-show" value={count("cancelled")} tone="red" icon={CalendarX} onClick={() => toggle("cancelled")} active={group === "cancelled"} />
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 26px" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{group === "all" ? "All appointments" : GROUPS[group].label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {group !== "all" && <Btn kind="link" small onClick={() => setGroup("all")}>Show all</Btn>}
            <span style={{ fontSize: 14, color: COLORS.inkSoft }}>{sorted.length} appointment{sorted.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 980 }}>
            <TableHead columns={["Patient", "Date / Time", "Type", "Status", "Update status", "Counselling"]} template={TEMPLATE} />
            {sorted.map((a, i) => (
              <div key={a.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: TEMPLATE, gap: 12, alignItems: "center", padding: "14px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
                <div><div style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500 }}>{a.patientName}</div><div style={{ fontSize: 12.5, color: COLORS.slate }}>{a.doctor}</div></div>
                <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{fmtDate(a.date)}, {a.time}</div>
                <Badge tone="slate">{a.type}</Badge>
                <Badge tone={apptTone(a.status)} dot>{a.status}</Badge>
                <Select value={a.status} onChange={(e) => setStatus(a, e.target.value)} aria-label={`Status for ${a.patientName}`} style={{ minHeight: 36, padding: "6px 10px" }}>{STAGES.appt.map((s) => <option key={s}>{s}</option>)}</Select>
                <div>
                  {a.status === "Completed" && (isReferred(a.patientId) ? (
                    <Badge tone="teal">Referred</Badge>
                  ) : (
                    <Btn small icon={HeartHandshake} onClick={() => referToCounsellor(a)}>Refer to counsellor</Btn>
                  ))}
                </div>
              </div>
            ))}
            {sorted.length === 0 && <div style={{ padding: "30px 26px", fontSize: 14, color: COLORS.inkSoft }}>No appointments with this status.</div>}
          </div>
        </div>
      </Card>
      </>)}
    </div>
  );
}
