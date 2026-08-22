import React, { useState } from "react";
import { Upload, FileUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { COLORS } from "../theme.js";
import { STAGES, uid, todayISO } from "../data.js";
import { readSpreadsheetFile } from "../lib/excel.js";
import { Card, Btn, Badge, Select, Field, SectionTitle } from "../components/ui.jsx";

const TARGET_FIELDS = ["name", "mobile", "source", "department", "doctor", "date", "status"];
const KEYWORDS = {
  name: ["name", "patient"],
  mobile: ["mobile", "phone", "contact", "number"],
  source: ["source", "channel", "platform"],
  department: ["department", "dept", "speciality", "specialty"],
  doctor: ["doctor", "dr", "physician"],
  date: ["date", "enquiry date", "created"],
  status: ["status", "stage"],
};

function guessMapping(headers) {
  const map = {};
  TARGET_FIELDS.forEach((field) => {
    const found = headers.find((h) => KEYWORDS[field].some((k) => h.toLowerCase().includes(k)));
    map[field] = found || "";
  });
  return map;
}

function normalizeMobile(m) {
  return String(m || "").replace(/\D/g, "").slice(-10);
}

export default function LeadImport({ data, setData }) {
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [imported, setImported] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setImported(null);
    try {
      const { headers: h, rows: r } = await readSpreadsheetFile(file);
      setHeaders(h);
      setRows(r);
      setMapping(guessMapping(h));
    } catch (err) {
      setHeaders([]);
      setRows([]);
    }
  };

  const existingMobiles = new Set([
    ...data.leads.map((l) => normalizeMobile(l.mobile)),
    ...data.patients.map((p) => normalizeMobile(p.mobile)),
  ]);

  const mappedRows = rows.map((r) => {
    const mobile = normalizeMobile(r[mapping.mobile]);
    const rawDate = mapping.date ? r[mapping.date] : "";
    const parsedDate = rawDate && !isNaN(new Date(rawDate)) ? new Date(rawDate).toISOString().slice(0, 10) : "";
    return {
      name: r[mapping.name] || "",
      mobile,
      source: r[mapping.source] || "Import",
      department: r[mapping.department] || "",
      doctor: r[mapping.doctor] || "",
      status: r[mapping.status] || "",
      date: parsedDate,
      isDuplicate: mobile && existingMobiles.has(mobile),
      validMobile: /^[6-9]\d{9}$/.test(mobile),
    };
  });

  const newRows = mappedRows.filter((r) => r.name && !r.isDuplicate);
  const duplicateCount = mappedRows.filter((r) => r.isDuplicate).length;

  const doImport = () => {
    const seen = new Set();
    const leads = [];
    newRows.forEach((r) => {
      if (r.mobile && seen.has(r.mobile)) return;
      if (r.mobile) seen.add(r.mobile);
      const stage = STAGES.lead.includes(r.status) ? r.status : "New Lead";
      leads.push({ id: uid(), name: r.name, mobile: r.mobile, source: r.source || "Import", department: r.department, doctor: r.doctor, stage, createdAt: r.date || todayISO() });
    });
    setData((d) => ({ ...d, leads: [...leads, ...d.leads] }));
    setImported(leads.length);
    setRows([]);
    setHeaders([]);
    setFileName("");
  };

  return (
    <div>
      <SectionTitle title="Import leads" icon={Upload} subtitle="Bring in leads from Excel, CSV, Meta Ads, Google Ads, or your existing CRM export" />

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 11, background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.green})`, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
            <FileUp size={16} />
            Choose file
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />
          </label>
          <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{fileName || "No file selected — accepts .csv, .xlsx, .xls"}</div>
        </div>
        {imported !== null && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, color: COLORS.greenDeep, fontSize: 13.5, fontWeight: 500 }}>
            <CheckCircle2 size={16} /> Imported {imported} new lead{imported === 1 ? "" : "s"}.
          </div>
        )}
      </Card>

      {headers.length > 0 && (
        <>
          <Card style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink, marginBottom: 14 }}>Map columns</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              {TARGET_FIELDS.map((field) => (
                <Field key={field} label={field.charAt(0).toUpperCase() + field.slice(1)}>
                  <Select value={mapping[field] || ""} onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}>
                    <option value="">Not mapped</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </Select>
                </Field>
              ))}
            </div>
          </Card>

          <Card style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>Preview ({rows.length} rows)</div>
              <div style={{ display: "flex", gap: 10, fontSize: 12.5 }}>
                <Badge tone="green">{newRows.length} new</Badge>
                {duplicateCount > 0 && <Badge tone="yellow">{duplicateCount} duplicate</Badge>}
              </div>
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {mappedRows.slice(0, 25).map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr auto", gap: 10, alignItems: "center", padding: "9px 0", borderTop: i ? `1px solid ${COLORS.line}` : "none", opacity: r.isDuplicate ? 0.55 : 1 }}>
                  <div style={{ fontSize: 13, color: COLORS.ink }}>{r.name || <span style={{ color: COLORS.red }}>Missing name</span>}</div>
                  <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{r.mobile || "—"}</div>
                  <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{r.source}</div>
                  <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{r.department || "—"}</div>
                  {r.isDuplicate ? (
                    <Badge tone="yellow">Duplicate</Badge>
                  ) : !r.validMobile && r.mobile ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: COLORS.red }}><AlertTriangle size={12} /> Check mobile</span>
                  ) : (
                    <Badge tone="blue">Ready</Badge>
                  )}
                </div>
              ))}
              {rows.length > 25 && <div style={{ fontSize: 12, color: COLORS.slate, paddingTop: 10 }}>+ {rows.length - 25} more rows</div>}
            </div>
          </Card>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn kind="primary" icon={Upload} onClick={doImport}>Import {newRows.length} lead{newRows.length === 1 ? "" : "s"}</Btn>
          </div>
        </>
      )}
    </div>
  );
}
