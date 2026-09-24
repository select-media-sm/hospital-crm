import React, { useState, useMemo } from "react";
import { Download, FileSpreadsheet, Printer, Sun, Stethoscope, HeartHandshake, Scissors, HeartPulse, Pill, IndianRupee, LayoutGrid } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { COLORS, CHART_COLORS } from "../theme.js";
import { todayISO, daysFromNow, fmtINR, monthRange } from "../data.js";
import { REPORTS, buildReport } from "../lib/reports.js";
import { downloadReportPDF } from "../lib/pdf.js";
import { downloadWorkbook } from "../lib/excel.js";
import { Card, Btn, Select, Field, Input, SectionTitle } from "../components/ui.jsx";
import { useIsMobile } from "../hooks/useMediaQuery.js";

const ICONS = { daily: Sun, opd: Stethoscope, counselling: HeartHandshake, ipd: Scissors, postop: HeartPulse, medphysio: Pill, revenue: IndianRupee, monthly: LayoutGrid };
const PRESETS = {
  "Today": () => [todayISO(), todayISO()],
  "Last 7 days": () => [daysFromNow(-6), todayISO()],
  "Last 30 days": () => [daysFromNow(-29), todayISO()],
  "This month": () => [monthRange(0)[0], todayISO()],
  "Last month": () => monthRange(-1),
  "Last 90 days": () => [daysFromNow(-89), todayISO()],
  "This year": () => [todayISO().slice(0, 4) + "-01-01", todayISO()],
};

const isMobileChart = () => typeof window !== "undefined" && window.innerWidth <= 600;

function ReportChart({ chart }) {
  if (!chart.data.length) return null;
  const fmt = (v) => (chart.money ? fmtINR(v) : chart.percent ? `${v}%` : v);
  const height = Math.max(140, chart.data.length * 34 + 30);
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: COLORS.ink, marginBottom: 10 }}>{chart.title}</div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chart.data} layout="vertical" margin={{ left: 4, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid stroke={COLORS.line} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} allowDecimals={false} domain={chart.percent ? [0, 100] : [0, "auto"]} tickFormatter={(v) => (chart.money ? `₹${v >= 1000 ? Math.round(v / 1000) + "k" : v}` : chart.percent ? `${v}%` : v)} />
          <YAxis type="category" dataKey="name" width={isMobileChart() ? 120 : 190} tick={{ fontSize: 11.5, fill: COLORS.ink }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12.5, borderRadius: 10, border: `1px solid ${COLORS.line}` }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
            {chart.data.map((_, i) => <Cell key={i} fill={chart.percent ? COLORS.blue : CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function ReportTable({ table }) {
  return (
    <Card style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>{table.title}</div>
        <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{table.rows.length} row{table.rows.length === 1 ? "" : "s"}</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: COLORS.mint }}>
              {table.columns.map((c) => <th key={c} style={{ textAlign: "left", padding: "11px 20px", fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, borderTop: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, whiteSpace: "nowrap" }}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i} className="row-hover">
                {r.map((c, j) => <td key={j} style={{ padding: "10px 20px", borderTop: i ? `1px solid ${COLORS.line}` : "none", color: j === 0 ? COLORS.ink : COLORS.inkSoft, fontWeight: j === 0 ? 500 : 400, verticalAlign: "top" }}>{c === "" || c === undefined ? "—" : c}</td>)}
              </tr>
            ))}
            {table.rows.length === 0 && <tr><td colSpan={table.columns.length} style={{ padding: "16px 20px", color: COLORS.slate }}>No records in this period.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function Reports({ data }) {
  const isMobile = useIsMobile();
  const [key, setKey] = useState("daily");
  const [preset, setPreset] = useState("Last 30 days");
  const [from, setFrom] = useState(PRESETS["Last 30 days"]()[0]);
  const [to, setTo] = useState(PRESETS["Last 30 days"]()[1]);
  const [day, setDay] = useState(todayISO());
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const meta = REPORTS.find((r) => r.key === key);

  const report = useMemo(() => buildReport(key, data, { from, to, day, month }), [key, data, from, to, day, month]);

  const applyPreset = (p) => { setPreset(p); if (PRESETS[p]) { const [f, t] = PRESETS[p](); setFrom(f); setTo(t); } };
  const fileBase = `${meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${key === "daily" ? day : key === "monthly" ? month : from + "-to-" + to}`;

  const exportPDF = () => downloadReportPDF({ title: report.title, rangeLabel: report.periodLabel, note: report.note, summary: report.summary, tables: report.tables, filename: fileBase + ".pdf" });
  const exportExcel = () =>
    downloadWorkbook(fileBase + ".xlsx", [
      { name: "Summary", rows: [[report.title], [report.periodLabel], [], ["Measure", "Value", ...(report.summary.some((s) => s.delta) ? ["Change"] : [])], ...report.summary.map((s) => [s.label, s.value, ...(s.delta ? [s.delta] : [])])] },
      ...report.tables.map((t) => ({ name: t.title, rows: [t.columns, ...t.rows] })),
    ]);

  return (
    <div>
      <SectionTitle
        title="Reports & MIS"
        subtitle="Operational reports and the monthly management dashboard, exportable to PDF and Excel"
        action={
          <div className="no-print" style={{ display: "flex", gap: 8 }}>
            <Btn icon={Printer} onClick={() => window.print()}>Print</Btn>
            <Btn icon={FileSpreadsheet} onClick={exportExcel}>Excel</Btn>
            <Btn kind="primary" icon={Download} onClick={exportPDF}>PDF</Btn>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(230px, 270px) 1fr", gap: isMobile ? 0 : 24, alignItems: "start" }} className="reports-layout">
        {isMobile ? (
          <Card className="no-print" style={{ marginBottom: 14 }}>
            <Field label="Report">
              <Select value={key} onChange={(e) => setKey(e.target.value)}>{REPORTS.map((r) => <option key={r.key} value={r.key}>{r.title}</option>)}</Select>
            </Field>
            <div style={{ fontSize: 12.5, color: COLORS.slate, marginTop: 8 }}>{meta.blurb}</div>
          </Card>
        ) : (
        <Card className="no-print" style={{ padding: 8, position: "sticky", top: 96 }}>
          {REPORTS.map((r) => {
            const Icon = ICONS[r.key];
            const on = r.key === key;
            return (
              <button key={r.key} onClick={() => setKey(r.key)} aria-pressed={on} style={{ display: "flex", gap: 11, alignItems: "flex-start", width: "100%", textAlign: "left", fontFamily: "inherit", border: "none", cursor: "pointer", borderRadius: 10, padding: "11px 12px", background: on ? COLORS.bluePale : "transparent" }}>
                <Icon size={18} color={on ? COLORS.blueDeep : COLORS.inkSoft} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: on ? COLORS.blueDeep : COLORS.ink }}>{r.title}</span>
                  <span style={{ display: "block", fontSize: 12, color: COLORS.slate, marginTop: 2, lineHeight: 1.35 }}>{r.blurb}</span>
                </span>
              </button>
            );
          })}
        </Card>
        )}

        <div style={{ minWidth: 0 }}>
          <Card className="no-print" style={{ marginBottom: 20, padding: "18px 22px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))", gap: 14, alignItems: "end" }}>
              {meta.mode === "day" && <Field label="Report date"><Input type="date" value={day} onChange={(e) => setDay(e.target.value)} /></Field>}
              {meta.mode === "month" && <Field label="Month"><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field>}
              {meta.mode === "range" && (
                <>
                  <Field label="Period">
                    <Select value={preset} onChange={(e) => applyPreset(e.target.value)}>
                      {Object.keys(PRESETS).map((p) => <option key={p}>{p}</option>)}
                      <option value="Custom">Custom</option>
                    </Select>
                  </Field>
                  <Field label="From"><Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("Custom"); }} /></Field>
                  <Field label="To"><Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset("Custom"); }} /></Field>
                </>
              )}
            </div>
          </Card>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink }}>{report.title}</div>
            <div style={{ fontSize: 13.5, color: COLORS.inkSoft, marginTop: 3 }}>{report.periodLabel}</div>
            {report.note && <div style={{ fontSize: 12.5, color: COLORS.slate, marginTop: 4 }}>{report.note}</div>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, calc(50% - 10px)), 1fr))", gap: 12, marginBottom: 20 }}>
            {report.summary.map((s) => (
              <div key={s.label} style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{s.label}</div>
                <div style={{ fontSize: 21, fontWeight: 700, color: COLORS.ink, marginTop: 4 }}>{s.value}</div>
                {s.delta && <div style={{ fontSize: 12, fontWeight: 600, marginTop: 3, color: s.delta.startsWith("-") ? COLORS.red : s.delta === "—" ? COLORS.slate : COLORS.greenDeep }}>{s.delta === "—" ? "No change" : s.delta === "New" ? "New this month" : s.delta} vs last month</div>}
              </div>
            ))}
          </div>

          {report.charts.some((c) => c.data.length) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))", gap: 20, marginBottom: 20 }}>
              {report.charts.map((c) => <ReportChart key={c.title} chart={c} />)}
            </div>
          )}

          {report.tables.map((t) => <ReportTable key={t.title} table={t} />)}
        </div>
      </div>
    </div>
  );
}
