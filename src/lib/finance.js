export function consultTotal(b) {
  return (Number(b.consultationFee) || 0) + (Number(b.followupFee) || 0) + (Number(b.procedureFee) || 0) - (Number(b.discount) || 0);
}
export function consultPaid(b) {
  const total = consultTotal(b);
  if (b.status === "Paid") return total;
  if (b.status === "Partial") return Number(b.amountPaid) || 0;
  return 0;
}
export function consultOutstanding(b) {
  return Math.max(0, consultTotal(b) - consultPaid(b));
}

export function surgeryTotal(b) {
  return (
    (Number(b.surgeonFee) || 0) +
    (Number(b.assistantFee) || 0) +
    (Number(b.anaesthetistFee) || 0) +
    (Number(b.otCharges) || 0) +
    (Number(b.roomCharges) || 0) +
    (Number(b.implantCharges) || 0) +
    (Number(b.procedureCharges) || 0) +
    (Number(b.otherCharges) || 0) -
    (Number(b.discount) || 0)
  );
}
export function surgeryPaid(b) {
  return Number(b.amountPaid) || 0;
}
export function surgeryOutstanding(b) {
  return Math.max(0, surgeryTotal(b) - surgeryPaid(b));
}

export function billStatusOf(total, paid) {
  if (paid <= 0) return "Unpaid";
  if (paid >= total) return "Paid";
  return "Partial";
}

// Unified invoice list combining consultation and surgery bills, for reports/dashboard.
export function unifiedInvoices(data) {
  const consult = (data.consultBills || []).map((b) => ({
    id: b.id,
    invoiceNo: b.invoiceNo,
    category: "Consultation",
    patientId: b.patientId,
    patientName: b.patientName,
    doctor: b.doctor,
    date: b.date,
    mode: b.mode,
    total: consultTotal(b),
    paid: consultPaid(b),
    outstanding: consultOutstanding(b),
    status: b.status,
  }));
  const surgery = (data.surgeryBills || []).map((b) => ({
    id: b.id,
    invoiceNo: b.invoiceNo,
    category: "Surgery",
    patientId: b.patientId,
    patientName: b.patientName,
    doctor: b.surgeon || "",
    date: b.date,
    mode: b.mode || "—",
    total: surgeryTotal(b),
    paid: surgeryPaid(b),
    outstanding: surgeryOutstanding(b),
    status: billStatusOf(surgeryTotal(b), surgeryPaid(b)),
  }));
  return [...consult, ...surgery];
}
