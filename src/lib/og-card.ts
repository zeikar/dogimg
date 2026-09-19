import { parseColor } from "./color.js";

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

// Hand-picked so each one still looks deliberate at the fixed saturation and
// lightness below; a bare `hash % 360` lands on muddy olives and browns.
const FALLBACK_HUES = [4, 24, 40, 150, 172, 192, 210, 228, 250, 268, 292, 332];

// RGB spread below which a color reads as gray, black or white. HSL saturation
// can't make this call: #fffbeb is "100% saturated" and still looks white.
const MIN_CHROMA = 0.15;

// Title tiers: the widest size whose worst case still fits the line budget.
const TITLE_SIZES = [
  { maxLength: 24, fontSize: 88 },
  { maxLength: 44, fontSize: 72 },
];
const TITLE_MIN_SIZE = 60;

const WIDE_CHARACTERS =
  /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/g;

export function shortenString(str: string, maxLength: number) {
  if (!str) {
    return "";
  }

  const normalized = str.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliced = normalized.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.6) {
    return `${sliced.slice(0, lastSpace).trim()}...`;
  }

  return `${sliced.trim()}...`;
}

export function getHostnameLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "website";
  }
}

export function getMonogram(label: string) {
  const cleaned = label.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return cleaned.slice(0, 2) || "OG";
}

// CJK glyphs are about twice as wide as Latin ones, so a title's character
// count alone would put a Korean headline in a tier it overflows.
export function getTitleFontSize(title: string) {
  const length = title.length + (title.match(WIDE_CHARACTERS)?.length ?? 0);
  const tier = TITLE_SIZES.find(({ maxLength }) => length <= maxLength);
  return tier ? tier.fontSize : TITLE_MIN_SIZE;
}

// Every color on the card comes from one hue. A site's theme-color supplies it
// when it has one worth using; most declare white, black or nothing, and those
// get a hue picked from the hostname so the same site always looks the same.
export function getCardPalette(themeColor: string, seed: string) {
  const declared = parseColor(themeColor);
  const base =
    declared && getChroma(declared) >= MIN_CHROMA
      ? clampToAccentRange(rgbToHsl(declared))
      : { h: pickFallbackHue(seed), s: 0.74, l: 0.56 };
  // The second glow is a neighboring hue. Warm hues turn toward red because
  // the other way lands in yellow-green, the one band that looks sickly next
  // to everything.
  const alt = { ...base, h: (base.h + (base.h < 90 ? 330 : 30)) % 360 };

  return {
    accent: hslToCss(base),
    accentGlow: hslToCss(base, 0.5),
    accentAltGlow: hslToCss(alt, 0.32),
    ink: hslToCss({ h: base.h, s: 0.35, l: 0.1 }),
    muted: hslToCss({ h: base.h, s: 0.12, l: 0.38 }),
  };
}

function getChroma({ r, g, b }: Rgb) {
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}

// A navy or a pastel keeps its hue but is pulled to where it works as an
// accent on a white card.
function clampToAccentRange({ h, s, l }: Hsl) {
  return {
    h,
    s: Math.min(0.9, Math.max(0.55, s)),
    l: Math.min(0.62, Math.max(0.45, l)),
  };
}

function pickFallbackHue(seed: string) {
  // FNV-1a: tiny, and spreads similar hostnames across the list.
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 0x01000193);
  }
  return FALLBACK_HUES[(hash >>> 0) % FALLBACK_HUES.length];
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) {
    return { h: 0, s: 0, l };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) {
    h = ((gn - bn) / delta) % 6;
  } else if (max === gn) {
    h = (bn - rn) / delta + 2;
  } else {
    h = (rn - gn) / delta + 4;
  }

  return { h: (h * 60 + 360) % 360, s, l };
}

// Emitted as rgb()/rgba() rather than hsl(): the strings end up in SVG
// gradient stops, where hsl() support is not a given.
function hslToCss({ h, s, l }: Hsl, alpha = 1) {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;
  const [r1, g1, b1] = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ][Math.floor(h / 60) % 6];
  const [r, g, b] = [r1, g1, b1].map((value) => Math.round((value + m) * 255));

  return alpha >= 1
    ? `rgb(${r}, ${g}, ${b})`
    : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
