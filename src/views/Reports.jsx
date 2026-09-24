import React, { useState, useMemo } from "react";
import { BarChart3, Download, FileSpreadsheet, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { COLORS, CHART_COLORS } from "../theme.js";
import { todayISO, daysFromNow, fmtDate, fmtINR } from "../data.js";
import { unifiedInvoices } from "../lib/finance.js";
import { downloadReportPDF } from "../lib/pdf.js";
import { downloadExcel } from "../lib/excel.js";
import { billTone } from "../lib/tones.js";
import { Card, Btn, Badge, Select, Field, SectionTitle, StatCard, ChartCard } from "../components/ui.jsx";

const PRESETS = {
  "Today": () => [todayISO(), todayISO()],
  "Last 15 days": () => [daysFromNow(-15), todayISO()],
  "This month": () => [todayISO().slice(0, 8) + "01", todayISO()],
  "This quarter": () => [daysFromNow(-90), todayISO()],
  "This year": () => [todayISO().slice(0, 4) + "-01-01", todayISO()],
};

export default function Reports({ data }) {
  const [preset, setPreset] = useState("Last 15 days");
  const [from, setFrom] = useState(PRESETS["Last 15 days"]()[0]);
  const [to, setTo] = useState(PRESETS["Last 15 days"]()[1]);
  const [category, setCategory] = useState("All");

  const applyPreset = (p) => {
    setPreset(p);
    if (PRESETS[p]) {
      const [f, t] = PRESETS[p]();
      setFrom(f);
      setTo(t);
    }
  };

  const invoices = useMemo(() => unifiedInvoices(data), [data]);
  const filtered = invoices.filter((i) => i.date >= from && i.date <= to && (category === "All" || i.category === category));

  const totalRevenue = filtered.reduce((s, i) => s + i.total, 0);
  const totalCollected = filtered.reduce((s, i) => s + i.paid, 0);
  const totalOutstanding = filtered.reduce((s, i) => s + i.outstanding, 0);

  const byDoctor = {};
  filtered.forEach((i) => { const k = i.doctor || "Unassigned"; byDoctor[k] = (byDoctor[k] || 0) + i.total; });
  const doctorData = Object.entries(byDoctor).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const byMode = {};
  filtered.forEach((i) => { const k = i.mode || "—"; byMode[k] = (byMode[k] || 0) + i.total; });
  const modeData = Object.entries(byMode).map(([name, value]) => ({ name, value }));

  const rangeLabel = `${fmtDate(from)} — ${fmtDate(to)}${category !== "All" ? " · " + category : ""}`;

  const exportPDF = () => {
    downloadReportPDF({
      title: "Revenue Report",
      rangeLabel,
      summary: [
        { label: "Total revenue", value: fmtINR(totalRevenue) },
        { label: "Collected", value: fmtINR(totalCollected) },
        { label: "Outstanding", value: fmtINR(totalOutstanding) },
        { label: "Invoices", value: filtered.length },
      ],
      columns: ["Invoice", "Patient", "Category", "Doctor", "Date", "Mode", "Total", "Paid", "Status"],
      rows: filtered.map((i) => [i.invoiceNo, i.patientName, i.category, i.doctor || "—", fmtDate(i.date), i.mode, fmtINR(i.total), fmtINR(i.paid), i.status]),
      filename: `revenue-report-${from}-to-${to}.pdf`,
    });
  };
  const exportExcel = () => {
    downloadExcel(
      `revenue-report-${from}-to-${to}.xlsx`,
      "Revenue",
      filtered.map((i) => ({ Invoice: i.invoiceNo, Patient: i.patientName, Category: i.category, Doctor: i.doctor || "—", Date: i.date, Mode: i.mode, Total: i.total, Paid: i.paid, Outstanding: i.outstanding, Status: i.status }))
    );
  };

  return (
    <div>
      <SectionTitle
        title="Reports"
        icon={BarChart3}
        subtitle="Revenue, by doctor, department, and payment mode"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn icon={Printer} small onClick={() => window.print()}>Print</Btn>
            <Btn icon={FileSpreadsheet} small onClick={exportExcel}>Excel</Btn>
            <Btn kind="primary" icon={Download} small onClick={exportPDF}>PDF</Btn>
          </div>
        }
      />

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, alignItems: "end" }}>
          <Field label="Quick range">
            <Select value={preset} onChange={(e) => applyPreset(e.target.value)}>
              {Object.keys(PRESETS).map((p) => <option key={p}>{p}</option>)}
              <option value="Custom">Custom</option>
            </Select>
          </Field>
          <Field label="From"><input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("Custom"); }} style={{ fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: `1px solid ${COLORS.line}`, background: COLORS.cream, width: "100%" }} /></Field>
          <Field label="To"><input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset("Custom"); }} style={{ fontSize: 13.5, padding: "9px 12px", borderRadius: 10, border: `1px solid ${COLORS.line}`, background: COLORS.cream, width: "100%" }} /></Field>
          <Field label="Category"><Select value={category} onChange={(e) => setCategory(e.target.value)}>{["All", "Consultation", "Surgery"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <StatCard label="Total revenue" value={fmtINR(totalRevenue)} tone="blue" />
        <StatCard label="Collected" value={fmtINR(totalCollected)} tone="green" />
        <StatCard label="Outstanding" value={fmtINR(totalOutstanding)} tone="red" />
        <StatCard label="Invoices" value={filtered.length} tone="yellow" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 18 }}>
        <ChartCard title="Revenue by doctor">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={doctorData} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid stroke={COLORS.line} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmtINR(v)} contentStyle={{ fontSize: 12.5, borderRadius: 10, border: `1px solid ${COLORS.line}` }} />
              <Bar dataKey="value" fill={COLORS.blue} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="By payment mode">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={modeData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={66} paddingAngle={3}>
                {modeData.map((entry, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtINR(v)} contentStyle={{ fontSize: 12.5, borderRadius: 10, border: `1px solid ${COLORS.line}` }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.2fr 0.9fr 1fr 0.9fr 0.8fr 0.8fr auto", gap: 10, padding: "12px 20px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 11.5, color: COLORS.slate, fontWeight: 600 }}>
          <div>Invoice</div><div>Patient</div><div>Category</div><div>Doctor</div><div>Date</div><div>Total</div><div>Paid</div><div>Status</div>
        </div>
        {filtered.map((i) => (
          <div key={i.category + i.id} style={{ display: "grid", gridTemplateColumns: "0.9fr 1.2fr 0.9fr 1fr 0.9fr 0.8fr 0.8fr auto", gap: 10, alignItems: "center", padding: "11px 20px", borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 12, color: COLORS.slate }}>{i.invoiceNo}</div>
            <div style={{ fontSize: 13, color: COLORS.ink }}>{i.patientName}</div>
            <Badge tone={i.category === "Surgery" ? "green" : "blue"}>{i.category}</Badge>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{i.doctor || "—"}</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{fmtDate(i.date)}</div>
            <div style={{ fontSize: 12.5, color: COLORS.ink, fontWeight: 600 }}>{fmtINR(i.total)}</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{fmtINR(i.paid)}</div>
            <Badge tone={billTone(i.status)}>{i.status}</Badge>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 22, fontSize: 13, color: COLORS.slate }}>No invoices in this range.</div>}
      </Card>
    </div>
  );
}
