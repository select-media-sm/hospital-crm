import React, { useState } from "react";
import { LayoutDashboard, UserPlus, Users, CalendarCheck, Scissors, BellRing, MessageCircle, Receipt, BarChart3, Upload, Sparkles } from "lucide-react";
import { COLORS, FONT_SERIF, FONT_SANS, GLOBAL_FONT_IMPORT } from "./theme.js";
import { useCrmData } from "./hooks/useCrmData.js";

import Dashboard from "./views/Dashboard.jsx";
import Leads from "./views/Leads.jsx";
import Patients from "./views/Patients.jsx";
import Appointments from "./views/Appointments.jsx";
import Surgery from "./views/Surgery.jsx";
import Followups from "./views/Followups.jsx";
import Communication from "./views/Communication.jsx";
import Billing from "./views/Billing.jsx";
import Reports from "./views/Reports.jsx";
import LeadImport from "./views/LeadImport.jsx";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "leads", label: "Leads", icon: UserPlus },
  { key: "import", label: "Import leads", icon: Upload },
  { key: "patients", label: "Patients", icon: Users },
  { key: "appointments", label: "Appointments", icon: CalendarCheck },
  { key: "surgery", label: "Surgery", icon: Scissors },
  { key: "followups", label: "Follow-ups", icon: BellRing },
  { key: "communication", label: "Communication", icon: MessageCircle },
  { key: "billing", label: "Billing", icon: Receipt },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

export default function App() {
  const [data, setData, status] = useCrmData();
  const [view, setView] = useState("dashboard");

  if (status !== "ready" || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.inkSoft, fontFamily: FONT_SANS, background: COLORS.cream }}>
        Loading patient records…
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT_SANS, background: COLORS.cream, minHeight: "100vh", display: "flex" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`
        ${GLOBAL_FONT_IMPORT}
        * { box-sizing: border-box; }
        option { color: ${COLORS.ink}; }
        ::selection { background: ${COLORS.bluePale}; }
        @media print {
          aside { display: none !important; }
        }
      `}</style>

      <aside style={{ width: 224, flexShrink: 0, borderRight: `1px solid ${COLORS.line}`, padding: "26px 14px", position: "sticky", top: 0, alignSelf: "flex-start", height: "100vh", overflowY: "auto", background: "linear-gradient(180deg, #FFFFFF, #FCFAF3)" }}>
        <div style={{ padding: "2px 10px", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.green})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={17} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 16.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.15 }}>Select Care</div>
            <div style={{ fontSize: 10.5, color: COLORS.slate, marginTop: 1, letterSpacing: 0.3 }}>HOSPITAL CRM</div>
          </div>
        </div>
        {NAV.map((n) => {
          const active = view === n.key;
          const Icon = n.icon;
          return (
            <div
              key={n.key}
              onClick={() => setView(n.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 13px",
                borderRadius: 11,
                fontSize: 13.5,
                cursor: "pointer",
                marginBottom: 3,
                fontWeight: active ? 600 : 500,
                color: active ? COLORS.blueDeep : COLORS.inkSoft,
                background: active ? COLORS.bluePale : "transparent",
                transition: "background .15s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F5F1E4"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={16} strokeWidth={2.1} />
              {n.label}
            </div>
          );
        })}
      </aside>

      <main style={{ flex: 1, padding: "32px 36px", maxWidth: 1220 }}>
        {view === "dashboard" && <Dashboard data={data} />}
        {view === "leads" && <Leads data={data} setData={setData} />}
        {view === "import" && <LeadImport data={data} setData={setData} />}
        {view === "patients" && <Patients data={data} setData={setData} />}
        {view === "appointments" && <Appointments data={data} setData={setData} />}
        {view === "surgery" && <Surgery data={data} setData={setData} />}
        {view === "followups" && <Followups data={data} setData={setData} />}
        {view === "communication" && <Communication data={data} setData={setData} />}
        {view === "billing" && <Billing data={data} setData={setData} />}
        {view === "reports" && <Reports data={data} />}
      </main>
    </div>
  );
}
