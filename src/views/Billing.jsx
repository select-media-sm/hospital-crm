import React, { useState } from "react";
import { Receipt, Plus, Download, CheckCircle2 } from "lucide-react";
import { COLORS } from "../theme.js";
import { uid, todayISO, fmtDate, fmtINR, nextInvoiceNo } from "../data.js";
import { consultTotal, consultPaid, consultOutstanding, surgeryTotal, surgeryPaid, surgeryOutstanding, billStatusOf } from "../lib/finance.js";
import { billTone } from "../lib/tones.js";
import { downloadConsultInvoicePDF, downloadSurgeryInvoicePDF } from "../lib/pdf.js";
import { Card, Btn, Badge, Input, Select, Field, AddPanel, SectionTitle } from "../components/ui.jsx";

const emptyConsult = { patientId: "", doctor: "", consultationFee: 800, followupFee: 0, procedureFee: 0, discount: 0, mode: "Cash", status: "Paid", amountPaid: 0 };
const emptySurgery = { patientId: "", surgeryType: "", surgeonFee: 0, assistantFee: 0, anaesthetistFee: 0, otCharges: 0, roomCharges: 0, implantCharges: 0, procedureCharges: 0, otherCharges: 0, discount: 0, amountPaid: 0, mode: "Cash" };

export default function Billing({ data, setData }) {
  const [tab, setTab] = useState("consult");
  const [showAddConsult, setShowAddConsult] = useState(false);
  const [showAddSurgery, setShowAddSurgery] = useState(false);
  const [cForm, setCForm] = useState(emptyConsult);
  const [sForm, setSForm] = useState(emptySurgery);

  const patientById = (id) => data.patients.find((p) => p.id === id);

  const addConsultBill = () => {
    const patient = patientById(cForm.patientId);
    if (!patient) return;
    const bill = { id: uid(), invoiceNo: nextInvoiceNo(), patientId: patient.id, patientName: patient.name, doctor: cForm.doctor || patient.doctor || "Unassigned", consultationFee: Number(cForm.consultationFee) || 0, followupFee: Number(cForm.followupFee) || 0, procedureFee: Number(cForm.procedureFee) || 0, discount: Number(cForm.discount) || 0, mode: cForm.mode, status: cForm.status, amountPaid: Number(cForm.amountPaid) || 0, date: todayISO() };
    setData((d) => ({ ...d, consultBills: [bill, ...(d.consultBills || [])] }));
    setCForm(emptyConsult);
    setShowAddConsult(false);
  };
  const addSurgeryBill = () => {
    const patient = patientById(sForm.patientId);
    if (!patient) return;
    const bill = { id: uid(), invoiceNo: nextInvoiceNo(), patientId: patient.id, patientName: patient.name, surgeryType: sForm.surgeryType || "Surgery", surgeonFee: Number(sForm.surgeonFee) || 0, assistantFee: Number(sForm.assistantFee) || 0, anaesthetistFee: Number(sForm.anaesthetistFee) || 0, otCharges: Number(sForm.otCharges) || 0, roomCharges: Number(sForm.roomCharges) || 0, implantCharges: Number(sForm.implantCharges) || 0, procedureCharges: Number(sForm.procedureCharges) || 0, otherCharges: Number(sForm.otherCharges) || 0, discount: Number(sForm.discount) || 0, amountPaid: Number(sForm.amountPaid) || 0, mode: sForm.mode, date: todayISO() };
    setData((d) => ({ ...d, surgeryBills: [bill, ...(d.surgeryBills || [])] }));
    setSForm(emptySurgery);
    setShowAddSurgery(false);
  };

  const markConsultPaid = (id) => setData((d) => ({ ...d, consultBills: d.consultBills.map((b) => (b.id === id ? { ...b, status: "Paid" } : b)) }));
  const markSurgeryPaid = (id) => setData((d) => ({ ...d, surgeryBills: d.surgeryBills.map((b) => (b.id === id ? { ...b, amountPaid: surgeryTotal(b) } : b)) }));

  const consultBills = data.consultBills || [];
  const surgeryBills = data.surgeryBills || [];

  return (
    <div>
      <SectionTitle
        title="Billing"
        icon={Receipt}
        subtitle="Consultation fees and surgery charges, with invoices and receipts"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind={tab === "consult" ? "primary" : "ghost"} small onClick={() => setTab("consult")}>Consultation</Btn>
            <Btn kind={tab === "surgery" ? "primary" : "ghost"} small onClick={() => setTab("surgery")}>Surgery</Btn>
          </div>
        }
      />

      {tab === "consult" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Btn kind="primary" icon={Plus} onClick={() => setShowAddConsult((s) => !s)}>New consultation invoice</Btn>
          </div>
          {showAddConsult && (
            <AddPanel>
              <Field label="Patient"><Select value={cForm.patientId} onChange={(e) => { const p = patientById(e.target.value); setCForm({ ...cForm, patientId: e.target.value, doctor: p?.doctor || "" }); }}><option value="">Select patient</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
              <Field label="Doctor"><Input value={cForm.doctor} onChange={(e) => setCForm({ ...cForm, doctor: e.target.value })} placeholder="Dr. name" /></Field>
              <Field label="Consultation fee"><Input type="number" value={cForm.consultationFee} onChange={(e) => setCForm({ ...cForm, consultationFee: e.target.value })} /></Field>
              <Field label="Follow-up fee"><Input type="number" value={cForm.followupFee} onChange={(e) => setCForm({ ...cForm, followupFee: e.target.value })} /></Field>
              <Field label="Procedure fee"><Input type="number" value={cForm.procedureFee} onChange={(e) => setCForm({ ...cForm, procedureFee: e.target.value })} /></Field>
              <Field label="Discount"><Input type="number" value={cForm.discount} onChange={(e) => setCForm({ ...cForm, discount: e.target.value })} /></Field>
              <Field label="Payment mode"><Select value={cForm.mode} onChange={(e) => setCForm({ ...cForm, mode: e.target.value })}>{["Cash", "Card", "UPI", "Insurance"].map((m) => <option key={m}>{m}</option>)}</Select></Field>
              <Field label="Status"><Select value={cForm.status} onChange={(e) => setCForm({ ...cForm, status: e.target.value })}>{["Paid", "Partial", "Unpaid"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
              {cForm.status === "Partial" && <Field label="Amount paid now"><Input type="number" value={cForm.amountPaid} onChange={(e) => setCForm({ ...cForm, amountPaid: e.target.value })} /></Field>}
              <Btn kind="primary" onClick={addConsultBill}>Save invoice</Btn>
            </AddPanel>
          )}
          <Card style={{ padding: 0, overflow: "hidden" }}><div style={{ overflowX: "auto" }}><div style={{ minWidth: 920 }}>
            {consultBills.map((b, i) => {
              const total = consultTotal(b), paid = consultPaid(b), outstanding = consultOutstanding(b);
              return (
                <div key={b.id} style={{ display: "grid", gridTemplateColumns: "110px minmax(160px,1.3fr) 160px 110px 130px 90px 120px 80px", gap: 10, alignItems: "center", padding: "13px 20px", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
                  <div style={{ fontSize: 12, color: COLORS.slate }}>{b.invoiceNo}</div>
                  <div><div style={{ fontSize: 13, color: COLORS.ink, fontWeight: 500 }}>{b.patientName}</div><div style={{ fontSize: 11.5, color: COLORS.slate }}>{b.doctor}</div></div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{fmtDate(b.date)} · {b.mode}</div>
                  <div style={{ fontSize: 13, color: COLORS.ink, fontWeight: 600 }}>{fmtINR(total)}</div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Paid {fmtINR(paid)}</div>
                  <Badge tone={billTone(b.status)}>{b.status}</Badge>
                  {b.status !== "Paid" ? <Btn small icon={CheckCircle2} onClick={() => markConsultPaid(b.id)}>Mark paid</Btn> : <span />}
                  <Btn small icon={Download} onClick={() => downloadConsultInvoicePDF(b, patientById(b.patientId), total, paid, outstanding)}>PDF</Btn>
                </div>
              );
            })}
            {consultBills.length === 0 && <div style={{ padding: 22, fontSize: 13, color: COLORS.slate }}>No consultation invoices yet.</div>}
          </div></div></Card>
        </div>
      )}

      {tab === "surgery" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Btn kind="primary" icon={Plus} onClick={() => setShowAddSurgery((s) => !s)}>New surgery invoice</Btn>
          </div>
          {showAddSurgery && (
            <AddPanel>
              <Field label="Patient"><Select value={sForm.patientId} onChange={(e) => setSForm({ ...sForm, patientId: e.target.value })}><option value="">Select patient</option>{data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
              <Field label="Surgery type"><Input value={sForm.surgeryType} onChange={(e) => setSForm({ ...sForm, surgeryType: e.target.value })} placeholder="e.g. TKR" /></Field>
              <Field label="Surgeon fee"><Input type="number" value={sForm.surgeonFee} onChange={(e) => setSForm({ ...sForm, surgeonFee: e.target.value })} /></Field>
              <Field label="Assistant fee"><Input type="number" value={sForm.assistantFee} onChange={(e) => setSForm({ ...sForm, assistantFee: e.target.value })} /></Field>
              <Field label="Anaesthetist fee"><Input type="number" value={sForm.anaesthetistFee} onChange={(e) => setSForm({ ...sForm, anaesthetistFee: e.target.value })} /></Field>
              <Field label="OT charges"><Input type="number" value={sForm.otCharges} onChange={(e) => setSForm({ ...sForm, otCharges: e.target.value })} /></Field>
              <Field label="Room charges"><Input type="number" value={sForm.roomCharges} onChange={(e) => setSForm({ ...sForm, roomCharges: e.target.value })} /></Field>
              <Field label="Implant charges"><Input type="number" value={sForm.implantCharges} onChange={(e) => setSForm({ ...sForm, implantCharges: e.target.value })} /></Field>
              <Field label="Procedure charges"><Input type="number" value={sForm.procedureCharges} onChange={(e) => setSForm({ ...sForm, procedureCharges: e.target.value })} /></Field>
              <Field label="Other charges"><Input type="number" value={sForm.otherCharges} onChange={(e) => setSForm({ ...sForm, otherCharges: e.target.value })} /></Field>
              <Field label="Discount"><Input type="number" value={sForm.discount} onChange={(e) => setSForm({ ...sForm, discount: e.target.value })} /></Field>
              <Field label="Amount paid"><Input type="number" value={sForm.amountPaid} onChange={(e) => setSForm({ ...sForm, amountPaid: e.target.value })} /></Field>
              <Field label="Payment mode"><Select value={sForm.mode} onChange={(e) => setSForm({ ...sForm, mode: e.target.value })}>{["Cash", "Card", "UPI", "Insurance"].map((m) => <option key={m}>{m}</option>)}</Select></Field>
              <Btn kind="primary" onClick={addSurgeryBill}>Save invoice</Btn>
            </AddPanel>
          )}
          <Card style={{ padding: 0, overflow: "hidden" }}><div style={{ overflowX: "auto" }}><div style={{ minWidth: 920 }}>
            {surgeryBills.map((b, i) => {
              const total = surgeryTotal(b), paid = surgeryPaid(b), outstanding = surgeryOutstanding(b), status = billStatusOf(total, paid);
              return (
                <div key={b.id} style={{ display: "grid", gridTemplateColumns: "110px minmax(160px,1.3fr) 160px 110px 130px 90px 120px 80px", gap: 10, alignItems: "center", padding: "13px 20px", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
                  <div style={{ fontSize: 12, color: COLORS.slate }}>{b.invoiceNo}</div>
                  <div><div style={{ fontSize: 13, color: COLORS.ink, fontWeight: 500 }}>{b.patientName}</div><div style={{ fontSize: 11.5, color: COLORS.slate }}>{b.surgeryType}</div></div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{fmtDate(b.date)}</div>
                  <div style={{ fontSize: 13, color: COLORS.ink, fontWeight: 600 }}>{fmtINR(total)}</div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Paid {fmtINR(paid)}</div>
                  <Badge tone={billTone(status)}>{status}</Badge>
                  {status !== "Paid" && <Btn small icon={CheckCircle2} onClick={() => markSurgeryPaid(b.id)}>Mark paid</Btn>}
                  <Btn small icon={Download} onClick={() => downloadSurgeryInvoicePDF(b, patientById(b.patientId), total, paid, outstanding)}>PDF</Btn>
                </div>
              );
            })}
            {surgeryBills.length === 0 && <div style={{ padding: 22, fontSize: 13, color: COLORS.slate }}>No surgery invoices yet.</div>}
          </div></div></Card>
        </div>
      )}
    </div>
  );
}
