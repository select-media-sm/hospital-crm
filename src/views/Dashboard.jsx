import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { CalendarCheck, Clock, Users, CheckCircle2, UserPlus, BellRing, Scissors, CalendarClock, IndianRupee, Stethoscope, Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import { COLORS, CHART_COLORS } from "../theme.js";
import { SURGERY_GROUPS, todayISO, daysFromNow, fmtINR } from "../data.js";
import { buildPipeline } from "../lib/pipeline.js";
import { unifiedInvoices } from "../lib/finance.js";
import { Card, StatCard, SectionTitle, ChartCard, Badge, ProgressBar } from "../components/ui.jsx";

function apptTone(status) {
  if (status === "Completed") return "green";
  if (status === "With Doctor") return "blue";
  if (status === "Waiting" || status === "Arrived") return "yellow";
  if (status === "No-show" || status === "Cancelled") return "red";
  return "slate";
}

export default function Dashboard({ data, onNavigate }) {
  const today = todayISO();
  const invoices = unifiedInvoices(data);

  const todaysAppts = data.appointments.filter((a) => a.date === today);
  const waiting = todaysAppts.filter((a) => a.status === "Waiting" || a.status === "Arrived").length;
  const completedToday = todaysAppts.filter((a) => a.status === "Completed").length;
  const newLeads = data.leads.filter((l) => l.stage === "New Lead").length;
  const followupsDue = data.followups.filter((f) => !f.done && f.dueDate <= today).length;
  const plannedSurgeries = data.surgeries.filter((s) => SURGERY_GROUPS.booked.includes(s.stage) || SURGERY_GROUPS.pending.includes(s.stage)).length;
  const upcomingSurgeries = data.surgeries.filter((s) => s.stage === "Booked – Confirmed Surgery Date" && s.date && s.date >= today).length;

  const surgeryRevenue = invoices.filter((i) => i.category === "Surgery").reduce((s, i) => s + i.total, 0);
  const consultRevenue = invoices.filter((i) => i.category === "Consultation").reduce((s, i) => s + i.total, 0);
  const pendingPayments = invoices.reduce((s, i) => s + i.outstanding, 0);
  const todaysCollection = invoices.filter((i) => i.date === today).reduce((s, i) => s + i.paid, 0);
  const monthKey = today.slice(0, 7);
  const monthlyRevenue = invoices.filter((i) => (i.date || "").slice(0, 7) === monthKey).reduce((s, i) => s + i.total, 0);

  const pipeline = buildPipeline(data);
  const [pLead, pOpd, pCouns, pSurg] = pipeline;
  const countOf = (stage, label) => stage.items.find((i) => i.label === label)?.records.length || 0;

  const revenueByDay = {};
  for (let i = 6; i >= 0; i--) revenueByDay[daysFromNow(-i)] = 0;
  invoices.forEach((inv) => { if (inv.date in revenueByDay) revenueByDay[inv.date] += inv.total; });
  const trendData = Object.entries(revenueByDay).map(([d, v]) => ({ day: new Date(d).toLocaleDateString("en-IN", { weekday: "short" }), revenue: v }));

  const splitData = [
    { name: "Consultation", value: consultRevenue },
    { name: "Surgery", value: surgeryRevenue },
  ];

  const funnelData = [
    { stage: "Leads", count: pLead.total },
    { stage: "Converted", count: countOf(pLead, "Converted") },
    { stage: "OPD completed", count: countOf(pOpd, "OPD Completed") },
    { stage: "Counselled", count: pCouns.total },
    { stage: "Surgery advised", count: countOf(pCouns, "Surgery Advised") },
    { stage: "Surgery booked", count: data.surgeries.filter((s) => SURGERY_GROUPS.booked.includes(s.stage) || SURGERY_GROUPS.done.includes(s.stage)).length },
  ];

  return (
    <div>
      <SectionTitle title="Overview" subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        <StatCard label="Today's OPD" value={todaysAppts.length} tone="blue" icon={CalendarCheck} />
        <StatCard label="Patients waiting" value={waiting} tone="yellow" icon={Clock} />
        <StatCard label="Completed consultations" value={completedToday} tone="green" icon={CheckCircle2} />
        <StatCard label="New leads" value={newLeads} tone="blue" icon={UserPlus} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        <StatCard label="Follow-ups due" value={followupsDue} tone={followupsDue ? "red" : "slate"} icon={BellRing} />
        <StatCard label="Surgeries planned" value={plannedSurgeries} tone="green" icon={Scissors} />
        <StatCard label="Upcoming surgeries" value={upcomingSurgeries} tone="blue" icon={CalendarClock} />
        <StatCard label="Pending payments" value={fmtINR(pendingPayments)} tone="red" icon={Wallet} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 26 }}>
        <StatCard label="Today's collection" value={fmtINR(todaysCollection)} tone="green" icon={IndianRupee} />
        <StatCard label="Monthly revenue" value={fmtINR(monthlyRevenue)} tone="blue" icon={TrendingUp} />
        <StatCard label="Surgery revenue" value={fmtINR(surgeryRevenue)} tone="green" icon={Scissors} />
        <StatCard label="Consultation revenue" value={fmtINR(consultRevenue)} tone="yellow" icon={Stethoscope} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCard title="Revenue trend, last 7 days">
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={trendData} margin={{ left: 0, right: 12, top: 6, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.line} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: COLORS.inkSoft }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <Tooltip formatter={(v) => fmtINR(v)} contentStyle={{ fontSize: 12.5, borderRadius: 10, border: `1px solid ${COLORS.line}` }} />
              <Line type="monotone" dataKey="revenue" stroke={COLORS.blue} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.blue }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Revenue split">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={splitData} dataKey="value" nameKey="name" innerRadius={44} outerRadius={68} paddingAngle={3}>
                {splitData.map((entry, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtINR(v)} contentStyle={{ fontSize: 12.5, borderRadius: 10, border: `1px solid ${COLORS.line}` }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
            {splitData.map((s, i) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.inkSoft }}>
                <span style={{ width: 8, height: 8, borderRadius: 8, background: CHART_COLORS[i % CHART_COLORS.length], display: "inline-block" }} />
                {s.name}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCard title="Patient journey" action={onNavigate && <span role="button" tabIndex={0} onClick={() => onNavigate("pipeline")} onKeyDown={(e) => e.key === "Enter" && onNavigate("pipeline")} style={{ fontSize: 13, color: COLORS.blue, fontWeight: 600, cursor: "pointer" }}>Open conversion</span>}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnelData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.line} vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={{ stroke: COLORS.line }} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} width={22} />
              <Tooltip contentStyle={{ fontSize: 12.5, borderRadius: 10, border: `1px solid ${COLORS.line}` }} />
              <Bar dataKey="count" fill={COLORS.green} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginBottom: 18 }}>Conversion</div>
          {pipeline.map((st, i) => (
            <div key={st.key} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 7 }}>
                <span>{st.title} ({st.rateLabel})</span><span style={{ fontWeight: 600, color: COLORS.ink }}>{st.rate}%</span>
              </div>
              <ProgressBar value={st.rate} tone={["blue", "sky", "yellow", "green"][i]} />
            </div>
          ))}
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 10 }}>OPD queue, today</div>
            {todaysAppts.length === 0 && <div style={{ fontSize: 12.5, color: COLORS.slate }}>No appointments today.</div>}
            {todaysAppts.slice(0, 4).map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: 12.5, color: COLORS.ink }}>{a.patientName}</span>
                <Badge tone={apptTone(a.status)}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
