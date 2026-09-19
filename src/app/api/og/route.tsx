import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { fetchHTML } from "@/lib/fetch";
import { getSiteMetaDataFromHTML } from "@/lib/parser";
import { resolveRenderableFavicon } from "@/lib/favicon";
import { InvalidTargetUrlError, normalizeTargetUrl } from "@/lib/target-url";
import {
  getCardPalette,
  getHostnameLabel,
  getMonogram,
  getTitleFontSize,
  shortenString,
  stripSiteName,
} from "@/lib/og-card";
import { FONT_STACK, loadCardFonts } from "@/lib/og-fonts";
import { FALLBACK_HEADER } from "@/lib/og-url";

const DEFAULT_TARGET_URL = "https://github.com/zeikar/dogimg";

// Long enough that crawlers hit the CDN, short enough that an edited page
// gets a refreshed card. The previous default was immutable for a year.
const CARD_CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
// A fallback card reflects a transient failure, so it must expire quickly.
const FALLBACK_CACHE_CONTROL = "public, max-age=60, s-maxage=300";
const REJECTED_CACHE_CONTROL = "public, max-age=3600";

const IMAGE_SIZE = { width: 1200, height: 630 };

function getTargetUrl(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requested = searchParams.get("url")?.trim();

  return normalizeTargetUrl(requested || DEFAULT_TARGET_URL);
}

interface OgCardProps {
  siteName: string;
  hostnameLabel: string;
  title: string;
  description: string;
  favicon: string;
  palette: ReturnType<typeof getCardPalette>;
}

// Korean may break between any two syllables by default, which splits words
// mid-way ("백/과사전"). keep-all wraps at spaces, the way Korean is typeset.
// Everything else keeps break-word so an unbroken token can't overflow.
function getWordBreak(text: string) {
  return /[\uac00-\ud7af]/.test(text) ? "keep-all" : "break-word";
}

const ICON_TILE_STYLE = {
  display: "flex",
  width: "72px",
  height: "72px",
  borderRadius: "16px",
  marginRight: "20px",
  overflow: "hidden",
  background: "#ffffff",
  border: "1px solid rgba(0, 0, 0, 0.08)",
} as const;

function OgCard({
  siteName,
  hostnameLabel,
  title,
  description,
  favicon,
  palette,
}: OgCardProps) {
  // Most sites omit og:site_name, in which case site_name is already the
  // hostname — showing it twice just wastes the header.
  const showHostname =
    Boolean(siteName) &&
    siteName.toLowerCase().replace(/^www\./, "") !== hostnameLabel.toLowerCase();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        // The header pins to the top and the text to the bottom, so a page
        // with a one-word title still fills the card instead of leaving the
        // lower half empty.
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "64px 72px 72px",
        fontFamily: FONT_STACK,
        color: palette.ink,
        backgroundColor: "#ffffff",
        // Both glows hug the right edge, clear of where the left-aligned text starts.
        backgroundImage:
          `radial-gradient(circle at right top, ${palette.accentGlow} 0%, rgba(255, 255, 255, 0) 58%), ` +
          `radial-gradient(circle at right bottom, ${palette.accentAltGlow} 0%, rgba(255, 255, 255, 0) 42%)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {favicon ? (
          <div style={ICON_TILE_STYLE}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              width="72"
              height="72"
              alt=""
              src={favicon}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        ) : (
          <div
            style={{
              ...ICON_TILE_STYLE,
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 700,
              color: "#ffffff",
              background: palette.accent,
              border: "none",
            }}
          >
            {getMonogram(hostnameLabel)}
          </div>
        )}
        {siteName ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "34px", fontWeight: 700, lineHeight: 1.15 }}>
              {siteName}
            </div>
            {showHostname ? (
              <div
                style={{ fontSize: "24px", lineHeight: 1.3, color: palette.muted }}
              >
                {hostnameLabel}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "block",
            lineClamp: 3,
            fontSize: `${getTitleFontSize(title)}px`,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            wordBreak: getWordBreak(title),
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              display: "block",
              lineClamp: 3,
              marginTop: "24px",
              fontSize: "30px",
              lineHeight: 1.4,
              color: palette.muted,
              wordBreak: getWordBreak(description),
            }}
          >
            {description}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// A crawler that gets a 500 shows nothing at all, so a failed lookup still
// renders a card — just a bare one built from the hostname.
async function renderFallbackCard(url: string) {
  const hostnameLabel = getHostnameLabel(url);

  return new ImageResponse(
    (
      <OgCard
        siteName=""
        hostnameLabel={hostnameLabel}
        title={hostnameLabel}
        description=""
        favicon=""
        palette={getCardPalette("", hostnameLabel)}
      />
    ),
    {
      ...IMAGE_SIZE,
      fonts: await loadCardFonts(hostnameLabel),
      headers: { "cache-control": FALLBACK_CACHE_CONTROL, [FALLBACK_HEADER]: "1" },
    }
  );
}

export async function GET(req: NextRequest) {
  let url: string;
  try {
    url = getTargetUrl(req);
  } catch (e) {
    const message =
      e instanceof InvalidTargetUrlError ? e.message : "Invalid url parameter.";
    console.error("[og] rejected target url:", e);
    return new Response(message, {
      status: 400,
      headers: { "cache-control": REJECTED_CACHE_CONTROL },
    });
  }

  const hostnameLabel = getHostnameLabel(url);

  try {
    const html = await fetchHTML(url);
    const metaData = getSiteMetaDataFromHTML(url, html);
    const siteName = shortenString(metaData.site_name, 30) || "Website";
    const title =
      shortenString(
        stripSiteName(metaData.title, metaData.site_name, hostnameLabel),
        66
      ) || siteName;
    const description = shortenString(metaData.description, 180);
    const [favicon, fonts] = await Promise.all([
      resolveRenderableFavicon(metaData.favicon, url),
      loadCardFonts(siteName + title + description),
    ]);
    const palette = getCardPalette(metaData.color, hostnameLabel, favicon.color);

    // Never log `favicon.src` itself: it is a base64 data URL, often megabytes.
    console.log(
      `[og] url=${url} site="${siteName}" title="${title}" desc=${description.length} ` +
        `color=${metaData.color} faviconSrc=${metaData.favicon || "none"} ` +
        `faviconResolved=${favicon.src ? "yes" : "no"} ` +
        `iconColor=${favicon.color ? Object.values(favicon.color).join(",") : "none"}`
    );

    return new ImageResponse(
      (
        <OgCard
          siteName={siteName}
          hostnameLabel={hostnameLabel}
          title={title}
          description={description}
          favicon={favicon.src}
          palette={palette}
        />
      ),
      { ...IMAGE_SIZE, fonts, headers: { "cache-control": CARD_CACHE_CONTROL } }
    );
  } catch (e) {
    console.error(`[og] falling back to a bare card for ${url}:`, e);

    try {
      return await renderFallbackCard(url);
    } catch (fallbackError) {
      console.error("[og] fallback card failed:", fallbackError);
      return new Response("Failed to generate the image", { status: 500 });
    }
  }
}
