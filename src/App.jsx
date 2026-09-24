import React, { useState, useMemo, useRef, useEffect } from "react";
import { LayoutDashboard, UserPlus, Users, CalendarCheck, PhoneCall, MessageCircle, Receipt, BarChart3, Upload, Activity, Workflow, HeartHandshake, ChevronLeft, ChevronRight, Search, Bell, UserRound } from "lucide-react";
import { COLORS, FONT_SANS, GLOBAL_FONT_IMPORT } from "./theme.js";
import { useCrmData } from "./hooks/useCrmData.js";
import { todayISO } from "./data.js";

import Dashboard from "./views/Dashboard.jsx";
import Leads from "./views/Leads.jsx";
import Patients from "./views/Patients.jsx";
import Appointments from "./views/Appointments.jsx";
import Followups from "./views/Followups.jsx";
import Communication from "./views/Communication.jsx";
import Billing from "./views/Billing.jsx";
import Reports from "./views/Reports.jsx";
import LeadImport from "./views/LeadImport.jsx";
import Pipeline from "./views/Pipeline.jsx";
import Counselling from "./views/Counselling.jsx";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "reports", label: "Analytics", icon: BarChart3 },
  { key: "pipeline", label: "Conversion", icon: Workflow },
  { key: "leads", label: "Leads", icon: UserPlus },
  { key: "import", label: "Import leads", icon: Upload },
  { key: "patients", label: "Patients", icon: Users },
  { key: "appointments", label: "Appointments", icon: CalendarCheck },
  { key: "counselling", label: "Counselling", icon: HeartHandshake },
  { key: "followups", label: "Follow-ups", icon: PhoneCall },
  { key: "billing", label: "Billing", icon: Receipt },
  { key: "communication", label: "Communication", icon: MessageCircle },
];

const GLOBAL_CSS = `
  ${GLOBAL_FONT_IMPORT}
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ${FONT_SANS}; color: ${COLORS.ink}; -webkit-font-smoothing: antialiased; }
  option { color: ${COLORS.ink}; }
  ::selection { background: ${COLORS.bluePale}; }
  .field:focus { border-color: ${COLORS.blue} !important; box-shadow: 0 0 0 3px ${COLORS.bluePale}; }
  button:focus-visible, .nav-item:focus-visible, .icon-btn:focus-visible, [tabindex]:focus-visible { outline: 2px solid ${COLORS.blue}; outline-offset: 2px; }
  .btn-primary:hover { background: ${COLORS.blueDeep} !important; }
  .btn-ghost:hover { border-color: ${COLORS.blue} !important; }
  .btn-link:hover { background: ${COLORS.bluePale} !important; }
  .nav-item:hover { background: rgba(255,255,255,0.05); }
  .row-hover:hover { background: ${COLORS.mint}; }
  .search-result:hover { background: ${COLORS.mint}; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
  @media print { aside, header.topbar { display: none !important; } }
`;

function TopBar({ data, onNavigate, onOpenPatient, dueCount }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const patients = data.patients
      .filter((p) => [p.name, p.mobile, p.doctor, p.email].some((v) => String(v || "").toLowerCase().includes(term)))
      .slice(0, 5)
      .map((p) => ({ kind: "Patient", id: p.id, title: p.name, sub: [p.doctor, p.department].filter(Boolean).join(", ") }));
    const leads = data.leads
      .filter((l) => [l.name, l.mobile, l.doctor].some((v) => String(v || "").toLowerCase().includes(term)))
      .slice(0, 3)
      .map((l) => ({ kind: "Lead", id: l.id, title: l.name, sub: l.stage }));
    const doctors = [...new Set(data.patients.map((p) => p.doctor).filter(Boolean))]
      .filter((d) => d.toLowerCase().includes(term))
      .slice(0, 3)
      .map((d) => ({ kind: "Doctor", id: d, title: d, sub: `${data.patients.filter((p) => p.doctor === d).length} patients` }));
    return [...patients, ...leads, ...doctors];
  }, [q, data]);

  const pick = (r) => {
    setOpen(false);
    setQ("");
    if (r.kind === "Patient") onOpenPatient(r.id);
    else if (r.kind === "Lead") onNavigate("leads");
    else onNavigate("patients");
  };

  return (
    <header className="topbar" style={{ height: 76, background: "#fff", borderBottom: `1px solid ${COLORS.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", gap: 16, position: "sticky", top: 0, zIndex: 20 }}>
      <div ref={boxRef} style={{ position: "relative", width: "100%", maxWidth: 400 }}>
        <Search size={17} color={COLORS.inkSoft} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          className="field"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" && results[0]) pick(results[0]); if (e.key === "Escape") setOpen(false); }}
          placeholder="Search patients, doctors…"
          aria-label="Search patients, doctors"
          style={{ width: "100%", height: 46, padding: "0 14px 0 42px", borderRadius: 10, border: `1px solid ${COLORS.line}`, background: COLORS.cream, fontSize: 14, fontFamily: FONT_SANS, color: COLORS.ink, outline: "none" }}
        />
        {open && q.trim() && (
          <div style={{ position: "absolute", top: 52, left: 0, right: 0, background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 12, boxShadow: "0 14px 34px rgba(16,38,46,0.12)", padding: 6, zIndex: 30 }}>
            {results.length === 0 && <div style={{ padding: "12px 12px", fontSize: 13, color: COLORS.slate }}>No patients, leads or doctors match "{q}".</div>}
            {results.map((r) => (
              <div key={r.kind + r.id} className="search-result" onClick={() => pick(r)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 8, cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>{r.title}</div>
                  {r.sub && <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{r.sub}</div>}
                </div>
                <span style={{ fontSize: 11.5, color: COLORS.slate }}>{r.kind}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button className="icon-btn" onClick={() => onNavigate("followups")} title={dueCount ? `${dueCount} follow-ups due` : "No follow-ups due"} aria-label="Follow-ups due" style={{ position: "relative", border: "none", background: "transparent", cursor: "pointer", padding: 8, borderRadius: 10, color: COLORS.inkSoft }}>
          <Bell size={21} />
          {dueCount > 0 && <span style={{ position: "absolute", top: 6, right: 7, width: 9, height: 9, borderRadius: 9, background: COLORS.red, border: "2px solid #fff" }} />}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 11, background: COLORS.cream, borderRadius: 12, padding: "8px 16px 8px 9px" }}>
          <div style={{ width: 38, height: 38, borderRadius: 38, background: COLORS.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserRound size={18} color="#fff" />
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>Front Desk</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ view, setView, collapsed, setCollapsed }) {
  return (
    <aside style={{ width: collapsed ? 78 : 272, flexShrink: 0, background: COLORS.navy, color: COLORS.navyText, position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", transition: "width .2s ease" }}>
      <div style={{ height: 76, display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "0 19px" : "0 20px", borderBottom: `1px solid ${COLORS.navyLine}` }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: COLORS.blue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Activity size={21} color="#fff" strokeWidth={2.2} />
        </div>
        {!collapsed && (
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", letterSpacing: -0.2 }}>Select Care</div>
            <div style={{ fontSize: 11, color: COLORS.navyText, letterSpacing: 0.6, marginTop: 2 }}>HOSPITAL CRM</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "18px 14px" }}>
        {NAV.map((n) => {
          const active = view === n.key;
          const Icon = n.icon;
          return (
            <div
              key={n.key}
              className="nav-item"
              role="button"
              tabIndex={0}
              title={collapsed ? n.label : undefined}
              onClick={() => setView(n.key)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setView(n.key)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 13,
                padding: "12px 14px",
                borderRadius: 10,
                fontSize: 15,
                cursor: "pointer",
                marginBottom: 4,
                fontWeight: active ? 600 : 500,
                color: active ? "#3FD0BD" : COLORS.navyText,
                background: active ? COLORS.navyActive : undefined,
              }}
            >
              <Icon size={20} strokeWidth={1.9} style={{ flexShrink: 0 }} />
              {!collapsed && n.label}
            </div>
          );
        })}
      </nav>

      <div style={{ borderTop: `1px solid ${COLORS.navyLine}`, padding: "12px 14px" }}>
        <div className="nav-item" role="button" tabIndex={0} onClick={() => setCollapsed(!collapsed)} onKeyDown={(e) => e.key === "Enter" && setCollapsed(!collapsed)} style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontSize: 14.5, color: COLORS.navyText }}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && "Collapse"}
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [data, setData, status] = useCrmData();
  const [view, setView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [focusPatientId, setFocusPatientId] = useState(null);
  const [apptTab, setApptTab] = useState("opd");

  if (status !== "ready" || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.inkSoft, fontFamily: FONT_SANS, background: COLORS.cream }}>
        Loading patient records…
      </div>
    );
  }

  const today = todayISO();
  const dueCount = data.followups.filter((f) => !f.done && f.dueDate <= today).length;
  // "surgery" now lives as a tab inside Appointments.
  const go = (v) => {
    setFocusPatientId(null);
    if (v === "surgery") { setApptTab("surgery"); setView("appointments"); return; }
    if (v === "appointments") setApptTab("opd");
    setView(v);
  };
  const openPatient = (id) => { setFocusPatientId(id); setView("patients"); };

  return (
    <div style={{ fontFamily: FONT_SANS, background: COLORS.cream, minHeight: "100vh", display: "flex" }}>
      <style>{GLOBAL_CSS}</style>
      <Sidebar view={view} setView={go} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <TopBar data={data} onNavigate={go} onOpenPatient={openPatient} dueCount={dueCount} />
        <main style={{ padding: "32px 30px 48px" }}>
          {view === "dashboard" && <Dashboard data={data} onNavigate={go} />}
          {view === "pipeline" && <Pipeline data={data} onOpenPatient={openPatient} onNavigate={go} />}
          {view === "counselling" && <Counselling data={data} setData={setData} onOpenPatient={openPatient} />}
          {view === "leads" && <Leads data={data} setData={setData} onOpenPatient={openPatient} />}
          {view === "import" && <LeadImport data={data} setData={setData} />}
          {view === "patients" && <Patients key={focusPatientId || "list"} data={data} setData={setData} initialOpenId={focusPatientId} />}
          {view === "appointments" && <Appointments key={apptTab} data={data} setData={setData} onOpenPatient={openPatient} initialTab={apptTab} />}
          {view === "followups" && <Followups data={data} setData={setData} onOpenPatient={openPatient} />}
          {view === "communication" && <Communication data={data} setData={setData} />}
          {view === "billing" && <Billing data={data} setData={setData} />}
          {view === "reports" && <Reports data={data} />}
        </main>
      </div>
    </div>
  );
}
