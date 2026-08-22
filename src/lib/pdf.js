import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate, fmtINR } from "../data.js";

const HOSPITAL_NAME = "Select Care Hospital";
const HOSPITAL_SUB = "Multi-speciality Clinic, Pune";

function header(doc, title) {
  doc.setFillColor(59, 128, 116);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(HOSPITAL_NAME, 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(HOSPITAL_SUB, 14, 19);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 196, 15, { align: "right" });
  doc.setTextColor(30, 30, 30);
}

export function downloadConsultInvoicePDF(bill, patient, total, paid, outstanding) {
  const doc = new jsPDF();
  header(doc, "INVOICE");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: ${bill.invoiceNo}`, 14, 36);
  doc.text(`Date: ${fmtDate(bill.date)}`, 14, 42);
  doc.text(`Patient: ${bill.patientName}`, 120, 36);
  doc.text(`Doctor: ${bill.doctor || "—"}`, 120, 42);
  if (patient) {
    doc.text(`Mobile: ${patient.mobile || "—"}`, 14, 48);
    doc.text(`Age/Gender: ${patient.age || "—"} / ${patient.gender || "—"}`, 120, 48);
  }

  autoTable(doc, {
    startY: 56,
    head: [["Item", "Amount"]],
    body: [
      ["Consultation fee", fmtINR(bill.consultationFee)],
      ["Follow-up fee", fmtINR(bill.followupFee)],
      ["Procedure fee", fmtINR(bill.procedureFee)],
      ["Discount", "- " + fmtINR(bill.discount)],
    ],
    theme: "grid",
    headStyles: { fillColor: [95, 160, 201] },
    styles: { fontSize: 10 },
  });

  const y = doc.lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${fmtINR(total)}`, 196, y, { align: "right" });
  doc.text(`Paid: ${fmtINR(paid)}`, 196, y + 6, { align: "right" });
  doc.setTextColor(outstanding > 0 ? 192 : 40, outstanding > 0 ? 104 : 120, outstanding > 0 ? 90 : 40);
  doc.text(`Outstanding: ${fmtINR(outstanding)}`, 196, y + 12, { align: "right" });
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.text(`Payment mode: ${bill.mode || "—"}    Status: ${bill.status}`, 14, y + 6);

  doc.setFontSize(8.5);
  doc.setTextColor(140, 140, 140);
  doc.text("This is a system-generated invoice.", 14, 285);

  doc.save(`${bill.invoiceNo}-${bill.patientName.replace(/\s+/g, "_")}.pdf`);
}

export function downloadSurgeryInvoicePDF(bill, patient, total, paid, outstanding) {
  const doc = new jsPDF();
  header(doc, "SURGERY INVOICE");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: ${bill.invoiceNo}`, 14, 36);
  doc.text(`Date: ${fmtDate(bill.date)}`, 14, 42);
  doc.text(`Patient: ${bill.patientName}`, 120, 36);
  doc.text(`Surgery: ${bill.surgeryType || "—"}`, 120, 42);
  if (patient) {
    doc.text(`Mobile: ${patient.mobile || "—"}`, 14, 48);
    doc.text(`Age/Gender: ${patient.age || "—"} / ${patient.gender || "—"}`, 120, 48);
  }

  autoTable(doc, {
    startY: 56,
    head: [["Charge", "Amount"]],
    body: [
      ["Surgeon fee", fmtINR(bill.surgeonFee)],
      ["Assistant surgeon fee", fmtINR(bill.assistantFee)],
      ["Anaesthetist fee", fmtINR(bill.anaesthetistFee)],
      ["OT charges", fmtINR(bill.otCharges)],
      ["Room charges", fmtINR(bill.roomCharges)],
      ["Implant charges", fmtINR(bill.implantCharges)],
      ["Procedure charges", fmtINR(bill.procedureCharges)],
      ["Other charges", fmtINR(bill.otherCharges)],
      ["Discount", "- " + fmtINR(bill.discount)],
    ],
    theme: "grid",
    headStyles: { fillColor: [107, 174, 135] },
    styles: { fontSize: 10 },
  });

  const y = doc.lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${fmtINR(total)}`, 196, y, { align: "right" });
  doc.text(`Paid: ${fmtINR(paid)}`, 196, y + 6, { align: "right" });
  doc.setTextColor(outstanding > 0 ? 192 : 40, outstanding > 0 ? 104 : 120, outstanding > 0 ? 90 : 40);
  doc.text(`Outstanding: ${fmtINR(outstanding)}`, 196, y + 12, { align: "right" });
  doc.setTextColor(30, 30, 30);

  doc.setFontSize(8.5);
  doc.setTextColor(140, 140, 140);
  doc.text("This is a system-generated invoice.", 14, 285);

  doc.save(`${bill.invoiceNo}-${bill.patientName.replace(/\s+/g, "_")}.pdf`);
}

export function downloadReportPDF({ title, rangeLabel, summary, columns, rows, filename }) {
  const doc = new jsPDF();
  header(doc, "REPORT");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(rangeLabel, 14, 42);

  let y = 50;
  if (summary && summary.length) {
    doc.setFontSize(10);
    summary.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      doc.setFont("helvetica", "bold");
      doc.text(`${s.label}:`, 14 + col * 95, y + row * 7);
      doc.setFont("helvetica", "normal");
      doc.text(`${s.value}`, 45 + col * 95, y + row * 7);
    });
    y += Math.ceil(summary.length / 2) * 7 + 6;
  }

  autoTable(doc, {
    startY: y,
    head: [columns],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [59, 128, 116] },
    styles: { fontSize: 8.5 },
  });

  doc.save(filename || "report.pdf");
}
