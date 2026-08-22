import React from "react";
import { COLORS, FONT_SERIF } from "../theme.js";

const TONE_MAP = {
  blue: [COLORS.bluePale, COLORS.blueDeep],
  yellow: [COLORS.yellowPale, COLORS.yellowDeep],
  green: [COLORS.greenPale, COLORS.greenDeep],
  red: [COLORS.redPale, COLORS.redDeep],
  slate: ["#F1EFE7", "#6E6C60"],
};

export function Badge({ children, tone = "blue" }) {
  const [bg, fg] = TONE_MAP[tone] || TONE_MAP.blue;
  return (
    <span
      style={{
        background: bg,
        color: fg,
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 11px",
        borderRadius: 20,
        whiteSpace: "nowrap",
        letterSpacing: 0.1,
      }}
    >
      {children}
    </span>
  );
}

export function Card({ children, style, hover }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 20,
        padding: "22px 24px",
        boxShadow: hovered ? "0 10px 24px rgba(42,43,40,0.08)" : "0 1px 3px rgba(42,43,40,0.04)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "box-shadow .2s ease, transform .2s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, tone = "blue", icon: Icon, hint }) {
  const [bg, fg] = TONE_MAP[tone] || TONE_MAP.blue;
  return (
    <Card hover style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 8, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: COLORS.ink, fontFamily: FONT_SERIF }}>{value}</div>
          {hint && <div style={{ fontSize: 11.5, color: COLORS.slate, marginTop: 4 }}>{hint}</div>}
        </div>
        {Icon && (
          <div style={{ width: 38, height: 38, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={18} color={fg} strokeWidth={2} />
          </div>
        )}
      </div>
    </Card>
  );
}

export function Btn({ children, onClick, kind = "ghost", small, style, icon: Icon }) {
  const base = {
    fontSize: small ? 12.5 : 13.5,
    padding: small ? "7px 12px" : "10px 17px",
    borderRadius: 11,
    cursor: "pointer",
    fontWeight: 600,
    border: "1px solid transparent",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    transition: "opacity .15s, transform .1s",
  };
  const kinds = {
    primary: { background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.green})`, color: "#fff" },
    ghost: { background: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.line}` },
    soft: { background: COLORS.yellowPale, color: COLORS.yellowDeep },
    danger: { background: "transparent", color: COLORS.red, border: `1px solid ${COLORS.redPale}` },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...base, ...kinds[kind], ...style }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {Icon && <Icon size={small ? 14 : 15} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      style={{
        fontSize: 13.5,
        padding: "9px 12px",
        borderRadius: 10,
        border: `1px solid ${COLORS.line}`,
        background: COLORS.cream,
        color: COLORS.ink,
        outline: "none",
        width: "100%",
        ...props.style,
      }}
    />
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      style={{
        fontSize: 13.5,
        padding: "9px 12px",
        borderRadius: 10,
        border: `1px solid ${COLORS.line}`,
        background: COLORS.cream,
        color: COLORS.ink,
        outline: "none",
        width: "100%",
        ...props.style,
      }}
    >
      {props.children}
    </select>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 5, fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action, icon: Icon }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {Icon && (
          <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg, ${COLORS.bluePale}, ${COLORS.greenPale})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={20} color={COLORS.blueDeep} strokeWidth={2} />
          </div>
        )}
        <div>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: 23, fontWeight: 600, color: COLORS.ink, margin: 0 }}>{title}</h2>
          {subtitle && <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function AddPanel({ children }) {
  return (
    <Card style={{ marginBottom: 18, background: `linear-gradient(135deg, ${COLORS.bluePale}, ${COLORS.greenPale})`, border: `1px solid ${COLORS.line}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 11, alignItems: "end" }}>{children}</div>
    </Card>
  );
}

export function ChartCard({ title, children, action }) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>{title}</div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function ProgressBar({ value, tone = "blue" }) {
  const [, fg] = TONE_MAP[tone] || TONE_MAP.blue;
  return (
    <div style={{ height: 7, borderRadius: 6, background: COLORS.line, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, value)}%`, background: fg, borderRadius: 6, transition: "width .4s ease" }} />
    </div>
  );
}
