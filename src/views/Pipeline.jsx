import React, { useState, useMemo } from "react";
import { COLORS } from "../theme.js";
import { buildPipeline } from "../lib/pipeline.js";
import { conversionRates, dropOff, sourceWise, doctorWise } from "../lib/analytics.js";
import { todayISO, daysFromNow, fmtINR, monthRange } from "../data.js";
import { Select, TableHead, ProgressBar } from "../components/ui.jsx";
import { Download, FileSpreadsheet } from "lucide-react";
import { downloadReportPDF } from "../lib/pdf.js";
import { downloadWorkbook } from "../lib/excel.js";
import { Card, Btn, Badge, SectionTitle, TONE_MAP } from "../components/ui.jsx";

const SRC_T = "minmax(110px,1.3fr) 55px 55px 60px 65px 80px 80px";
const DOC_T = "minmax(140px,1.4fr) 90px 80px 110px 90px 110px 100px 95px 110px";
const PERIODS = {
  "All time": () => ["", ""],
  "This month": () => [monthRange(0)[0], todayISO()],
  "Last month": () => monthRange(-1),
  "Last 90 days": () => [daysFromNow(-90), todayISO()],
  "This year": () => [todayISO().slice(0, 4) + "-01-01", todayISO()],
};
const periodRange = (p) => PERIODS[p]();

export default function Pipeline({ data, onOpenPatient, onNavigate }) {
  const stages = useMemo(() => buildPipeline(data), [data]);
  const [sel, setSel] = useState(null); // { stage, label }
  const [period, setPeriod] = useState("All time");
  const [unit, setUnit] = useState("doctor");
  const [from, to] = periodRange(period);
  const rates = useMemo(() => conversionRates(data, from, to), [data, from, to]);
  const drops = useMemo(() => dropOff(data, from, to), [data, from, to]);
  const sources = useMemo(() => sourceWise(data, from, to), [data, from, to]);
  const doctors = useMemo(() => doctorWise(data, from, to, unit), [data, from, to, unit]);

  const selected = sel && stages.find((s) => s.key === sel.stage)?.items.find((i) => i.label === sel.label);
  const exportTables = () => [
    { title: "Conversion rates", columns: ["Stage", "Rate", "Converted", "Out of", "Meaning"], rows: rates.map((x) => [x.label, x.den ? x.pct + "%" : "—", x.num, x.den, x.hint]) },
    { title: "Where patients stand now", columns: ["Stage", "Status", "Count"], rows: stages.flatMap((st) => st.items.map((it) => [st.title, it.label, it.records.length])) },
    { title: "Drop-off analysis", columns: ["Stage", "Reason", "Count", "Share of drop-offs"], rows: drops.rows.map((x) => [x.stage, x.reason, x.count, x.stage === "Surgery (at risk)" ? "at risk" : x.share + "%"]) },
    { title: "Source-wise conversion", columns: ["Source", "Leads", "Converted", "OPD done", "Counselled", "Surgery booked", "Surgery done", "Lead→OPD %", "Lead→Surgery %"], rows: sources.map((x) => [x.source, x.leads, x.converted, x.opd, x.counselled, x.booked, x.done, x.leadOpdPct + "%", x.leadSurgPct + "%"]) },
    { title: unit === "doctor" ? "Doctor-wise performance" : "Unit-wise performance", columns: [unit === "doctor" ? "Doctor" : "Unit", "OPD booked", "OPD done", "Cancel / no-show", "Counselled", "Surgery booked", "Surgery done", "OPD→Couns. %", "Revenue"], rows: doctors.map((x) => [x.name, x.opdBooked, x.opdDone, x.dropped, x.counselled, x.booked, x.done, x.opdCounsPct + "%", fmtINR(x.revenue)]) },
  ];
  const fileBase = `conversion-analysis-${period.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${todayISO()}`;
  const exportPdf = () => downloadReportPDF({ title: "Conversion Analysis", rangeLabel: `Period: ${period}${from ? ` (${from} to ${to})` : ""}`, summary: rates.map((x) => ({ label: x.label, value: x.den ? `${x.pct}% (${x.num}/${x.den})` : "—" })), tables: exportTables(), filename: fileBase + ".pdf" });
  const exportXlsx = () => downloadWorkbook(fileBase + ".xlsx", exportTables().map((t) => ({ name: t.title, rows: [t.columns, ...t.rows] })));

  const moduleFor = { lead: "leads", opd: "appointments", couns: "counselling", surg: "surgery" };

  return (
    <div>
      <SectionTitle
        title="Conversion Analysis"
        subtitle="Where every patient stands in the journey, stage-to-stage conversion, drop-offs, and performance by source and doctor"
        action={
          <div className="no-print" style={{ display: "flex", gap: 8 }}>
            <Btn icon={FileSpreadsheet} onClick={exportXlsx}>Excel</Btn>
            <Btn kind="primary" icon={Download} onClick={exportPdf}>PDF</Btn>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(270px, 100%), 1fr))", gap: 20, alignItems: "start", marginBottom: 24 }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", margin: "40px 0 18px" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink }}>Analysis & conversion tracking</div>
          <div style={{ fontSize: 13.5, color: COLORS.inkSoft, marginTop: 4 }}>Each rate counts its starting group within the period (leads by date added, OPD by visit date, counselling by referral date, surgery cases by surgery date).</div>
        </div>
        <div style={{ width: 200 }}>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">{Object.keys(PERIODS).map((p) => <option key={p}>{p}</option>)}</Select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, calc(50% - 10px)), 1fr))", gap: 20, marginBottom: 24 }}>
        {rates.map((r, i) => (
          <Card key={r.key} style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.inkSoft }}>{r.label} %</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.ink, margin: "6px 0 10px", letterSpacing: -0.5 }}>{r.den ? `${r.pct}%` : "—"}</div>
            <ProgressBar value={r.pct} tone={["blue", "sky", "yellow", "green"][i]} />
            <div style={{ fontSize: 12.5, color: COLORS.slate, marginTop: 9 }}>{r.num} of {r.den}. {r.hint}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: 20, marginBottom: 24 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.ink }}>Cancellation / drop-off analysis</div>
            <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{drops.total} dropped</div>
          </div>
          {drops.rows.map((r) => (
            <div key={r.reason} style={{ display: "grid", gridTemplateColumns: "110px 1fr 40px", gap: 12, alignItems: "center", padding: "7px 0", opacity: r.count ? 1 : 0.5 }}>
              <span style={{ fontSize: 12, color: COLORS.slate }}>{r.stage}</span>
              <div>
                <div style={{ fontSize: 13, color: COLORS.ink, marginBottom: 5 }}>{r.reason}</div>
                <ProgressBar value={r.stage === "Surgery (at risk)" ? (drops.total ? (r.count / drops.total) * 100 : 0) : r.share} tone={r.stage === "Surgery (at risk)" ? "yellow" : "red"} />
              </div>
              <b style={{ fontSize: 14, color: COLORS.ink, textAlign: "right" }}>{r.count}</b>
            </div>
          ))}
        </Card>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "20px 22px 14px", fontSize: 16, fontWeight: 600, color: COLORS.ink }}>Source-wise conversion</div>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 560 }}>
              <TableHead columns={["Source", "Leads", "OPD", "Couns.", "Surgery", "Lead→OPD", "Lead→Surg."]} template={SRC_T} />
              {sources.map((r, i) => (
                <div key={r.source} className="row-hover" style={{ display: "grid", gridTemplateColumns: SRC_T, gap: 12, padding: "11px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none", fontSize: 13, color: COLORS.ink }}>
                  <div style={{ fontWeight: 500 }}>{r.source}</div><div>{r.leads}</div><div>{r.opd}</div><div>{r.counselled}</div><div>{r.booked}</div>
                  <div style={{ fontWeight: 600, color: COLORS.blueDeep }}>{r.leadOpdPct}%</div><div style={{ fontWeight: 600, color: COLORS.greenDeep }}>{r.leadSurgPct}%</div>
                </div>
              ))}
              {sources.length === 0 && <div style={{ padding: "18px 22px", fontSize: 13, color: COLORS.inkSoft }}>No leads in this period.</div>}
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 22px 14px", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.ink }}>{unit === "doctor" ? "Doctor-wise" : "Unit-wise"} performance</div>
          <div style={{ display: "inline-flex", background: COLORS.mint, borderRadius: 10, padding: 3 }}>
            {[["doctor", "By doctor"], ["department", "By unit / department"]].map(([k, l]) => (
              <button key={k} onClick={() => setUnit(k)} aria-pressed={unit === k} style={{ fontFamily: "inherit", border: "none", cursor: "pointer", padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: unit === k ? "#fff" : "transparent", color: unit === k ? COLORS.blueDeep : COLORS.inkSoft, boxShadow: unit === k ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            <TableHead columns={[unit === "doctor" ? "Doctor" : "Unit", "OPD booked", "OPD done", "Cancel / no-show", "Counselled", "Surgery booked", "Surgery done", "OPD→Couns.", "Revenue"]} template={DOC_T} />
            {doctors.map((r, i) => (
              <div key={r.name} className="row-hover" style={{ display: "grid", gridTemplateColumns: DOC_T, gap: 12, padding: "12px 22px", borderTop: i ? `1px solid ${COLORS.line}` : "none", fontSize: 13, color: COLORS.ink }}>
                <div style={{ fontWeight: 500 }}>{r.name}</div><div>{r.opdBooked}</div><div>{r.opdDone}</div><div style={{ color: r.dropped ? COLORS.red : COLORS.ink }}>{r.dropped}</div><div>{r.counselled}</div><div>{r.booked}</div><div>{r.done}</div>
                <div style={{ fontWeight: 600, color: COLORS.blueDeep }}>{r.opdCounsPct}%</div><div style={{ fontWeight: 600 }}>{fmtINR(r.revenue)}</div>
              </div>
            ))}
            {doctors.length === 0 && <div style={{ padding: "18px 22px", fontSize: 13, color: COLORS.inkSoft }}>No OPD visits or invoices in this period.</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}
