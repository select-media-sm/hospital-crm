export function apptTone(status) {
  if (status === "Completed") return "green";
  if (status === "With Doctor") return "blue";
  if (status === "Waiting" || status === "Arrived") return "yellow";
  if (status === "No-show" || status === "Cancelled") return "red";
  return "slate";
}
export function surgeryTone(stage) {
  if (stage === "Completed" || stage === "Discharged") return "green";
  if (stage === "Scheduled" || stage === "Pre-op") return "blue";
  if (stage === "Estimate Given" || stage === "Counselling") return "yellow";
  return "slate";
}
export function leadTone(stage) {
  if (stage === "Surgery Completed" || stage === "Follow-up") return "green";
  if (stage === "Lost") return "red";
  if (stage === "Surgery Booked" || stage === "Surgery Advised" || stage === "Diagnosis" || stage === "OPD Completed") return "blue";
  return "yellow";
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
