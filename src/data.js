export const STAGES = {
  // 1. Lead management
  lead: ["New Lead", "Follow-up Required", "Converted", "Lost"],
  // 2. Lead → OPD (appointment statuses; OPD Booked = Booked/Arrived/Waiting/With Doctor)
  appt: ["Booked", "Arrived", "Waiting", "With Doctor", "Completed", "No-show", "Cancelled"],
  // 3. OPD → Counsellor
  counselling: ["Referred to Counsellor", "Counselling Completed", "Surgery Advised", "Further Investigation Required"],
  // 4. OPD / Surgery conversion (plus post-surgery stages)
  surgery: [
    "Booked – Confirmed Surgery Date",
    "Tentative Month Booking",
    "Poor Patient / Financial Assistance",
    "Patient Not Willing",
    "Ayurvedic / Alternative Treatment",
    "Lost – Other Hospital",
    "Lost – Services / Experience",
    "Lost – High Package",
    "Patient Unfit",
    "Follow-up Pending",
    "Surgery Completed",
    "Discharged",
  ],
  // 5. Post-operative follow-up
  postop: ["Follow-up Visit", "Lab Investigation", "MRI / Imaging", "Doctor Review"],
  postopStatus: ["Scheduled", "Done", "Missed"],
  // 6. Medicine treatment
  medicine: ["Medicine Prescribed", "Medicine Follow-up", "Treatment Ongoing", "Treatment Completed"],
  // 7. Physiotherapy
  physio: ["Physio Advised", "Physio Started", "Sessions Completed", "Follow-up / Progress"],
  followup: ["Yet to Call", "Contacted", "Not Answered", "Postponed", "Confirmed", "Booked", "Completed"],
};

// Groups used for colours, dashboard counts and the conversion page.
export const SURGERY_GROUPS = {
  booked: ["Booked – Confirmed Surgery Date", "Tentative Month Booking"],
  pending: ["Follow-up Pending", "Poor Patient / Financial Assistance"],
  notConverted: ["Patient Not Willing", "Ayurvedic / Alternative Treatment", "Lost – Other Hospital", "Lost – Services / Experience", "Lost – High Package", "Patient Unfit"],
  done: ["Surgery Completed", "Discharged"],
};
export const OPD_ACTIVE = ["Booked", "Arrived", "Waiting", "With Doctor"];
export const DEFAULT_COUNSELLORS = ["Neha Kulkarni", "Sameer Joshi"];

// Standard post-op schedule, applied when a surgery is marked completed (days after surgery).
export const POSTOP_SCHEDULE = [
  { day: 3, type: "Lab Investigation", note: "Post-op blood tests" },
  { day: 14, type: "Follow-up Visit", note: "Wound check / suture removal" },
  { day: 42, type: "MRI / Imaging", note: "6-week imaging" },
  { day: 42, type: "Doctor Review", note: "6-week surgeon review" },
  { day: 90, type: "Follow-up Visit", note: "3-month review" },
];
export const addDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};
const localISO = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
// First and last day of a month, offset from the current month (0 = this month, -1 = last month).
export const monthRange = (offset = 0) => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return [localISO(first), localISO(last)];
};
export const monthBounds = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return [localISO(new Date(y, m - 1, 1)), localISO(new Date(y, m, 0))];
};
export const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
// "POD 10 · Week 2" style label for days since surgery.
export const podLabel = (surgeryDate, today) => {
  if (!surgeryDate) return "";
  const n = daysBetween(surgeryDate, today);
  if (n < 0) return `In ${-n} day${n === -1 ? "" : "s"}`;
  return `POD ${n} · Week ${Math.floor(n / 7) + 1}`;
};
export const makePostopSchedule = (surgery, uidFn) =>
  POSTOP_SCHEDULE.map((x) => ({ id: uidFn(), surgeryId: surgery.id, patientId: surgery.patientId, patientName: surgery.patientName, type: x.type, dueDate: addDays(surgery.date, x.day), status: "Scheduled", note: x.note, result: "" }));

// Old status names from earlier versions, mapped onto the new ones.
const LEGACY_LEAD = { "Contacted": "Follow-up Required", "Follow-up": "Converted", "Appointment Booked": "Converted", "OPD Completed": "Converted", "Diagnosis": "Converted", "Surgery Advised": "Converted", "Surgery Booked": "Converted", "Surgery Completed": "Converted" };
const LEGACY_SURGERY = { "Recommended": "Follow-up Pending", "Counselling": "Follow-up Pending", "Estimate Given": "Follow-up Pending", "Pre-op": "Booked – Confirmed Surgery Date", "Scheduled": "Booked – Confirmed Surgery Date", "Completed": "Surgery Completed" };
export const normalizeLeadStage = (s) => (STAGES.lead.includes(s) ? s : LEGACY_LEAD[s] || "New Lead");

export const LEAD_SOURCES = ["Walk-in", "Google Ads", "Meta Ads", "Facebook", "Instagram", "Website", "Referral", "WhatsApp", "OPD Appointment", "Camp", "Import"];
export const DEFAULT_EXECUTIVES = ["Rahul Kumar", "Priya Sharma", "Amit Singh"];

// Contact masking, as in the reference ("XXXX XXX210", "xxx...na@email.com").
export const maskMobile = (m) => {
  const d = String(m || "").replace(/\D/g, "");
  if (!d) return "—";
  return `XXXX XXX${d.slice(-3)}`;
};
export const maskEmail = (e) => {
  if (!e || !e.includes("@")) return e || "—";
  const [local, domain] = e.split("@");
  return `xxx…${local.slice(-2)}@${domain}`;
};

// Fills in fields added in later versions so older saved data keeps working.
export function migrateData(d) {
  const out = { ...d };
  out.executives = d.executives && d.executives.length ? d.executives : DEFAULT_EXECUTIVES;
  out.patients = (d.patients || []).map((p) => ({ email: "", referredBy: "Self", source: "Walk-in", ...p }));
  out.counsellors = d.counsellors && d.counsellors.length ? d.counsellors : DEFAULT_COUNSELLORS;
  out.counselling = d.counselling || [];
  const mob = (m) => String(m || "").replace(/\D/g, "").slice(-10);
  out.leads = (d.leads || []).map((l) => {
    const stage = normalizeLeadStage(l.stage);
    const match = !l.patientId && stage === "Converted" ? out.patients.find((p) => l.mobile && mob(p.mobile) === mob(l.mobile)) : null;
    return { nextFollowup: "", email: "", lastContacted: null, ...l, stage, patientId: l.patientId || (match ? match.id : "") };
  });
  out.postop = d.postop || [];
  out.medicines = d.medicines || [];
  out.physio = d.physio || [];
  out.surgeries = (d.surgeries || []).map((s) => ({
    tentativeMonth: "",
    notes: "",
    createdAt: s.date || "",
    ...s,
    stage: STAGES.surgery.includes(s.stage) ? s.stage : LEGACY_SURGERY[s.stage] || "Follow-up Pending",
  }));
  out.followups = (d.followups || []).map((f) => ({
    executive: "",
    lastFollowup: "",
    log: [],
    ...f,
    status: f.status || (f.done ? "Completed" : "Yet to Call"),
  }));
  return out;
}

export const TEMPLATES = {
  "Appointment reminder": (p, extra) => `Hi ${p.name.split(" ")[0]}, this is a reminder for your appointment${extra ? " " + extra : ""}. Reply to confirm.`,
  "Report ready": (p) => `Hi ${p.name.split(" ")[0]}, your report is ready for review. Please check with the front desk or your doctor.`,
  "Follow-up reminder": (p) => `Hi ${p.name.split(" ")[0]}, it's time for your follow-up visit. Please call us to schedule.`,
  "Discharge instructions": (p) => `Hi ${p.name.split(" ")[0]}, your discharge instructions have been sent. Please follow the diet and activity notes shared.`,
};

// Appends an entry to a patient's clinical timeline (used when statuses change).
export const withHistory = (d, patientId, type, detail) => ({
  ...d,
  patients: d.patients.map((p) => (p.id === patientId ? { ...p, history: [...(p.history || []), { date: todayISO(), type, detail }] } : p)),
});

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
  const p1 = uid(), p2 = uid(), p3 = uid(), p4 = uid(), p5 = uid(), p6 = uid(), p7 = uid(), s7 = uid();
  const s7date = daysFromNow(-10);
  return {
    patients: [
      { id: p1, name: "Ramesh Kulkarni", age: 58, gender: "Male", mobile: "9822011223", email: "ramesh.kulkarni@gmail.com", referredBy: "Dr. Mehta", source: "Google Ads", doctor: "Dr. Aisha Rao", department: "Orthopaedics", createdAt: daysFromNow(-40), notes: "Chronic right knee pain, 2 yrs. Previous conservative treatment failed.", history: [
        { date: daysFromNow(-40), type: "Registration", detail: "First consult booked via Google Ads" },
        { date: daysFromNow(-38), type: "Diagnosis", detail: "Osteoarthritis, right knee. X-ray advised." },
        { date: daysFromNow(-30), type: "Investigation", detail: "X-ray reviewed, moderate joint space narrowing" },
        { date: daysFromNow(-20), type: "Note", detail: "Surgery (TKR) advised, patient counselled" },
      ] },
      { id: p2, name: "Sunita Deshmukh", age: 34, gender: "Female", mobile: "9987044556", email: "sunita.deshmukh@gmail.com", referredBy: "Self", source: "OPD Appointment", doctor: "Dr. Aisha Rao", department: "Orthopaedics", createdAt: daysFromNow(-10), notes: "ACL tear, left knee, sports injury.", history: [
        { date: daysFromNow(-10), type: "Registration", detail: "Walk-in booking" },
        { date: daysFromNow(-9), type: "Diagnosis", detail: "MRI advised" },
      ] },
      { id: p3, name: "Vikram Joshi", age: 61, gender: "Male", mobile: "9021077889", email: "vikram.joshi@yahoo.com", referredBy: "Dr. Mehta", source: "Referral", doctor: "Dr. Nikhil Pai", department: "Cardiology", createdAt: daysFromNow(-5), notes: "Hypertension follow-up.", history: [
        { date: daysFromNow(-5), type: "Registration", detail: "Referral from Dr. Mehta" },
      ] },
      { id: p4, name: "Anjali Bhosale", age: 45, gender: "Female", mobile: "9876543210", email: "anjali.bhosale@gmail.com", referredBy: "Self", source: "WhatsApp", doctor: "Dr. Aisha Rao", department: "Orthopaedics", createdAt: daysFromNow(-2), notes: "Frozen shoulder, right side.", history: [
        { date: daysFromNow(-2), type: "Registration", detail: "WhatsApp booking" },
      ] },
      { id: p5, name: "Deepak More", age: 39, gender: "Male", mobile: "9890123456", email: "deepak.more@gmail.com", referredBy: "Self", source: "Facebook", doctor: "Dr. Aisha Rao", department: "Orthopaedics", createdAt: daysFromNow(-6), notes: "Lower back pain.", history: [
        { date: daysFromNow(-6), type: "Registration", detail: "Converted from Facebook lead" },
      ] },
      { id: p6, name: "Suresh Pawar", age: 66, gender: "Male", mobile: "9822334455", email: "suresh.pawar@gmail.com", referredBy: "Dr. Gupta", source: "Google Ads", doctor: "Dr. Aisha Rao", department: "Orthopaedics", createdAt: daysFromNow(-25), notes: "Bilateral knee OA.", history: [
        { date: daysFromNow(-25), type: "Registration", detail: "Converted from Google Ads lead" },
        { date: daysFromNow(-12), type: "Counselling", detail: "Surgery advised, TKR package shared" },
        { date: daysFromNow(-4), type: "Surgery", detail: "Lost – High Package" },
      ] },
      { id: p7, name: "Mohan Deshpande", age: 64, gender: "Male", mobile: "9823456701", email: "mohan.deshpande@gmail.com", referredBy: "Dr. Mehta", source: "Referral", doctor: "Dr. Aisha Rao", department: "Orthopaedics", createdAt: daysFromNow(-40), notes: "Right knee OA, TKR done.", history: [
        { date: daysFromNow(-40), type: "Registration", detail: "Converted from Referral lead" },
        { date: daysFromNow(-29), type: "Counselling", detail: "Surgery Advised" },
        { date: daysFromNow(-10), type: "Surgery", detail: "Total Knee Replacement: Surgery Completed" },
      ] },
    ],
    leads: [
      { id: uid(), name: "Ramesh Kulkarni", mobile: "9822011223", source: "Google Ads", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Converted", patientId: p1, nextFollowup: "", createdAt: daysFromNow(-41) },
      { id: uid(), name: "Sunita Deshmukh", mobile: "9987044556", source: "Website", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Converted", patientId: p2, nextFollowup: "", createdAt: daysFromNow(-11) },
      { id: uid(), name: "Vikram Joshi", mobile: "9021077889", source: "Referral", department: "Cardiology", doctor: "Dr. Nikhil Pai", stage: "Converted", patientId: p3, nextFollowup: "", createdAt: daysFromNow(-6) },
      { id: uid(), name: "Anjali Bhosale", mobile: "9876543210", source: "WhatsApp", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Converted", patientId: p4, nextFollowup: "", createdAt: daysFromNow(-3) },
      { id: uid(), name: "Deepak More", mobile: "9890123456", source: "Facebook", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Converted", patientId: p5, nextFollowup: "", createdAt: daysFromNow(-7) },
      { id: uid(), name: "Suresh Pawar", mobile: "9822334455", source: "Google Ads", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Converted", patientId: p6, nextFollowup: "", createdAt: daysFromNow(-26) },
      { id: uid(), name: "Mohan Deshpande", mobile: "9823456701", source: "Referral", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Converted", patientId: p7, nextFollowup: "", createdAt: daysFromNow(-41) },
      { id: uid(), name: "Prakash Rane", mobile: "9765012340", source: "Google Ads", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Follow-up Required", patientId: "", nextFollowup: daysFromNow(1), createdAt: daysFromNow(-3) },
      { id: uid(), name: "Sanjay Patil", mobile: "9021045678", source: "Website", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Follow-up Required", patientId: "", nextFollowup: daysFromNow(-1), createdAt: daysFromNow(-6) },
      { id: uid(), name: "Farida Sheikh", mobile: "9922530045", source: "Camp", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "Follow-up Required", patientId: "", nextFollowup: todayISO(), createdAt: daysFromNow(-12) },
      { id: uid(), name: "Meena Iyer", mobile: "9822098765", source: "Referral", department: "Cardiology", doctor: "Dr. Nikhil Pai", stage: "New Lead", patientId: "", nextFollowup: "", createdAt: daysFromNow(-1) },
      { id: uid(), name: "Kavita Shah", mobile: "9988765432", source: "Instagram", department: "Orthopaedics", doctor: "Dr. Aisha Rao", stage: "New Lead", patientId: "", nextFollowup: "", createdAt: todayISO() },
      { id: uid(), name: "Rahul Nair", mobile: "9845022110", source: "Meta Ads", department: "Cardiology", doctor: "Dr. Nikhil Pai", stage: "Lost", patientId: "", nextFollowup: "", createdAt: daysFromNow(-20) },
    ],
    appointments: [
      { id: uid(), patientId: p1, patientName: "Ramesh Kulkarni", doctor: "Dr. Aisha Rao", date: todayISO(), time: "10:00", type: "Follow-up", status: "With Doctor" },
      { id: uid(), patientId: p2, patientName: "Sunita Deshmukh", doctor: "Dr. Aisha Rao", date: todayISO(), time: "10:30", type: "Follow-up", status: "Waiting" },
      { id: uid(), patientId: p3, patientName: "Vikram Joshi", doctor: "Dr. Nikhil Pai", date: todayISO(), time: "11:00", type: "New", status: "Booked" },
      { id: uid(), patientId: p4, patientName: "Anjali Bhosale", doctor: "Dr. Aisha Rao", date: todayISO(), time: "11:30", type: "Follow-up", status: "Arrived" },
      { id: uid(), patientId: p1, patientName: "Ramesh Kulkarni", doctor: "Dr. Aisha Rao", date: daysFromNow(-20), time: "10:00", type: "New", status: "Completed" },
      { id: uid(), patientId: p2, patientName: "Sunita Deshmukh", doctor: "Dr. Aisha Rao", date: daysFromNow(-9), time: "09:30", type: "New", status: "Completed" },
      { id: uid(), patientId: p4, patientName: "Anjali Bhosale", doctor: "Dr. Aisha Rao", date: daysFromNow(-2), time: "16:00", type: "New", status: "Completed" },
      { id: uid(), patientId: p5, patientName: "Deepak More", doctor: "Dr. Aisha Rao", date: daysFromNow(-4), time: "12:00", type: "New", status: "No-show" },
      { id: uid(), patientId: p6, patientName: "Suresh Pawar", doctor: "Dr. Aisha Rao", date: daysFromNow(-14), time: "11:00", type: "New", status: "Completed" },
      { id: uid(), patientId: p7, patientName: "Mohan Deshpande", doctor: "Dr. Aisha Rao", date: daysFromNow(-30), time: "12:30", type: "New", status: "Completed" },
      { id: uid(), patientId: p5, patientName: "Deepak More", doctor: "Dr. Aisha Rao", date: daysFromNow(-3), time: "17:00", type: "New", status: "Cancelled" },
    ],
    counsellors: DEFAULT_COUNSELLORS,
    counselling: [
      { id: uid(), patientId: p1, patientName: "Ramesh Kulkarni", doctor: "Dr. Aisha Rao", counsellor: "Neha Kulkarni", referredOn: daysFromNow(-19), status: "Surgery Advised", notes: "TKR explained, estimate shared" },
      { id: uid(), patientId: p2, patientName: "Sunita Deshmukh", doctor: "Dr. Aisha Rao", counsellor: "Sameer Joshi", referredOn: daysFromNow(-8), status: "Further Investigation Required", notes: "MRI needed before deciding on ACL reconstruction" },
      { id: uid(), patientId: p4, patientName: "Anjali Bhosale", doctor: "Dr. Aisha Rao", counsellor: "Neha Kulkarni", referredOn: daysFromNow(-2), status: "Referred to Counsellor", notes: "" },
      { id: uid(), patientId: p6, patientName: "Suresh Pawar", doctor: "Dr. Aisha Rao", counsellor: "Sameer Joshi", referredOn: daysFromNow(-13), status: "Surgery Advised", notes: "Package discussed with family" },
      { id: uid(), patientId: p7, patientName: "Mohan Deshpande", doctor: "Dr. Aisha Rao", counsellor: "Neha Kulkarni", referredOn: daysFromNow(-29), status: "Surgery Advised", notes: "Family agreed, cashless insurance" },
    ],
    surgeries: [
      { id: uid(), patientId: p1, patientName: "Ramesh Kulkarni", surgeon: "Dr. Aisha Rao", type: "Total Knee Replacement", stage: "Booked – Confirmed Surgery Date", date: daysFromNow(14), tentativeMonth: "", notes: "", createdAt: daysFromNow(-18) },
      { id: uid(), patientId: p2, patientName: "Sunita Deshmukh", surgeon: "Dr. Aisha Rao", type: "ACL Reconstruction", stage: "Tentative Month Booking", date: "", tentativeMonth: daysFromNow(35).slice(0, 7), notes: "After exams", createdAt: daysFromNow(-7) },
      { id: uid(), patientId: p6, patientName: "Suresh Pawar", surgeon: "Dr. Aisha Rao", type: "Bilateral TKR", stage: "Lost – High Package", date: "", tentativeMonth: "", notes: "Found a cheaper package elsewhere", createdAt: daysFromNow(-12) },
      { id: s7, patientId: p7, patientName: "Mohan Deshpande", surgeon: "Dr. Aisha Rao", type: "Total Knee Replacement", stage: "Discharged", date: s7date, tentativeMonth: "", notes: "Uneventful recovery", createdAt: daysFromNow(-28) },
    ],
    postop: [
      { id: uid(), surgeryId: s7, patientId: p7, patientName: "Mohan Deshpande", type: "Lab Investigation", dueDate: addDays(s7date, 3), status: "Done", note: "Post-op blood tests", result: "Hb 11.2, CRP falling" },
      { id: uid(), surgeryId: s7, patientId: p7, patientName: "Mohan Deshpande", type: "Follow-up Visit", dueDate: addDays(s7date, 14), status: "Scheduled", note: "Wound check / suture removal", result: "" },
      { id: uid(), surgeryId: s7, patientId: p7, patientName: "Mohan Deshpande", type: "MRI / Imaging", dueDate: addDays(s7date, 42), status: "Scheduled", note: "6-week imaging", result: "" },
      { id: uid(), surgeryId: s7, patientId: p7, patientName: "Mohan Deshpande", type: "Doctor Review", dueDate: addDays(s7date, 42), status: "Scheduled", note: "6-week surgeon review", result: "" },
      { id: uid(), surgeryId: s7, patientId: p7, patientName: "Mohan Deshpande", type: "Follow-up Visit", dueDate: addDays(s7date, 90), status: "Scheduled", note: "3-month review", result: "" },
    ],
    medicines: [
      { id: uid(), patientId: p7, patientName: "Mohan Deshpande", doctor: "Dr. Aisha Rao", medicines: "Tab Paracetamol 650 BD, Tab Pantoprazole 40 OD, Tab Calcium + D3 OD", prescribedOn: s7date, durationDays: 30, nextFollowup: daysFromNow(4), status: "Treatment Ongoing", log: [{ date: daysFromNow(-3), note: "Pain reducing, continue same" }] },
      { id: uid(), patientId: p3, patientName: "Vikram Joshi", doctor: "Dr. Nikhil Pai", medicines: "Tab Telmisartan 40 OD", prescribedOn: daysFromNow(-6), durationDays: 30, nextFollowup: daysFromNow(-1), status: "Medicine Follow-up", log: [] },
      { id: uid(), patientId: p2, patientName: "Sunita Deshmukh", doctor: "Dr. Aisha Rao", medicines: "Tab Aceclofenac SR 200 OD", prescribedOn: daysFromNow(-9), durationDays: 7, nextFollowup: "", status: "Treatment Completed", log: [{ date: daysFromNow(-2), note: "Course completed, swelling down" }] },
    ],
    physio: [
      { id: uid(), patientId: p7, patientName: "Mohan Deshpande", advisedBy: "Dr. Aisha Rao", therapist: "Kiran Patil", advisedOn: daysFromNow(-8), startedOn: daysFromNow(-7), plannedSessions: 12, sessionsDone: 5, status: "Physio Started", log: [{ date: daysFromNow(-1), note: "Knee flexion 85°, walking with walker" }] },
      { id: uid(), patientId: p4, patientName: "Anjali Bhosale", advisedBy: "Dr. Aisha Rao", therapist: "Kiran Patil", advisedOn: daysFromNow(-2), startedOn: "", plannedSessions: 10, sessionsDone: 0, status: "Physio Advised", log: [] },
      { id: uid(), patientId: p2, patientName: "Sunita Deshmukh", advisedBy: "Dr. Aisha Rao", therapist: "Kiran Patil", advisedOn: daysFromNow(-20), startedOn: daysFromNow(-19), plannedSessions: 8, sessionsDone: 8, status: "Follow-up / Progress", log: [{ date: daysFromNow(-4), note: "All sessions done, home exercises, review in 2 weeks" }] },
    ],
    executives: DEFAULT_EXECUTIVES,
    followups: [
      { id: uid(), patientId: p1, patientName: "Ramesh Kulkarni", note: "Pre-op clearance review", dueDate: daysFromNow(2), done: false, executive: "Rahul Kumar", status: "Contacted", lastFollowup: daysFromNow(-3), log: [{ date: daysFromNow(-3), status: "Contacted", note: "Discussed TKR estimate, will confirm date", by: "Rahul Kumar" }] },
      { id: uid(), patientId: p2, patientName: "Sunita Deshmukh", note: "MRI report discussion", dueDate: todayISO(), done: false, executive: "Priya Sharma", status: "Booked", lastFollowup: daysFromNow(-4), log: [{ date: daysFromNow(-4), status: "Booked", note: "Follow-up OPD booked", by: "Priya Sharma" }] },
      { id: uid(), patientId: p3, patientName: "Vikram Joshi", note: "BP check and medication review", dueDate: daysFromNow(1), done: false, executive: "Amit Singh", status: "Not Answered", lastFollowup: daysFromNow(-5), log: [{ date: daysFromNow(-5), status: "Not Answered", note: "No response, try evening", by: "Amit Singh" }] },
      { id: uid(), patientId: p4, patientName: "Anjali Bhosale", note: "Physiotherapy progress check", dueDate: daysFromNow(-1), done: false, executive: "Rahul Kumar", status: "Postponed", lastFollowup: daysFromNow(-6), log: [{ date: daysFromNow(-6), status: "Postponed", note: "Patient travelling, call next week", by: "Rahul Kumar" }] },
      { id: uid(), patientId: p1, patientName: "Ramesh Kulkarni", note: "Knee X-ray review", dueDate: todayISO(), done: false, executive: "Priya Sharma", status: "Yet to Call", lastFollowup: "", log: [] },
      { id: uid(), patientId: p2, patientName: "Sunita Deshmukh", note: "Post-injury review", dueDate: daysFromNow(-8), done: true, executive: "Priya Sharma", status: "Completed", lastFollowup: daysFromNow(-8), log: [{ date: daysFromNow(-8), status: "Completed", note: "Visited OPD", by: "Priya Sharma" }] },
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
