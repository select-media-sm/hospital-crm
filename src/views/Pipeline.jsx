import React, { useState, useMemo } from "react";
import { COLORS } from "../theme.js";
import { buildPipeline } from "../lib/pipeline.js";
import { Card, Btn, Badge, SectionTitle, TONE_MAP } from "../components/ui.jsx";

export default function Pipeline({ data, onOpenPatient, onNavigate }) {
  const stages = useMemo(() => buildPipeline(data), [data]);
  const [sel, setSel] = useState(null); // { stage, label }

  const selected = sel && stages.find((s) => s.key === sel.stage)?.items.find((i) => i.label === sel.label);
  const moduleFor = { lead: "leads", opd: "appointments", couns: "counselling", surg: "surgery" };

  return (
    <div>
      <SectionTitle title="Conversion" subtitle="Lead to OPD to counsellor to surgery, with where every patient stands right now. Select a status to see who is in it." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 20, alignItems: "start", marginBottom: 24 }}>
        {stages.map((st, idx) => {
          const max = Math.max(1, ...st.items.map((i) => i.records.length));
          return (
            <Card key={st.key} style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "18px 20px 16px", borderBottom: `1px solid ${COLORS.line}`, background: COLORS.mint }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 26, background: COLORS.blue, color: "#fff", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{idx + 1}</span>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: COLORS.ink }}>{st.title}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 12 }}>
                  <div><span style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink }}>{st.total}</span> <span style={{ fontSize: 13, color: COLORS.inkSoft }}>total</span></div>
                  <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{st.rateLabel} <b style={{ color: COLORS.blueDeep, fontSize: 14 }}>{st.rate}%</b></div>
                </div>
              </div>
              <div style={{ padding: "8px 10px 12px" }}>
                {st.items.map((it) => {
                  const n = it.records.length;
                  const on = sel && sel.stage === st.key && sel.label === it.label;
                  const accent = (TONE_MAP[it.tone] || TONE_MAP.slate)[2];
                  return (
                    <button
                      key={it.label}
                      onClick={() => setSel(on ? null : { stage: st.key, label: it.label })}
                      aria-pressed={on}
                      style={{ display: "block", width: "100%", textAlign: "left", fontFamily: "inherit", border: "none", cursor: "pointer", borderRadius: 9, padding: "9px 10px", marginTop: 2, background: on ? COLORS.bluePale : "transparent", opacity: it.muted && !n ? 0.55 : 1 }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, color: n ? COLORS.ink : COLORS.slate }}>
                        <span style={{ fontStyle: it.muted ? "italic" : "normal" }}>{it.label}</span>
                        <b style={{ color: n ? COLORS.ink : COLORS.slate }}>{n}</b>
                      </div>
                      <div style={{ height: 5, borderRadius: 5, background: COLORS.line, marginTop: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(n / max) * 100}%`, background: accent, borderRadius: 5 }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `1px solid ${COLORS.line}`, gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.ink }}>{selected ? selected.label : "Select a status above"}</div>
          {selected && <Btn kind="link" small onClick={() => onNavigate(moduleFor[sel.stage])}>Manage in {stages.find((s) => s.key === sel.stage).title}</Btn>}
        </div>
        {!selected && <div style={{ padding: "22px 24px", fontSize: 13.5, color: COLORS.inkSoft }}>Pick any status in the four stages to list the patients or leads in it.</div>}
        {selected && selected.records.length === 0 && <div style={{ padding: "22px 24px", fontSize: 13.5, color: COLORS.inkSoft }}>Nobody is in this status right now.</div>}
        {selected && selected.records.map((r, i) => (
          <div key={r.id} className="row-hover" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 24px", borderTop: i ? `1px solid ${COLORS.line}` : "none", gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink }}>{r.name}</div>
              <div style={{ fontSize: 12.5, color: COLORS.slate }}>{r.sub}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Badge tone={selected.tone} dot>{selected.label}</Badge>
              {r.patientId && <Btn kind="link" small onClick={() => onOpenPatient(r.patientId)}>View patient</Btn>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
