// Design tokens — clinical teal/navy theme (matches the MedCare reference).
// Keys are kept stable so every view picks up the new look automatically:
// "blue" is now the primary teal accent.
export const COLORS = {
  ink: "#0F2A33",       // headings, primary text
  inkSoft: "#5B6E76",   // secondary text
  cream: "#F6F9F9",     // page background
  card: "#FFFFFF",
  line: "#E2ECEB",      // borders & dividers
  mint: "#F1F8F7",      // subtle tinted panels, table header

  // Primary accent (teal)
  blue: "#17A393",
  blueDeep: "#0D7A6E",
  bluePale: "#E3F5F2",

  // Warning / pending
  yellow: "#F0A33A",
  yellowDeep: "#A15C08",
  yellowPale: "#FEF3E1",

  // Success
  green: "#23A26D",
  greenDeep: "#146B47",
  greenPale: "#E5F6EE",

  // Danger / overdue
  red: "#E0565B",
  redDeep: "#A42E33",
  redPale: "#FDECEC",

  // Info (sky) — used for "Contacted" style states
  sky: "#2E9BD6",
  skyDeep: "#17638F",
  skyPale: "#E6F3FB",

  slate: "#8A9BA2",

  // Sidebar
  navy: "#10262E",
  navyLine: "#1E3942",
  navyText: "#B7C7CC",
  navyActive: "#15463F",
};

export const CHART_COLORS = [COLORS.blue, COLORS.yellow, COLORS.sky, COLORS.red, "#8B7FD1", COLORS.slate];

export const FONT_SANS = "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
// Headings now use the same family (bold) as the reference; kept as a separate export for compatibility.
export const FONT_SERIF = FONT_SANS;

export const GLOBAL_FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');";
