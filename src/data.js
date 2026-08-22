export const STAGES = {
  lead: ["New Lead", "Contacted", "Appointment Booked", "OPD Completed", "Diagnosis", "Surgery Advised", "Surgery Booked", "Surgery Completed", "Follow-up", "Lost"],
  appt: ["Booked", "Arrived", "Waiting", "With Doctor", "Completed", "No-show", "Cancelled"],
  surgery: ["Recommended", "Counselling", "Estimate Given", "Pre-op", "Scheduled", "Completed", "Discharged"],
};

export const TEMPLATES = {
  "Appointment reminder": (p, extra) => `Hi ${p.name.split(" ")[0]}, this is a reminder for your appointment${extra ? " " + extra : ""}. Reply to confirm.`,
  "Report ready": (p) => `Hi ${p.name.split(" ")[0]}, your report is ready for review. Please check with the front desk or your doctor.`,
  "Follow-up reminder": (p) => `Hi ${p.name.split(" ")[0]}, it's time for your follow-up visit. Please call us to schedule.`,
  "Discharge instructions": (p) => `Hi ${p.name.split(" ")[0]}, your discharge instructions have been sent. Please follow the diet and activity notes shared.`,
};

export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
export const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
export const fmtINR = (n) => {
  const v = Number(n) || 0;
  return "₹" + v.toLocaleString("en-IN");
};
export const isValidMobile = (m) => /^[6-9]\d{9}$/.test(String(m).replace(/\D/g, "").slice(-10));

let invoiceCounter = 1024;
export const nextInvoiceNo = () => `INV-${++invoiceCounter}`;

export function seedData() {
  const p1 = uid(), p2 = uid(), p3 = uid(), p4 = uid();
  return {
    patients: [
      { id: p1, name: "Ramesh Kulkarni", age: 58, gender: "Male", mobile: "9822011223", doctor: "Dr. Aisha Rao", department: "Orthopaedics", createdAt: daysFromNow(-40), notes: "Chronic right knee pain, 2 yrs. Previous conservative treatment failed.", history: [
        { date: daysFromNow(-40), type: "Registration", detail: "First consult booked via Google Ads" },
        { date: daysFromNow(-38), type: "Diagnosis", detail: "Osteoarthritis, right knee. X-ray advised." },
        { date: daysFromNow(-30), type: "Investigation", detail: "X-ray reviewed, moderate joint space narrowing" },
        { date: daysFromNow(-20), type: "Note", detail: "Surgery (TKR) advised, patient counselled" },
      ] },
      { id: p2, name: "Sunita Deshmukh", age: 34, gender: "Female", mobile: "9987044556", doctor: "Dr. Aisha Rao", department: "Orthopaedics", createdAt: daysFromNow(-10), notes: "ACL tear, left knee, sports injury.", history: [
        { date: daysFromNow(-10), type: "Registration", detail: "Walk-in booking" },
        { date: daysFromNow(-9), type: "Diagnosis", detail: "MRI advised" },
      ] },
      { id: p3, name: "Vikram Joshi", age: 61, gender: "Male", mobile: "9021077889", doctor: "Dr. Nikhil Pai", department: "Cardiology", createdAt: daysFromNow(-5), notes: "Hypertension follow-up.", history: [
        { date: daysFromNow(-5), type: "Registration", detail: "Referral from Dr. Mehta" },
      ] },
      { id: p4, name: "Anjali Bhosale", age: 45, gender: "Female", mobile: "9876543210", doctor: "Dr. Aisha Rao", department: "Orthopaedics", createdAt: daysFromNow(-2), notes: "Frozen shoulder, right side.", history: [
        { date: daysFromNow(-2), type: "Registration", detail: "WhatsApp booking" },
      ] },
    ],
    leads: [
      { id: uid(), name: "Prakash Rane", mobile: "9765012340", source: "Google Ads", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Contacted", createdAt: daysFromNow(-3) },
      { id: uid(), name: "Meena Iyer", mobile: "9822098765", source: "Referral", department: "Cardiology", doctor: "Dr. Nikhil Pai", stage: "New Lead", createdAt: daysFromNow(-1) },
      { id: uid(), name: "Sanjay Patil", mobile: "9021045678", source: "Website", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Appointment Booked", createdAt: daysFromNow(-6) },
      { id: uid(), name: "Kavita Shah", mobile: "9988765432", source: "Instagram", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Surgery Advised", createdAt: daysFromNow(-15) },
      { id: uid(), name: "Rahul Nair", mobile: "9845022110", source: "Meta Ads", department: "Cardiology", doctor: "Dr. Nikhil Pai", stage: "Lost", createdAt: daysFromNow(-20) },
      { id: uid(), name: "Farida Sheikh", mobile: "9922530045", source: "Camp", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "OPD Completed", createdAt: daysFromNow(-12) },
    ],
    appointments: [
      { id: uid(), patientId: p1, patientName: "Ramesh Kulkarni", doctor: "Dr. Aisha Rao", date: todayISO(), time: "10:00", type: "Follow-up", status: "With Doctor" },
      { id: uid(), patientId: p2, patientName: "Sunita Deshmukh", doctor: "Dr. Aisha Rao", date: todayISO(), time: "10:30", type: "Follow-up", status: "Waiting" },
      { id: uid(), patientId: p3, patientName: "Vikram Joshi", doctor: "Dr. Nikhil Pai", date: todayISO(), time: "11:00", type: "New", status: "Booked" },
      { id: uid(), patientId: p4, patientName: "Anjali Bhosale", doctor: "Dr. Aisha Rao", date: todayISO(), time: "11:30", type: "New", status: "Arrived" },
      { id: uid(), patientId: p1, patientName: "Ramesh Kulkarni", doctor: "Dr. Aisha Rao", date: daysFromNow(-20), time: "10:00", type: "New", status: "Completed" },
      { id: uid(), patientId: p2, patientName: "Sunita Deshmukh", doctor: "Dr. Aisha Rao", date: daysFromNow(-9), time: "09:30", type: "New", status: "Completed" },
      { id: uid(), patientId: p4, patientName: "Anjali Bhosale", doctor: "Dr. Aisha Rao", date: daysFromNow(-2), time: "16:00", type: "New", status: "Completed" },
    ],
    surgeries: [
      { id: uid(), patientId: p1, patientName: "Ramesh Kulkarni", surgeon: "Dr. Aisha Rao", type: "Total Knee Replacement", stage: "Estimate Given", date: daysFromNow(14) },
      { id: uid(), patientId: p2, patientName: "Sunita Deshmukh", surgeon: "Dr. Aisha Rao", type: "ACL Reconstruction", stage: "Recommended", date: "" },
    ],
    followups: [
      { id: uid(), patientId: p1, patientName: "Ramesh Kulkarni", note: "Pre-op clearance review", dueDate: daysFromNow(2), done: false },
      { id: uid(), patientId: p3, patientName: "Vikram Joshi", note: "BP check and medication review", dueDate: daysFromNow(1), done: false },
      { id: uid(), patientId: p4, patientName: "Anjali Bhosale", note: "Physiotherapy progress check", dueDate: daysFromNow(-1), done: false },
    ],
    communications: [
      { id: uid(), patientId: p1, patientName: "Ramesh Kulkarni", channel: "WhatsApp", template: "Appointment reminder", message: TEMPLATES["Appointment reminder"]({ name: "Ramesh Kulkarni" }, "tomorrow at 10:00 AM"), status: "Read", sentAt: daysFromNow(-1) },
      { id: uid(), patientId: p4, patientName: "Anjali Bhosale", channel: "SMS", template: "Report ready", message: TEMPLATES["Report ready"]({ name: "Anjali Bhosale" }), status: "Delivered", sentAt: daysFromNow(-1) },
    ],
    consultBills: [
      { id: uid(), invoiceNo: "INV-1001", patientId: p1, patientName: "Ramesh Kulkarni", doctor: "Dr. Aisha Rao", consultationFee: 800, followupFee: 400, procedureFee: 0, discount: 0, mode: "UPI", status: "Paid", date: daysFromNow(-20) },
      { id: uid(), invoiceNo: "INV-1002", patientId: p3, patientName: "Vikram Joshi", doctor: "Dr. Nikhil Pai", consultationFee: 1000, followupFee: 0, procedureFee: 0, discount: 100, mode: "Cash", status: "Unpaid", date: todayISO() },
      { id: uid(), invoiceNo: "INV-1003", patientId: p4, patientName: "Anjali Bhosale", doctor: "Dr. Aisha Rao", consultationFee: 800, followupFee: 0, procedureFee: 1500, discount: 0, mode: "Card", status: "Paid", date: daysFromNow(-2) },
    ],
    surgeryBills: [
      { id: uid(), invoiceNo: "INV-2001", patientId: p1, patientName: "Ramesh Kulkarni", surgeryType: "Total Knee Replacement", surgeonFee: 60000, assistantFee: 12000, anaesthetistFee: 10000, otCharges: 25000, roomCharges: 18000, implantCharges: 90000, procedureCharges: 8000, otherCharges: 5000, discount: 10000, amountPaid: 100000, status: "Partial", date: daysFromNow(-5) },
    ],
  };
}
