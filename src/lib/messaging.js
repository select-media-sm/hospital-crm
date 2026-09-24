// Click-to-send messaging: builds WhatsApp / SMS / email links with the text filled in.
// The message is sent from the user's own WhatsApp, phone or mail app; nothing is sent automatically.

export const CLINIC_NAME = "Select Care Hospital";

// wa.me and sms: need the number with country code. Indian 10-digit numbers get 91 added.
export function normalizePhone(m) {
  let d = String(m || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = "91" + d;
  return d.length >= 11 ? d : "";
}
export const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());

export function buildLink(channel, recipient, text, subject) {
  if (channel === "WhatsApp") {
    const p = normalizePhone(recipient.mobile);
    return p ? `https://wa.me/${p}?text=${encodeURIComponent(text)}` : "";
  }
  if (channel === "SMS") {
    const p = normalizePhone(recipient.mobile);
    return p ? `sms:+${p}?body=${encodeURIComponent(text)}` : "";
  }
  return isEmail(recipient.email) ? `mailto:${recipient.email.trim()}?subject=${encodeURIComponent(subject || CLINIC_NAME)}&body=${encodeURIComponent(text)}` : "";
}

export const TOKENS = ["{name}", "{doctor}", "{department}", "{clinic}"];
export function fillTemplate(text, r) {
  return String(text)
    .replace(/\{name\}/g, (r.name || "").split(" ")[0] || "there")
    .replace(/\{doctor\}/g, r.doctor || "our doctor")
    .replace(/\{department\}/g, r.department || "your concern")
    .replace(/\{clinic\}/g, CLINIC_NAME);
}

export const LEAD_TEMPLATES = {
  "Enquiry response": {
    subject: "Your enquiry at {clinic}",
    text: "Hello {name}, thank you for contacting {clinic} about {department}. We can book a consultation with {doctor} at a time that suits you. Please reply with a convenient day and time.",
  },
  "Appointment invitation": {
    subject: "Book your consultation at {clinic}",
    text: "Hello {name}, we would be glad to see you at {clinic}. Would you like us to book an OPD appointment with {doctor} this week? Reply with a day and time that works for you.",
  },
  "Follow-up reminder": {
    subject: "Following up on your enquiry",
    text: "Hello {name}, this is a gentle follow-up from {clinic} about your enquiry. Let us know if you have any questions, or if you would like to book a visit.",
  },
  "Custom message": { subject: "Message from {clinic}", text: "Hello {name}, " },
};

export const PATIENT_TEMPLATES = {
  "Appointment reminder": { subject: "Appointment reminder", text: "Hello {name}, this is a reminder of your appointment with {doctor} at {clinic}. Please reply to confirm." },
  "Report ready": { subject: "Your report is ready", text: "Hello {name}, your report is ready. Please collect it from the front desk or discuss it with {doctor} at your next visit." },
  "Follow-up reminder": { subject: "Time for your follow-up visit", text: "Hello {name}, it's time for your follow-up visit with {doctor} at {clinic}. Please call or reply to book a slot." },
  "Post-op check": { subject: "How are you recovering?", text: "Hello {name}, we hope your recovery is going well. Your next post-op check with {doctor} is due soon. Reply if you have any pain or concerns." },
  "Discharge instructions": { subject: "Your discharge instructions", text: "Hello {name}, please follow the diet, medicine and activity instructions shared at discharge. Call {clinic} if you have fever, swelling or increasing pain." },
  "Custom message": { subject: "Message from {clinic}", text: "Hello {name}, " },
};
