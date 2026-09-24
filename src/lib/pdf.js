import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate, fmtINR } from "../data.js";

// jsPDF's built-in fonts can't draw ₹ or →, so PDFs use "Rs." and "->".
const pdfText = (v) => String(v === undefined || v === null ? "" : v).replace(/₹/g, "Rs. ").replace(/→/g, "->");
const money = (n) => pdfText(fmtINR(n));

const HOSPITAL_NAME = "Select Care Hospital";
const HOSPITAL_SUB = "Multi-speciality Clinic, Pune";

function header(doc, title, W = 210) {
  doc.setFillColor(16, 38, 46);
  doc.rect(0, 0, W, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(HOSPITAL_NAME, 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(HOSPITAL_SUB, 14, 19);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, W - 14, 15, { align: "right" });
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
      ["Consultation fee", money(bill.consultationFee)],
      ["Follow-up fee", money(bill.followupFee)],
      ["Procedure fee", money(bill.procedureFee)],
      ["Discount", "- " + money(bill.discount)],
    ],
    theme: "grid",
    headStyles: { fillColor: [23, 163, 147] },
    styles: { fontSize: 10 },
  });

  const y = doc.lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${money(total)}`, 196, y, { align: "right" });
  doc.text(`Paid: ${money(paid)}`, 196, y + 6, { align: "right" });
  doc.setTextColor(outstanding > 0 ? 192 : 40, outstanding > 0 ? 104 : 120, outstanding > 0 ? 90 : 40);
  doc.text(`Outstanding: ${money(outstanding)}`, 196, y + 12, { align: "right" });
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
      ["Surgeon fee", money(bill.surgeonFee)],
      ["Assistant surgeon fee", money(bill.assistantFee)],
      ["Anaesthetist fee", money(bill.anaesthetistFee)],
      ["OT charges", money(bill.otCharges)],
      ["Room charges", money(bill.roomCharges)],
      ["Implant charges", money(bill.implantCharges)],
      ["Procedure charges", money(bill.procedureCharges)],
      ["Other charges", money(bill.otherCharges)],
      ["Discount", "- " + money(bill.discount)],
    ],
    theme: "grid",
    headStyles: { fillColor: [23, 163, 147] },
    styles: { fontSize: 10 },
  });

  const y = doc.lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${money(total)}`, 196, y, { align: "right" });
  doc.text(`Paid: ${money(paid)}`, 196, y + 6, { align: "right" });
  doc.setTextColor(outstanding > 0 ? 192 : 40, outstanding > 0 ? 104 : 120, outstanding > 0 ? 90 : 40);
  doc.text(`Outstanding: ${money(outstanding)}`, 196, y + 12, { align: "right" });
  doc.setTextColor(30, 30, 30);

  doc.setFontSize(8.5);
  doc.setTextColor(140, 140, 140);
  doc.text("This is a system-generated invoice.", 14, 285);

  doc.save(`${bill.invoiceNo}-${bill.patientName.replace(/\s+/g, "_")}.pdf`);
}

// Generic report export: summary figures followed by one or more tables.
// Also accepts the older single-table shape ({ columns, rows }).
export function downloadReportPDF({ title, rangeLabel, summary, tables, columns, rows, note, filename }) {
  const list = tables || [{ title: "", columns, rows }];
  const wide = list.some((t) => t.columns.length > 7);
  const doc = new jsPDF({ orientation: wide ? "landscape" : "portrait" });
  const W = doc.internal.pageSize.getWidth();
  header(doc, "REPORT", W);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(pdfText(title), 14, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(pdfText(rangeLabel), 14, 42);
  let y = 48;
  if (note) { doc.setFontSize(8.5); doc.setTextColor(110, 110, 110); doc.text(note, 14, y); doc.setTextColor(30, 30, 30); y += 6; }

  if (summary && summary.length) {
    autoTable(doc, {
      startY: y,
      body: chunk(summary.map((x) => [pdfText(x.label), pdfText(x.value) + (x.delta ? `  (${x.delta})` : "")]), 2).map((pair) => pair.flat()),
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 1.6 },
      columnStyles: { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" } },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  list.forEach((t) => {
    if (y > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); y = 20; }
    if (t.title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text(pdfText(t.title), 14, y);
      y += 3;
    }
    autoTable(doc, {
      startY: y,
      head: [t.columns.map(pdfText)],
      body: t.rows.length ? t.rows.map((r) => r.map(pdfText)) : [[{ content: "No records", colSpan: t.columns.length, styles: { textColor: [140, 140, 140] } }]],
      theme: "striped",
      headStyles: { fillColor: [23, 163, 147] },
      styles: { fontSize: 8.5 },
    });
    y = doc.lastAutoTable.finalY + 9;
  });

  doc.save(filename || "report.pdf");
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) {
    const part = arr.slice(i, i + n);
    while (part.length < n) part.push(["", ""]);
    out.push(part);
  }
  return out;
}
