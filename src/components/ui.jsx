import React, { useEffect } from "react";
import { X } from "lucide-react";
import { COLORS, FONT_SANS } from "../theme.js";

export const TONE_MAP = {
  blue: [COLORS.bluePale, COLORS.blueDeep, COLORS.blue],
  teal: [COLORS.bluePale, COLORS.blueDeep, COLORS.blue],
  sky: [COLORS.skyPale, COLORS.skyDeep, COLORS.sky],
  yellow: [COLORS.yellowPale, COLORS.yellowDeep, COLORS.yellow],
  green: [COLORS.greenPale, COLORS.greenDeep, COLORS.green],
  red: [COLORS.redPale, COLORS.redDeep, COLORS.red],
  slate: ["#EEF2F3", "#55676F", "#8A9BA2"],
};

// Pill badge. `dot` adds the leading status dot used in the reference tables.
export function Badge({ children, tone = "blue", dot }) {
  const [bg, fg, accent] = TONE_MAP[tone] || TONE_MAP.blue;
  return (
    <span
      style={{
        background: bg,
        color: fg,
        border: `1px solid ${accent}33`,
        fontSize: 12,
        fontWeight: 600,
        padding: dot ? "4px 11px 4px 9px" : "4px 11px",
        borderRadius: 20,
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        lineHeight: 1.3,
        justifySelf: "start",
        width: "fit-content",
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: 6, background: accent, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

export function Card({ children, style, className }) {
  return (
    <div
      className={className}
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 14,
        padding: "clamp(16px, 3.5vw, 22px) clamp(16px, 3.5vw, 24px)",
        boxShadow: "0 1px 2px rgba(16,38,46,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Stat tile: tinted icon square on the left, big number, label underneath.
export function StatCard({ label, value, tone = "blue", icon: Icon, hint, onClick, active }) {
  const [bg, fg, accent] = TONE_MAP[tone] || TONE_MAP.blue;
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? !!active : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      style={{
        cursor: onClick ? "pointer" : "default",
        boxShadow: active ? `0 0 0 2px ${accent}` : "none",
        background: `linear-gradient(180deg, #FFFFFF, ${COLORS.mint})`,
        border: `1px solid ${active ? accent : COLORS.line}`,
        borderRadius: 14,
        padding: "clamp(16px, 3.5vw, 22px)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "10px 16px",
        minWidth: 0,
      }}
    >
      {Icon && (
        <div style={{ width: "clamp(42px, 9vw, 52px)", height: "clamp(42px, 9vw, 52px)", borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={23} color={fg} strokeWidth={1.9} />
        </div>
      )}
      <div style={{ minWidth: 0, flex: "1 1 96px" }}>
        <div style={{ fontSize: "clamp(21px, 4.6vw, 26px)", fontWeight: 700, color: COLORS.ink, lineHeight: 1.15, letterSpacing: -0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
        <div style={{ fontSize: 13.5, color: COLORS.inkSoft, marginTop: 3 }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: COLORS.slate, marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  );
}

export function Btn({ children, onClick, kind = "ghost", small, style, icon: Icon, disabled, type = "button", title }) {
  const base = {
    fontFamily: FONT_SANS,
    fontSize: small ? 12.5 : 13.5,
    padding: small ? "7px 12px" : "10px 16px",
    borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    fontWeight: 600,
    border: "1px solid transparent",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    whiteSpace: "nowrap",
    transition: "background .15s, border-color .15s",
  };
  const kinds = {
    primary: { background: COLORS.blue, color: "#fff" },
    ghost: { background: "#fff", color: COLORS.ink, border: `1px solid ${COLORS.line}` },
    soft: { background: COLORS.bluePale, color: COLORS.blueDeep },
    link: { background: "transparent", color: COLORS.blue, padding: small ? "6px 8px" : "8px 10px" },
    danger: { background: "#fff", color: COLORS.red, border: `1px solid ${COLORS.redPale}` },
  };
  return (
    <button type={type} title={title} className={`btn btn-${kind}`} onClick={disabled ? undefined : onClick} style={{ ...base, ...kinds[kind], ...style }}>
      {Icon && <Icon size={small ? 14 : 15} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

const fieldStyle = {
  fontFamily: FONT_SANS,
  fontSize: 13.5,
  padding: "10px 13px",
  borderRadius: 10,
  border: `1px solid ${COLORS.line}`,
  background: "#fff",
  color: COLORS.ink,
  outline: "none",
  width: "100%",
  minHeight: 42,
};

export function Input(props) {
  return <input {...props} className="field" style={{ ...fieldStyle, ...props.style }} />;
}

export function Textarea(props) {
  return <textarea {...props} className="field" style={{ ...fieldStyle, minHeight: 72, resize: "vertical", ...props.style }} />;
}

export function Select(props) {
  return (
    <select {...props} className="field" style={{ ...fieldStyle, ...props.style }}>
      {props.children}
    </select>
  );
}

export function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 13, color: COLORS.ink, marginBottom: 7, fontWeight: 500 }}>{label}</div>
      {children}
    </label>
  );
}

// Page heading: large bold title + muted subtitle, optional action on the right.
export function SectionTitle({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontSize: "clamp(22px, 5vw, 27px)", fontWeight: 700, color: COLORS.ink, margin: 0, letterSpacing: -0.4 }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 14, color: COLORS.inkSoft, marginTop: 6 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function AddPanel({ children, title }) {
  return (
    <Card style={{ marginBottom: 18 }}>
      {title && <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink, marginBottom: 16 }}>{title}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))", gap: 14, alignItems: "end" }}>{children}</div>
    </Card>
  );
}

export function ChartCard({ title, children, action }) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>{title}</div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function ProgressBar({ value, tone = "blue" }) {
  const [, , accent] = TONE_MAP[tone] || TONE_MAP.blue;
  return (
    <div style={{ height: 7, borderRadius: 6, background: COLORS.line, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, value)}%`, background: accent, borderRadius: 6, transition: "width .4s ease" }} />
    </div>
  );
}

// Table header row, styled like the reference (tinted strip, small caps-free muted labels).
export function TableHead({ columns, template }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: template, gap: 12, padding: "14px 22px", background: COLORS.mint, borderTop: `1px solid ${COLORS.line}`, borderBottom: `1px solid ${COLORS.line}`, fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, letterSpacing: 0.2 }}>
      {columns.map((c, i) => <div key={i}>{c}</div>)}
    </div>
  );
}

export function Modal({ open, onClose, title, subtitle, children, width = 620 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,38,46,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "6vh 16px", zIndex: 50, overflowY: "auto" }}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: width, boxShadow: "0 24px 60px rgba(16,38,46,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px", borderBottom: `1px solid ${COLORS.line}` }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" className="icon-btn" style={{ border: "none", background: "transparent", cursor: "pointer", color: COLORS.inkSoft, padding: 4, borderRadius: 8 }}>
            <X size={19} />
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}
