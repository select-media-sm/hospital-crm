import React, { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { COLORS } from "../theme.js";
import { todayISO, daysFromNow, fmtDate } from "../data.js";
import { commTone } from "../lib/tones.js";
import { PATIENT_TEMPLATES, LEAD_TEMPLATES } from "../lib/messaging.js";
import { logMessage } from "../lib/commLog.js";
import { Card, Btn, Badge, Select, Field, SectionTitle, TableHead } from "../components/ui.jsx";
import MessageComposer from "../components/MessageComposer.jsx";

const TEMPLATE_COLS = "110px minmax(160px,1.1fr) 110px minmax(150px,1fr) minmax(220px,2fr) 170px";

export default function Communication({ data, setData }) {
  const today = todayISO();
  const tomorrow = daysFromNow(1);
  const [audience, setAudience] = useState("Patient");
  const [pick, setPick] = useState("");
  const [compose, setCompose] = useState(null);
  const [channelFilter, setChannelFilter] = useState("All");

  const patientR = (p) => ({ id: p.id, name: p.name, mobile: p.mobile, email: p.email, doctor: p.doctor, department: p.department });
  const leadR = (l) => ({ id: l.id, name: l.name, mobile: l.mobile, email: l.email, doctor: l.doctor, department: l.department });
  const byIds = (ids) => data.patients.filter((p) => ids.has(p.id)).map(patientR);

  const PATIENT_GROUPS = {
    "OPD appointments today": () => byIds(new Set(data.appointments.filter((a) => a.date === today && a.status === "Booked").map((a) => a.patientId))),
    "OPD appointments tomorrow": () => byIds(new Set(data.appointments.filter((a) => a.date === tomorrow && a.status === "Booked").map((a) => a.patientId))),
    "Post-op visit due in the next 3 days": () => byIds(new Set((data.postop || []).filter((e) => e.status === "Scheduled" && e.dueDate >= today && e.dueDate <= daysFromNow(3)).map((e) => e.patientId))),
    "Medicine follow-up due": () => byIds(new Set((data.medicines || []).filter((m) => m.status !== "Treatment Completed" && m.nextFollowup && m.nextFollowup <= today).map((m) => m.patientId))),
    "All patients": () => data.patients.map(patientR),
  };
  const LEAD_GROUPS = {
    "New Leads": () => data.leads.filter((l) => l.stage === "New Lead").map(leadR),
    "Follow-up due today or overdue": () => data.leads.filter((l) => l.stage === "Follow-up Required" && l.nextFollowup && l.nextFollowup <= today).map(leadR),
    "All Follow-up Required": () => data.leads.filter((l) => l.stage === "Follow-up Required").map(leadR),
  };
  const groups = audience === "Patient" ? PATIENT_GROUPS : LEAD_GROUPS;
  const people = audience === "Patient" ? data.patients : data.leads.filter((l) => l.stage !== "Converted");

  const resolve = () => {
    if (pick.startsWith("g:")) return groups[pick.slice(2)]();
    if (pick.startsWith("i:")) {
      const x = people.find((p) => p.id === pick.slice(2));
      return x ? [audience === "Patient" ? patientR(x) : leadR(x)] : [];
    }
    return [];
  };
  const preview = pick ? resolve() : [];

  const log = [...(data.communications || [])]
    .filter((c) => channelFilter === "All" || c.channel === channelFilter)
    .sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));

  return (
    <div>
      <SectionTitle title="Communication" subtitle="Send WhatsApp, SMS or email to patients and leads, one at a time or as a group" />

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 14, alignItems: "end" }}>
          <Field label="Send to">
            <Select value={audience} onChange={(e) => { setAudience(e.target.value); setPick(""); }}>
              <option value="Patient">Patients</option>
              <option value="Lead">Leads (not yet converted)</option>
            </Select>
          </Field>
          <Field label="Recipients">
            <Select value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Choose a group or a person</option>
              <optgroup label="Groups">
                {Object.keys(groups).map((g) => <option key={g} value={"g:" + g}>{g} ({groups[g]().length})</option>)}
              </optgroup>
              <optgroup label={audience === "Patient" ? "Patients" : "Leads"}>
                {people.map((p) => <option key={p.id} value={"i:" + p.id}>{p.name}</option>)}
              </optgroup>
            </Select>
          </Field>
          <Btn kind="primary" icon={Send} disabled={!preview.length} onClick={() => setCompose(preview)}>
            {preview.length > 1 ? `Compose for ${preview.length}` : "Compose message"}
          </Btn>
        </div>
        {pick && preview.length === 0 && <div style={{ fontSize: 13, color: COLORS.slate, marginTop: 12 }}>Nobody is in this group right now.</div>}
        <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 14, lineHeight: 1.5 }}>
          Messages open in WhatsApp, your SMS app or your email with the text filled in, and are sent from there. Sending automatically, without opening each message, needs a WhatsApp Business API provider and a server connected to this CRM.
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "18px 24px" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.ink }}>Message log</div>
          <div style={{ width: 170 }}>
            <Select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} aria-label="Channel">{["All", "WhatsApp", "SMS", "Email"].map((c) => <option key={c}>{c}</option>)}</Select>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            <TableHead columns={["Date", "To", "Channel", "Template", "Message", "Status"]} template={TEMPLATE_COLS} />
            {log.map((c, i) => (
              <div key={c.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: TEMPLATE_COLS, gap: 12, alignItems: "center", padding: "12px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none", fontSize: 13 }}>
                <div style={{ color: COLORS.inkSoft }}>{fmtDate(c.sentAt)}</div>
                <div><div style={{ color: COLORS.ink, fontWeight: 500 }}>{c.patientName}</div><div style={{ fontSize: 12, color: COLORS.slate }}>{c.audience || "Patient"}</div></div>
                <Badge tone={c.channel === "WhatsApp" ? "green" : c.channel === "SMS" ? "sky" : "teal"}>{c.channel}</Badge>
                <div style={{ color: COLORS.inkSoft }}>{c.template}</div>
                <div title={c.message} style={{ color: COLORS.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.message}</div>
                <Badge tone={commTone(c.status)}>{c.status}</Badge>
              </div>
            ))}
            {log.length === 0 && <div style={{ padding: "24px", fontSize: 13.5, color: COLORS.slate }}>No messages yet.</div>}
          </div>
        </div>
      </Card>

      <MessageComposer
        open={!!compose}
        onClose={() => setCompose(null)}
        title={audience === "Patient" ? "Message patients" : "Message leads"}
        recipients={compose || []}
        templates={audience === "Patient" ? PATIENT_TEMPLATES : LEAD_TEMPLATES}
        onOpened={(r, info) => setData(logMessage(audience === "Patient" ? "patient" : "lead", r, info))}
      />
    </div>
  );
}
