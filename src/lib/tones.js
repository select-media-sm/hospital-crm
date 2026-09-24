import { SURGERY_GROUPS } from "../data.js";
export function apptTone(status) {
  if (status === "Completed") return "green";
  if (status === "With Doctor") return "blue";
  if (status === "Waiting" || status === "Arrived") return "yellow";
  if (status === "No-show" || status === "Cancelled") return "red";
  return "slate";
}
export function surgeryTone(stage) {
  if (SURGERY_GROUPS.done.includes(stage)) return "green";
  if (stage === "Booked – Confirmed Surgery Date") return "green";
  if (stage === "Tentative Month Booking") return "teal";
  if (SURGERY_GROUPS.pending.includes(stage)) return "yellow";
  if (stage === "Patient Unfit" || stage === "Ayurvedic / Alternative Treatment" || stage === "Patient Not Willing") return "slate";
  return "red"; // Lost – ...
}
export function leadTone(stage) {
  if (stage === "Converted") return "green";
  if (stage === "Lost") return "red";
  if (stage === "Follow-up Required") return "yellow";
  return "sky"; // New Lead
}
export function counsellingTone(status) {
  if (status === "Surgery Advised") return "green";
  if (status === "Counselling Completed") return "teal";
  if (status === "Further Investigation Required") return "yellow";
  return "sky"; // Referred
}
export function billTone(status) {
  if (status === "Paid") return "green";
  if (status === "Partial") return "yellow";
  return "red";
}
export function commTone(status) {
  if (status === "Responded") return "green";
  if (status === "Read") return "blue";
  if (status === "Delivered") return "yellow";
  return "slate";
}
export function followupTone(status) {
  if (status === "Completed" || status === "Confirmed" || status === "Booked") return "green";
  if (status === "Contacted") return "sky";
  if (status === "Postponed") return "yellow";
  if (status === "Yet to Call") return "red";
  return "slate"; // Not Answered
}
