import React, { useState } from "react";
import { HeartPulse, Pill, PersonStanding } from "lucide-react";
import { COLORS } from "../theme.js";
import { SectionTitle } from "../components/ui.jsx";
import PostOp from "./PostOp.jsx";
import Medicine from "./Medicine.jsx";
import Physio from "./Physio.jsx";

// Post-operative follow-up, medicine treatment and physiotherapy, as tabs on one page.
export default function Treatment({ data, setData, onOpenPatient, initialTab = "postop" }) {
  const [tab, setTab] = useState(initialTab);
  const tabs = [
    ["postop", "Post-operative Follow-up", HeartPulse, (data.postop || []).filter((e) => e.status === "Scheduled").length],
    ["medicine", "Medicine Treatment", Pill, (data.medicines || []).filter((m) => m.status !== "Treatment Completed").length],
    ["physio", "Physiotherapy", PersonStanding, (data.physio || []).filter((p) => p.status !== "Sessions Completed").length],
  ];
  return (
    <div>
      <SectionTitle title="Treatment & Care" subtitle="Post-op visits and tests, medicine courses, and physiotherapy progress" />
      <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: `1px solid ${COLORS.line}`, marginBottom: 24, overflowX: "auto", scrollbarWidth: "none" }}>
        {tabs.map(([k, label, Icon, n]) => {
          const on = tab === k;
          return (
            <button key={k} role="tab" aria-selected={on} onClick={() => setTab(k)} style={{ fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0, whiteSpace: "nowrap", padding: "11px 16px", marginBottom: -1, border: "none", borderBottom: `2px solid ${on ? COLORS.blue : "transparent"}`, background: "transparent", cursor: "pointer", fontSize: 14.5, fontWeight: 600, color: on ? COLORS.blueDeep : COLORS.inkSoft }}>
              <Icon size={17} />
              {label}
              <span title="Open items" style={{ fontSize: 12, fontWeight: 700, padding: "1px 8px", borderRadius: 10, background: on ? COLORS.bluePale : "#EEF2F3", color: on ? COLORS.blueDeep : COLORS.inkSoft }}>{n}</span>
            </button>
          );
        })}
      </div>
      {tab === "postop" && <PostOp data={data} setData={setData} onOpenPatient={onOpenPatient} />}
      {tab === "medicine" && <Medicine data={data} setData={setData} onOpenPatient={onOpenPatient} />}
      {tab === "physio" && <Physio data={data} setData={setData} onOpenPatient={onOpenPatient} />}
    </div>
  );
}
