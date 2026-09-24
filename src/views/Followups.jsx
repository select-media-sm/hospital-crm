import React, { useState, useMemo } from "react";
import { PhoneCall, Users, MessageSquare, CalendarDays, Filter, Plus, EyeOff, Eye, Phone, UserRound, CalendarClock } from "lucide-react";
import { COLORS } from "../theme.js";
import { STAGES, uid, todayISO, daysFromNow, fmtDate, maskMobile, maskEmail } from "../data.js";
import { followupTone } from "../lib/tones.js";
import { sourceMeta } from "../lib/sources.js";
import { Card, Btn, Badge, Input, Select, Textarea, Field, AddPanel, SectionTitle, StatCard, TableHead, Modal } from "../components/ui.jsx";

const COLS = ["Action", "Patient / Planned surgery", "Referred by", "Mobile", "Email", "Last follow-up", "Next due", "Executive", "Status", "Lead source"];
const TEMPLATE = "86px minmax(170px,1.5fr) minmax(110px,1fr) 104px minmax(170px,1.4fr) 112px 112px minmax(110px,1fr) 150px minmax(140px,1.1fr)";

function Radio({ checked, onChange, icon: Icon, label }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 14, color: COLORS.ink }}>
      <input type="radio" checked={checked} onChange={onChange} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span style={{ width: 18, height: 18, borderRadius: 18, border: `2px solid ${COLORS.blue}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {checked && <span style={{ width: 9, height: 9, borderRadius: 9, background: COLORS.blue }} />}
      </span>
      <Icon size={16} color={COLORS.ink} />
      {label}
    </label>
  );
}

function SourceCell({ source }) {
  const { icon: Icon, color } = sourceMeta(source);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, color: COLORS.ink }}>
      <span style={{ width: 24, height: 24, borderRadius: 7, background: `${color}14`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={14} color={color} strokeWidth={2.1} />
      </span>
      {source || "—"}
    </span>
  );
}

function ReferredBy({ value }) {
  const isDoctor = /^dr\.?\s/i.test(value || "");
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, color: COLORS.ink }}>
      {value || "Self"}
      {isDoctor && (
        <span title="Doctor referral" style={{ width: 24, height: 24, borderRadius: 24, background: COLORS.redPale, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Phone size={12} color={COLORS.red} strokeWidth={2.4} />
        </span>
      )}
    </span>
  );
}

export default function Followups({ data, setData, onOpenPatient }) {
  const today = todayISO();
  const executives = data.executives || [];
  const doctors = useMemo(() => [...new Set(data.patients.map((p) => p.doctor).filter(Boolean))].sort(), [data.patients]);

  const [filters, setFilters] = useState({ doctor: "All", from: "", to: "", executive: "All", status: "All" });
  const [masked, setMasked] = useState(true);
  const [tab, setTab] = useState("pending");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ patientId: "", note: "", dueDate: daysFromNow(7), executive: executives[0] || "" });
  const [openId, setOpenId] = useState(null);
  const [update, setUpdate] = useState({ status: "", note: "", dueDate: "", executive: "" });

  const patientById = (id) => data.patients.find((p) => p.id === id);
  const plannedSurgery = (pid) => {
    const list = data.surgeries.filter((s) => s.patientId === pid && s.stage !== "Discharged");
    return list.length ? list[0].type : "";
  };

  // Stats reflect all follow-ups, independent of filters.
  const all = data.followups;
  const stats = {
    total: all.length,
    completed: all.filter((f) => f.done).length,
    yetToCall: all.filter((f) => !f.done && f.status === "Yet to Call").length,
    pendingToday: all.filter((f) => !f.done && f.dueDate <= today).length,
  };

  const rows = all
    .map((f) => ({ f, p: patientById(f.patientId) || {} }))
    .filter(({ f, p }) => (tab === "pending" ? !f.done : f.done))
    .filter(({ p }) => filters.doctor === "All" || p.doctor === filters.doctor)
    .filter(({ f }) => !filters.from || f.dueDate >= filters.from)
    .filter(({ f }) => !filters.to || f.dueDate <= filters.to)
    .filter(({ f }) => filters.executive === "All" || f.executive === filters.executive)
    .filter(({ f }) => filters.status === "All" || f.status === filters.status)
    .sort((a, b) => (tab === "pending" ? (a.f.dueDate > b.f.dueDate ? 1 : -1) : (a.f.lastFollowup < b.f.lastFollowup ? 1 : -1)));

  const filtersActive = filters.doctor !== "All" || filters.from || filters.to || filters.executive !== "All" || filters.status !== "All";

  const addFollowup = () => {
    const patient = patientById(form.patientId);
    if (!patient || !form.note.trim()) return;
    const f = { id: uid(), patientId: patient.id, patientName: patient.name, note: form.note.trim(), dueDate: form.dueDate, done: false, executive: form.executive, status: "Yet to Call", lastFollowup: "", log: [] };
    setData((d) => ({ ...d, followups: [f, ...d.followups] }));
    setForm({ patientId: "", note: "", dueDate: daysFromNow(7), executive: executives[0] || "" });
    setShowAdd(false);
  };

  const openView = (f) => {
    setOpenId(f.id);
    setUpdate({ status: f.status, note: "", dueDate: f.dueDate, executive: f.executive || "" });
  };

  const saveUpdate = () => {
    const done = update.status === "Completed";
    setData((d) => ({
      ...d,
      followups: d.followups.map((f) =>
        f.id !== openId
          ? f
          : {
              ...f,
              status: update.status,
              executive: update.executive,
              dueDate: update.dueDate || f.dueDate,
              done,
              lastFollowup: today,
              log: [...(f.log || []), { date: today, status: update.status, note: update.note.trim(), by: update.executive }],
            }
      ),
    }));
    setOpenId(null);
  };

  const reopen = (id) => setData((d) => ({ ...d, followups: d.followups.map((f) => (f.id === id ? { ...f, done: false, status: "Yet to Call" } : f)) }));

  const current = all.find((f) => f.id === openId);
  const currentPatient = current ? patientById(current.patientId) : null;

  return (
    <div>
      <SectionTitle
        title="Follow-up Dashboard"
        subtitle="Manage patient follow-ups and track lead conversions"
        action={<Btn kind="primary" icon={Plus} onClick={() => setShowAdd((s) => !s)}>Add follow-up</Btn>}
      />

      {showAdd && (
        <AddPanel title="New follow-up">
          <Field label="Patient">
            <Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
              <option value="">Select patient</option>
              {data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Reason"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Wound check" /></Field>
          <Field label="Due date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <Field label="Assigned executive">
            <Select value={form.executive} onChange={(e) => setForm({ ...form, executive: e.target.value })}>
              <option value="">Unassigned</option>
              {executives.map((x) => <option key={x}>{x}</option>)}
            </Select>
          </Field>
          <Btn kind="primary" onClick={addFollowup} disabled={!form.patientId || !form.note.trim()}>Save follow-up</Btn>
        </AddPanel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 28 }}>
        <StatCard label="Total Follow-ups" value={stats.total} tone="teal" icon={PhoneCall} />
        <StatCard label="Completed" value={stats.completed} tone="green" icon={Users} />
        <StatCard label="Yet to Call" value={stats.yetToCall} tone="yellow" icon={MessageSquare} />
        <StatCard label="Pending Today" value={stats.pendingToday} tone="sky" icon={CalendarDays} />
      </div>

      <Card style={{ padding: "26px 30px", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 600, color: COLORS.ink }}>
            <Filter size={20} color={COLORS.blue} /> Filters
          </div>
          {filtersActive && <Btn kind="link" small onClick={() => setFilters({ doctor: "All", from: "", to: "", executive: "All", status: "All" })}>Clear filters</Btn>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
          <Field label="Doctor">
            <Select value={filters.doctor} onChange={(e) => setFilters({ ...filters, doctor: e.target.value })}>
              <option value="All">All Doctors</option>
              {doctors.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="From Date"><Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></Field>
          <Field label="To Date"><Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></Field>
          <Field label="Assigned Executive">
            <Select value={filters.executive} onChange={(e) => setFilters({ ...filters, executive: e.target.value })}>
              <option value="All">All Executives</option>
              {executives.map((x) => <option key={x}>{x}</option>)}
            </Select>
          </Field>
          <Field label="Booking Status">
            <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="All">All</option>
              {STAGES.followup.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        <div style={{ marginTop: 22, background: COLORS.mint, borderRadius: 10, padding: "18px 20px", display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink }}>Contact Details:</span>
          <Radio checked={masked} onChange={() => setMasked(true)} icon={EyeOff} label="Masked" />
          <Radio checked={!masked} onChange={() => setMasked(false)} icon={Eye} label="Unmasked" />
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 30px", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[["pending", "Pending Follow-ups"], ["done", "Completed"]].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: k === tab ? 17 : 15, fontWeight: 600, padding: "6px 10px", borderRadius: 8, background: "transparent", color: k === tab ? COLORS.ink : COLORS.slate }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 14, color: COLORS.inkSoft }}>{rows.length} patient{rows.length === 1 ? "" : "s"}</div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1360 }}>
            <TableHead columns={COLS} template={TEMPLATE} />
            {rows.map(({ f, p }, i) => {
              const overdue = !f.done && f.dueDate < today;
              const dueToday = !f.done && f.dueDate === today;
              return (
                <div key={f.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: TEMPLATE, gap: 12, alignItems: "center", padding: "18px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none", fontSize: 13.5, color: COLORS.ink }}>
                  <div>
                    {f.done ? (
                      <Btn kind="link" small onClick={() => reopen(f.id)}>Reopen</Btn>
                    ) : (
                      <Btn kind="link" small icon={Plus} onClick={() => openView(f)}>View</Btn>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14.5 }}>{f.patientName}</div>
                    <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{plannedSurgery(f.patientId) || f.note}</div>
                  </div>
                  <ReferredBy value={p.referredBy} />
                  <div style={{ fontVariantNumeric: "tabular-nums" }}>{masked ? maskMobile(p.mobile) : p.mobile || "—"}</div>
                  <div style={{ wordBreak: "break-all" }}>{masked ? maskEmail(p.email) : p.email || "—"}</div>
                  <div style={{ color: COLORS.inkSoft }}>{f.lastFollowup ? fmtDate(f.lastFollowup) : "Not called yet"}</div>
                  <div style={{ color: overdue ? COLORS.red : dueToday ? COLORS.yellowDeep : COLORS.inkSoft, fontWeight: overdue || dueToday ? 600 : 400 }}>
                    {dueToday ? "Today" : fmtDate(f.dueDate)}
                    {overdue && <div style={{ fontSize: 11.5, fontWeight: 500 }}>Overdue</div>}
                  </div>
                  <div>{f.executive || <span style={{ color: COLORS.slate }}>Unassigned</span>}</div>
                  <div><Badge tone={followupTone(f.status)} dot>{f.status}</Badge></div>
                  <SourceCell source={p.source} />
                </div>
              );
            })}
            {rows.length === 0 && (
              <div style={{ padding: "34px 30px", fontSize: 14, color: COLORS.inkSoft }}>
                {filtersActive ? "No follow-ups match these filters. Clear the filters to see everything." : tab === "pending" ? "No pending follow-ups. Add one to start tracking calls." : "No completed follow-ups yet."}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Modal
        open={!!current}
        onClose={() => setOpenId(null)}
        title={current?.patientName}
        subtitle={current ? `${plannedSurgery(current.patientId) || current.note}${currentPatient?.doctor ? ", " + currentPatient.doctor : ""}` : ""}
      >
        {current && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", fontSize: 13.5, marginBottom: 20 }}>
              <div><div style={{ color: COLORS.inkSoft, fontSize: 12.5 }}>Mobile</div><div>{masked ? maskMobile(currentPatient?.mobile) : currentPatient?.mobile || "—"}</div></div>
              <div><div style={{ color: COLORS.inkSoft, fontSize: 12.5 }}>Email</div><div style={{ wordBreak: "break-all" }}>{masked ? maskEmail(currentPatient?.email) : currentPatient?.email || "—"}</div></div>
              <div><div style={{ color: COLORS.inkSoft, fontSize: 12.5 }}>Reason</div><div>{current.note}</div></div>
              <div><div style={{ color: COLORS.inkSoft, fontSize: 12.5 }}>Referred by</div><div>{currentPatient?.referredBy || "Self"}</div></div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
              {currentPatient?.mobile && (
                <a href={`tel:${currentPatient.mobile}`} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, padding: "7px 12px", borderRadius: 10, background: COLORS.bluePale, color: COLORS.blueDeep }}>
                  <Phone size={14} strokeWidth={2.2} /> Call patient
                </a>
              )}
              <Btn small icon={UserRound} onClick={() => { setOpenId(null); onOpenPatient && onOpenPatient(current.patientId); }}>Open patient profile</Btn>
            </div>

            <div style={{ background: COLORS.mint, borderRadius: 12, padding: 18, marginBottom: 20 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 14 }}>Log this call</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 14 }}>
                <Field label="Status">
                  <Select value={update.status} onChange={(e) => setUpdate({ ...update, status: e.target.value })}>
                    {STAGES.followup.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                </Field>
                <Field label="Executive">
                  <Select value={update.executive} onChange={(e) => setUpdate({ ...update, executive: e.target.value })}>
                    <option value="">Unassigned</option>
                    {executives.map((x) => <option key={x}>{x}</option>)}
                  </Select>
                </Field>
                <Field label="Next due date">
                  <Input type="date" value={update.dueDate} onChange={(e) => setUpdate({ ...update, dueDate: e.target.value })} />
                </Field>
              </div>
              <Field label="Call notes">
                <Textarea value={update.note} onChange={(e) => setUpdate({ ...update, note: e.target.value })} placeholder="What did the patient say?" />
              </Field>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
                <Btn onClick={() => setOpenId(null)}>Cancel</Btn>
                <Btn kind="primary" icon={CalendarClock} onClick={saveUpdate}>Save call</Btn>
              </div>
            </div>

            <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 8 }}>Call history</div>
            {(current.log || []).length === 0 && <div style={{ fontSize: 13, color: COLORS.slate }}>No calls logged yet.</div>}
            {[...(current.log || [])].reverse().map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "100px auto 1fr", gap: 12, alignItems: "start", padding: "10px 0", borderTop: `1px solid ${COLORS.line}`, fontSize: 13 }}>
                <div style={{ color: COLORS.inkSoft }}>{fmtDate(l.date)}</div>
                <Badge tone={followupTone(l.status)} dot>{l.status}</Badge>
                <div>
                  <div style={{ color: COLORS.ink }}>{l.note || <span style={{ color: COLORS.slate }}>No notes</span>}</div>
                  {l.by && <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 2 }}>{l.by}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
