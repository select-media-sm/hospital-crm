import React, { useState, useEffect } from "react";
import { MessageCircle, MessageSquare, Mail, Check, ExternalLink } from "lucide-react";
import { COLORS } from "../theme.js";
import { buildLink, fillTemplate, TOKENS } from "../lib/messaging.js";
import { Modal, Select, Field, Textarea, Input, Badge } from "./ui.jsx";

const CHANNELS = [
  ["WhatsApp", MessageCircle, "#25A15B"],
  ["SMS", MessageSquare, COLORS.sky],
  ["Email", Mail, COLORS.blueDeep],
];
const APP = { WhatsApp: "WhatsApp", SMS: "SMS app", Email: "email" };

// recipients: [{ id, name, mobile, email, doctor, department }]
// onOpened(recipient, { channel, template, message }) is called when a message is opened in the app.
export default function MessageComposer({ open, onClose, recipients, templates, onOpened, title }) {
  const names = Object.keys(templates);
  const [channel, setChannel] = useState("WhatsApp");
  const [template, setTemplate] = useState(names[0]);
  const [text, setText] = useState(templates[names[0]].text);
  const [subject, setSubject] = useState(templates[names[0]].subject);
  const [opened, setOpened] = useState({});

  useEffect(() => {
    if (open) { setOpened({}); setTemplate(names[0]); setText(templates[names[0]].text); setSubject(templates[names[0]].subject); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickTemplate = (t) => { setTemplate(t); setText(templates[t].text); setSubject(templates[t].subject); };
  const linkFor = (r) => buildLink(channel, r, fillTemplate(text, r), fillTemplate(subject, r));
  const reachable = recipients.filter((r) => linkFor(r));
  const next = reachable.find((r) => !opened[r.id + channel]);
  const openedCount = reachable.filter((r) => opened[r.id + channel]).length;

  const markOpened = (r) => {
    setOpened((o) => ({ ...o, [r.id + channel]: true }));
    onOpened && onOpened(r, { channel, template, message: fillTemplate(text, r) });
  };
  // Mark as opened only after the browser has followed this link; updating state inside the click
  // would re-render the "Open next" link to the next person before navigation happens.
  const anchorProps = (r) => ({ href: linkFor(r), onClick: () => setTimeout(() => markOpened(r), 0), ...(channel === "WhatsApp" ? { target: "_blank", rel: "noopener noreferrer" } : {}) });
  const missingLabel = channel === "Email" ? "No email" : "No valid mobile";

  return (
    <Modal open={open} onClose={onClose} title={title || "Send message"} subtitle={recipients.length === 1 ? recipients[0].name : `${recipients.length} recipients`} width={660}>
      <div style={{ display: "grid", gap: 16 }}>
        <div role="radiogroup" aria-label="Channel" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CHANNELS.map(([c, Icon, color]) => {
            const on = channel === c;
            return (
              <button key={c} role="radio" aria-checked={on} onClick={() => setChannel(c)} style={{ fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, border: `1px solid ${on ? color : COLORS.line}`, background: on ? `${color}14` : "#fff", color: on ? color : COLORS.inkSoft }}>
                <Icon size={17} /> {c}
              </button>
            );
          })}
        </div>

        <Field label="Template">
          <Select value={template} onChange={(e) => pickTemplate(e.target.value)}>{names.map((n) => <option key={n}>{n}</option>)}</Select>
        </Field>
        {channel === "Email" && <Field label="Subject"><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>}
        <Field label="Message">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 110 }} />
        </Field>
        <div style={{ fontSize: 12.5, color: COLORS.slate, marginTop: -8 }}>
          {TOKENS.join(", ")} are filled in for each person.
        </div>
        {recipients[0] && (
          <div style={{ background: COLORS.mint, borderRadius: 10, padding: "12px 14px", fontSize: 13.5, color: COLORS.ink, lineHeight: 1.5 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 4 }}>Preview for {recipients[0].name}</div>
            {fillTemplate(text, recipients[0])}
          </div>
        )}

        <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "12px 14px", background: "#fff", borderBottom: `1px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>{openedCount} of {reachable.length} opened{reachable.length < recipients.length ? `, ${recipients.length - reachable.length} can't be reached by ${channel}` : ""}</div>
            {next && recipients.length > 1 && (
              <a {...anchorProps(next)} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: COLORS.blue, color: "#fff", fontSize: 13.5, fontWeight: 600 }}>
                Open next: {next.name.split(" ")[0]} <ExternalLink size={14} />
              </a>
            )}
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {recipients.map((r, i) => {
              const link = linkFor(r);
              const done = opened[r.id + channel];
              return (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: i ? `1px solid ${COLORS.line}` : "none" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: COLORS.ink }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{channel === "Email" ? r.email || "No email on file" : r.mobile || "No mobile on file"}</div>
                  </div>
                  {!link ? (
                    <Badge tone="slate">{missingLabel}</Badge>
                  ) : done ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: COLORS.greenDeep }}><Check size={15} /> Opened</span>
                  ) : (
                    <a {...anchorProps(r)} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                      Open in {APP[channel]} <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>
          Each message opens in {APP[channel]} with the text filled in. Press send there. It is then logged under Communication.
        </div>
      </div>
    </Modal>
  );
}
