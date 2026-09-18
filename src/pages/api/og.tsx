import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { fetchHTML } from "@/lib/fetch";
import { getSiteMetaDataFromHTML } from "@/lib/parser";
import { resolveRenderableFaviconUrl } from "@/lib/favicon";
import { InvalidTargetUrlError, normalizeTargetUrl } from "@/lib/target-url";
import {
  getAccentGradientColors,
  getHostnameLabel,
  getMonogram,
  shortenString,
} from "@/lib/og-card";

export const config = {
  runtime: "edge",
};

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
  accentStrong: string;
  accentSoft: string;
}

function OgCard({
  siteName,
  hostnameLabel,
  title,
  description,
  favicon,
  accentStrong,
  accentSoft,
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
        width: "100%",
        height: "100%",
        padding: "52px 44px 58px",
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
        {siteName ? (
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
                marginBottom: showHostname ? "8px" : "0px",
              }}
            >
              {siteName}
            </div>
            {showHostname ? (
              <div
                style={{
                  fontSize: "26px",
                  color: "rgba(17, 24, 39, 0.62)",
                }}
              >
                {hostnameLabel}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div
        style={{
          fontSize: "66px",
          fontWeight: "700",
          color: "#111827",
          lineHeight: "1.08",
          wordBreak: "break-word",
          marginBottom: description ? "34px" : "0px",
        }}
      >
        {title}
      </div>
      {description ? (
        <div
          style={{
            fontSize: "34px",
            lineHeight: "1.28",
            color: "rgba(17, 24, 39, 0.72)",
          }}
        >
          {description}
        </div>
      ) : null}
    </div>
  );
}

// A crawler that gets a 500 shows nothing at all, so a failed lookup still
// renders a card — just a bare one built from the hostname.
function renderFallbackCard(url: string) {
  const hostnameLabel = getHostnameLabel(url);
  const { accentStrong, accentSoft } = getAccentGradientColors("");

  return new ImageResponse(
    (
      <OgCard
        siteName=""
        hostnameLabel={hostnameLabel}
        title={hostnameLabel}
        description=""
        favicon=""
        accentStrong={accentStrong}
        accentSoft={accentSoft}
      />
    ),
    { ...IMAGE_SIZE, headers: { "cache-control": FALLBACK_CACHE_CONTROL } }
  );
}

export default async function handler(req: NextRequest) {
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
    const { accentStrong, accentSoft } = getAccentGradientColors(metaData.color);
    const siteName = shortenString(metaData.site_name, 30) || "Website";
    const title = shortenString(metaData.title, 66) || siteName;
    const description = shortenString(metaData.description, 180);
    const favicon = await resolveRenderableFaviconUrl(metaData.favicon, url);

    // Never log `favicon` itself: it is a base64 data URL, often megabytes.
    console.log(
      `[og] url=${url} site="${siteName}" title="${title}" desc=${description.length} ` +
        `color=${metaData.color} faviconSrc=${metaData.favicon || "none"} ` +
        `faviconResolved=${favicon ? "yes" : "no"}`
    );

    return new ImageResponse(
      (
        <OgCard
          siteName={siteName}
          hostnameLabel={hostnameLabel}
          title={title}
          description={description}
          favicon={favicon}
          accentStrong={accentStrong}
          accentSoft={accentSoft}
        />
      ),
      { ...IMAGE_SIZE, headers: { "cache-control": CARD_CACHE_CONTROL } }
    );
  } catch (e) {
    console.error(`[og] falling back to a bare card for ${url}:`, e);

    try {
      return renderFallbackCard(url);
    } catch (fallbackError) {
      console.error("[og] fallback card failed:", fallbackError);
      return new Response("Failed to generate the image", { status: 500 });
    }
  }
}
