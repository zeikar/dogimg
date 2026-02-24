import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { fetchHTML } from "@/lib/fetch";
import { getSiteMetaDataFromHTML } from "@/lib/parser";
import { resolveRenderableFaviconUrl } from "@/lib/favicon";
import {
  getAccentGradientColors,
  getHostnameLabel,
  getMonogram,
  shortenString,
} from "@/lib/og-card";

export const config = {
  runtime: "edge",
};

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

export default async function handler(req: NextRequest) {
  try {
    const url = getURLFromRequest(req);
    const html = await fetchHTML(url);
    const metaData = getSiteMetaDataFromHTML(url, html);
    console.log(metaData);
    const { accentStrong, accentSoft } = getAccentGradientColors(metaData.color);
    const siteName = shortenString(metaData.site_name, 30) || "Website";
    const title = shortenString(metaData.title, 66) || siteName;
    const description = shortenString(metaData.description, 180);
    const hostnameLabel = getHostnameLabel(url);
    const favicon = await resolveRenderableFaviconUrl(metaData.favicon, url);

    return new ImageResponse(
      (
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
