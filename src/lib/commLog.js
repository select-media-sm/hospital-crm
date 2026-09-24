import { uid, todayISO, withHistory } from "../data.js";

// Records a message that was opened in WhatsApp / SMS / email.
// kind: "lead" | "patient". Returns a function for setData.
export const logMessage = (kind, r, { channel, template, message }) => (d) => {
  const entry = {
    id: uid(),
    patientId: kind === "patient" ? r.id : "",
    leadId: kind === "lead" ? r.id : "",
    patientName: r.name,
    audience: kind === "lead" ? "Lead" : "Patient",
    channel,
    template,
    message,
    status: `Opened in ${channel}`,
    sentAt: todayISO(),
  };
  let next = { ...d, communications: [entry, ...(d.communications || [])] };
  if (kind === "lead") next.leads = d.leads.map((l) => (l.id === r.id ? { ...l, lastContacted: { date: todayISO(), channel } } : l));
  else next = withHistory(next, r.id, "Communication", `${channel}: ${template}`);
  return next;
};
