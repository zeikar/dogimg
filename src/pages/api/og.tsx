import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { fetchHTML } from "@/lib/fetch";
import { getSiteMetaDataFromHTML } from "@/lib/parser";

export const config = {
  runtime: "edge",
};

const FALLBACK_ACCENT_HEX = "#7dd3fc";

function getURLFromRequest(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let url = searchParams.get("url")?.trim();

  if (!url) {
    return "https://github.com/zeikar/dogimg";
  }

  if (!url.startsWith("http")) {
    url = `http://${url}`;
  }

  return url;
}

function shortenString(str: string, maxLength: number) {
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

function blendRgb(base: { r: number; g: number; b: number }, mixWith: { r: number; g: number; b: number }, mixRatio: number) {
  const ratio = Math.max(0, Math.min(1, mixRatio));
  const baseRatio = 1 - ratio;
  return {
    r: Math.round(base.r * baseRatio + mixWith.r * ratio),
    g: Math.round(base.g * baseRatio + mixWith.g * ratio),
    b: Math.round(base.b * baseRatio + mixWith.b * ratio),
  };
}

function getLuminance(rgb: { r: number; g: number; b: number }) {
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

function rgbToCss(rgb: { r: number; g: number; b: number }, alpha = 1) {
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

function getHostnameLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "website";
  }
}

function getMonogram(label: string) {
  const cleaned = label.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return cleaned.slice(0, 2) || "OG";
}

export default async function handler(req: NextRequest) {
  try {
    const url = getURLFromRequest(req);
    const html = await fetchHTML(url);
    const metaData = getSiteMetaDataFromHTML(url, html);
    console.log(metaData);
    const accentRgb = getBalancedAccentColor(metaData.color);
    const accentStrong = rgbToCss(accentRgb, 0.92);
    const accentSoft = rgbToCss(accentRgb, 0.4);
    const siteName = shortenString(metaData.site_name, 30) || "Website";
    const title = shortenString(metaData.title, 66) || siteName;
    const description =
      shortenString(metaData.description, 180) ||
      "Generate polished Open Graph previews from any webpage URL.";
    const hostnameLabel = getHostnameLabel(url);
    const favicon = metaData.favicon;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: "44px",
            backgroundColor: "#ffffff",
            backgroundImage: `linear-gradient(to top, ${accentStrong} 0%, ${accentSoft} 24%, #ffffff 56%)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "28px",
            }}
          >
            {favicon ? (
              <div
                style={{
                  display: "flex",
                  width: "92px",
                  height: "92px",
                  borderRadius: "20px",
                  marginRight: "18px",
                  overflow: "hidden",
                  background: "#ffffff",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                <img
                  width="92"
                  height="92"
                  alt=""
                  src={favicon}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "92px",
                  height: "92px",
                  borderRadius: "20px",
                  marginRight: "18px",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "38px",
                  fontWeight: "700",
                  color: "rgba(17, 24, 39, 0.9)",
                  background: "rgba(255, 255, 255, 0.86)",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                {getMonogram(hostnameLabel)}
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: "50px",
                  color: "#1f2937",
                  fontWeight: "600",
                  lineHeight: "1",
                  marginBottom: "8px",
                }}
              >
                {siteName}
              </div>
              <div
                style={{
                  fontSize: "26px",
                  color: "rgba(17, 24, 39, 0.62)",
                }}
              >
                {hostnameLabel}
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: "66px",
              fontWeight: "700",
              color: "#111827",
              lineHeight: "1.08",
              wordBreak: "break-word",
              marginBottom: "30px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "34px",
              lineHeight: "1.28",
              color: "rgba(17, 24, 39, 0.72)",
            }}
          >
            {description}
          </div>
          <div
            style={{
              marginTop: "auto",
              borderTop: "1px solid rgba(17, 24, 39, 0.1)",
              paddingTop: "18px",
              fontSize: "20px",
              color: "rgba(17, 24, 39, 0.45)",
            }}
          >
            Generated by DOGimg
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
