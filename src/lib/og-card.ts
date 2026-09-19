import { isChromatic, parseColor, rgbToHsl } from "./color.js";

export type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

// Hand-picked so each one still looks deliberate at the fixed saturation and
// lightness below; a bare `hash % 360` lands on muddy olives and browns.
const FALLBACK_HUES = [4, 24, 40, 150, 172, 192, 210, 228, 250, 268, 292, 332];

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

// Matched against a title whose whitespace is already collapsed, so there is
// no `\s+` here to backtrack over. A pipe is a separator even with no spaces
// around it (the norm on Japanese sites, full-width included); everything else
// needs them, or "Self-hosting" and "TCP/IP" would split.
const TITLE_SEPARATOR = / ?[|｜] ?| (?:[-–—·•»/]|::?) /g;
// Far beyond anything the card can show; it only bounds the work done here.
const MAX_TITLE_LENGTH = 300;

function normalizeName(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

// The labels that sit between a brand and a country TLD: example.co.kr,
// example.com.au. Without a public-suffix list, this is what keeps "co" from
// being read as the brand.
const SECOND_LEVEL_SUFFIXES = new Set([
  "ac", "co", "com", "edu", "go", "gov", "ne", "net", "or", "org",
]);

// "stripe" for stripe.com, "example" for news.example.com.au.
function getBrandLabel(hostnameLabel: string) {
  const labels = hostnameLabel.split(".").slice(0, -1);
  if (labels.length > 1 && SECOND_LEVEL_SUFFIXES.has(labels[labels.length - 1])) {
    labels.pop();
  }
  return labels[labels.length - 1] ?? "";
}

function namesSite(segment: string, siteName: string, hostnameLabel: string) {
  const key = normalizeName(segment);
  if (!key) {
    return false;
  }
  if (key === normalizeName(siteName)) {
    return true;
  }
  // The looser matches below need some length to mean anything.
  if (key.length < 3) {
    return false;
  }
  if (key === normalizeName(getBrandLabel(hostnameLabel))) {
    return true;
  }

  // "MDN" for a site that calls itself "MDN Web Docs".
  return siteName.toLowerCase().startsWith(`${segment.trim().toLowerCase()} `);
}

// Pages routinely append or prepend their own name to the title. The card's
// header already says whose page it is, so repeating it only shrinks the type.
export function stripSiteName(
  rawTitle: string,
  siteName: string,
  hostnameLabel: string
) {
  // The title comes straight out of someone else's HTML and can be megabytes.
  const title = rawTitle.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE_LENGTH);
  const separators = [...title.matchAll(TITLE_SEPARATOR)];
  if (separators.length === 0) {
    return title;
  }

  const last = separators[separators.length - 1];
  if (namesSite(title.slice(last.index + last[0].length), siteName, hostnameLabel)) {
    return title.slice(0, last.index).trim() || title;
  }

  const first = separators[0];
  if (namesSite(title.slice(0, first.index), siteName, hostnameLabel)) {
    return title.slice(first.index + first[0].length).trim() || title;
  }

  return title;
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
// when it has one worth using, but most declare white, black or nothing. Then
// the favicon's own color is next — it sits on the card, so the glow has to
// agree with it — and a hue picked from the hostname is the last resort, so
// the same site always looks the same.
export function getCardPalette(
  themeColor: string,
  seed: string,
  iconColor: Rgb | null = null
) {
  const source = [parseColor(themeColor), iconColor].find(
    (color) => color && isChromatic(color)
  );
  const base = source
    ? clampToAccentRange(rgbToHsl(source))
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
