type Rgb = { r: number; g: number; b: number };

const FALLBACK_ACCENT_HEX = "#7dd3fc";

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

export function getAccentGradientColors(color: string) {
  const accentRgb = getBalancedAccentColor(color);
  return {
    accentStrong: rgbToCss(accentRgb, 0.92),
    accentSoft: rgbToCss(accentRgb, 0.4),
  };
}

function normalizeHexColor(color: string) {
  if (!color || typeof color !== "string" || !color.startsWith("#")) {
    return null;
  }

  const clean = color.slice(1).trim();
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return clean
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return clean;
  }

  return null;
}

function hexToRgb(color: string) {
  const normalized = normalizeHexColor(color);
  if (!normalized) {
    return null;
  }

  const intColor = Number.parseInt(normalized, 16);
  return {
    r: (intColor >> 16) & 255,
    g: (intColor >> 8) & 255,
    b: intColor & 255,
  };
}

function blendRgb(base: Rgb, mixWith: Rgb, mixRatio: number) {
  const ratio = Math.max(0, Math.min(1, mixRatio));
  const baseRatio = 1 - ratio;
  return {
    r: Math.round(base.r * baseRatio + mixWith.r * ratio),
    g: Math.round(base.g * baseRatio + mixWith.g * ratio),
    b: Math.round(base.b * baseRatio + mixWith.b * ratio),
  };
}

function getLuminance(rgb: Rgb) {
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

function rgbToCss(rgb: Rgb, alpha = 1) {
  if (alpha >= 1) {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getBalancedAccentColor(color: string) {
  const fallback = hexToRgb(FALLBACK_ACCENT_HEX) || { r: 125, g: 211, b: 252 };
  let rgb = hexToRgb(color) || fallback;
  const luminance = getLuminance(rgb);

  if (luminance < 0.22) {
    rgb = blendRgb(rgb, { r: 255, g: 255, b: 255 }, 0.35);
  } else if (luminance > 0.9) {
    rgb = blendRgb(rgb, { r: 30, g: 30, b: 30 }, 0.15);
  }

  return rgb;
}
