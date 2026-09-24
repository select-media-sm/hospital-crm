import React, { useState } from "react";
import { HeartHandshake, ClipboardCheck, Stethoscope, Microscope, Plus, Scissors } from "lucide-react";
import { COLORS } from "../theme.js";
import { STAGES, uid, todayISO, fmtDate, withHistory } from "../data.js";
import { counsellingTone, surgeryTone } from "../lib/tones.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, SectionTitle, StatCard, TableHead, Modal } from "../components/ui.jsx";

const TEMPLATE = "minmax(170px,1.3fr) 120px 160px 230px minmax(180px,1.4fr) 250px";
const ICONS = { "Referred to Counsellor": HeartHandshake, "Counselling Completed": ClipboardCheck, "Surgery Advised": Stethoscope, "Further Investigation Required": Microscope };

export default function Counselling({ data, setData, onOpenPatient }) {
  const records = data.counselling || [];
  const counsellors = data.counsellors || [];
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ patientId: "", counsellor: counsellors[0] || "", notes: "" });
  const [caseFor, setCaseFor] = useState(null);
  const [caseForm, setCaseForm] = useState({ type: "", surgeon: "" });

  const update = (rec, patch) =>
    setData((d) => {
      const next = { ...d, counselling: d.counselling.map((c) => (c.id === rec.id ? { ...c, ...patch } : c)) };
      return patch.status ? withHistory(next, rec.patientId, "Counselling", patch.status) : next;
    });

  const addReferral = () => {
    const p = data.patients.find((x) => x.id === form.patientId);
    if (!p) return;
    const rec = { id: uid(), patientId: p.id, patientName: p.name, doctor: p.doctor || "", counsellor: form.counsellor, referredOn: todayISO(), status: "Referred to Counsellor", notes: form.notes.trim() };
    setData((d) => withHistory({ ...d, counselling: [rec, ...(d.counselling || [])] }, p.id, "Counselling", "Referred to counsellor"));
    setForm({ patientId: "", counsellor: counsellors[0] || "", notes: "" });
    setShowAdd(false);
  };

  const surgeryFor = (pid) => data.surgeries.find((s) => s.patientId === pid);
  const openCase = (rec) => { setCaseFor(rec); setCaseForm({ type: "", surgeon: rec.doctor || "" }); };
  const createCase = () => {
    if (!caseForm.type.trim()) return;
    const s = { id: uid(), patientId: caseFor.patientId, patientName: caseFor.patientName, surgeon: caseForm.surgeon || "Unassigned", type: caseForm.type.trim(), stage: "Follow-up Pending", date: "", tentativeMonth: "", notes: "" };
    setData((d) => withHistory({ ...d, surgeries: [s, ...d.surgeries] }, caseFor.patientId, "Surgery", `${s.type} case opened, follow-up pending`));
    setCaseFor(null);
  };

  const rows = records.filter((r) => filter === "All" || r.status === filter).sort((a, b) => (a.referredOn < b.referredOn ? 1 : -1));

  return (
    <div>
      <SectionTitle title="Counselling" subtitle="Patients referred from OPD, counselling outcome, and hand-off to surgery" action={<Btn kind="primary" icon={Plus} onClick={() => setShowAdd((s) => !s)}>Refer patient</Btn>} />

      {showAdd && (
        <AddPanel title="Refer to counsellor">
          <Field label="Patient"><Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Counsellor"><Select value={form.counsellor} onChange={(e) => setForm({ ...form, counsellor: e.target.value })}><option value="">Unassigned</option>{counsellors.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Notes"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Reason for referral" /></Field>
          <Btn kind="primary" onClick={addReferral} disabled={!form.patientId}>Save referral</Btn>
        </AddPanel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 28 }}>
        {STAGES.counselling.map((st) => (
          <StatCard key={st} label={st} value={records.filter((r) => r.status === st).length} tone={counsellingTone(st)} icon={ICONS[st]} onClick={() => setFilter(filter === st ? "All" : st)} active={filter === st} />
        ))}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 26px" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{filter === "All" ? "All referrals" : filter}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {filter !== "All" && <Btn kind="link" small onClick={() => setFilter("All")}>Show all</Btn>}
            <span style={{ fontSize: 14, color: COLORS.inkSoft }}>{rows.length} patient{rows.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1120 }}>
            <TableHead columns={["Patient / Doctor", "Referred on", "Counsellor", "Status", "Notes", "Surgery"]} template={TEMPLATE} />
            {rows.map((r, i) => {
              const surg = surgeryFor(r.patientId);
              return (
                <div key={r.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: TEMPLATE, gap: 12, alignItems: "center", padding: "14px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
                  <div>
                    <div role="button" tabIndex={0} onClick={() => onOpenPatient && onOpenPatient(r.patientId)} onKeyDown={(e) => e.key === "Enter" && onOpenPatient && onOpenPatient(r.patientId)} style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500, cursor: "pointer" }}>{r.patientName}</div>
                    <div style={{ fontSize: 12.5, color: COLORS.slate }}>{r.doctor || "—"}</div>
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{fmtDate(r.referredOn)}</div>
                  <Select value={r.counsellor} onChange={(e) => update(r, { counsellor: e.target.value })} aria-label="Counsellor" style={{ minHeight: 36, padding: "6px 10px" }}>
                    <option value="">Unassigned</option>
                    {counsellors.map((c) => <option key={c}>{c}</option>)}
                  </Select>
                  <Select value={r.status} onChange={(e) => update(r, { status: e.target.value })} aria-label="Counselling status" style={{ minHeight: 36, padding: "6px 10px", borderColor: `${COLORS.line}` }}>
                    {STAGES.counselling.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                  <Input defaultValue={r.notes} onBlur={(e) => e.target.value !== r.notes && update(r, { notes: e.target.value })} placeholder="Add a note" style={{ minHeight: 36, padding: "6px 10px" }} aria-label="Notes" />
                  <div>
                    {surg ? (
                      <Badge tone={surgeryTone(surg.stage)} dot>{surg.stage}</Badge>
                    ) : r.status === "Surgery Advised" ? (
                      <Btn small kind="soft" icon={Scissors} onClick={() => openCase(r)}>Open surgery case</Btn>
                    ) : (
                      <span style={{ fontSize: 12.5, color: COLORS.slate }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && <div style={{ padding: "30px 26px", fontSize: 14, color: COLORS.inkSoft }}>{filter === "All" ? "No referrals yet. Refer a patient from a completed OPD visit in Appointments, or use Refer patient." : "No patients with this status."}</div>}
          </div>
        </div>
      </Card>

      <Modal open={!!caseFor} onClose={() => setCaseFor(null)} title="Open surgery case" subtitle={caseFor ? `${caseFor.patientName}, advised by ${caseFor.doctor || "doctor"}` : ""} width={480}>
        <div style={{ display: "grid", gap: 14 }}>
          <Field label="Surgery type"><Input value={caseForm.type} onChange={(e) => setCaseForm({ ...caseForm, type: e.target.value })} placeholder="e.g. Total Knee Replacement" autoFocus /></Field>
          <Field label="Surgeon"><Input value={caseForm.surgeon} onChange={(e) => setCaseForm({ ...caseForm, surgeon: e.target.value })} placeholder="Dr. name" /></Field>
          <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>The case starts as Follow-up Pending under Appointments, in the IPD / Surgery Conversion tab.</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn onClick={() => setCaseFor(null)}>Cancel</Btn>
            <Btn kind="primary" onClick={createCase} disabled={!caseForm.type.trim()}>Open case</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
