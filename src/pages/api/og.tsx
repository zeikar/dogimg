import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { fetchHTML } from "@/lib/fetch";
import { getSiteMetaDataFromHTML } from "@/lib/parser";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ?url=<url>
    const hasUrl = searchParams.has("url");
    const url = hasUrl
      ? searchParams.get("url")
      : "https://github.com/kubernetes/kubernetes";

    const html = await fetchHTML(url);
    const metaData = getSiteMetaDataFromHTML(url, html);

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            // linear-gradient
            background: `linear-gradient(0, ${metaData.color} 0%, #ffffff 30%)`,
          }}
        >
          <div
            style={{
              display: "flex",
              margin: "40px",
              fontSize: "50px",
              color: "#222222",
            }}
          >
            <img width="100" height="100" src={metaData.favicon} />
            <div
              style={{
                margin: "auto 0px auto 10px",
              }}
            >
              {metaData.site_name}
            </div>
          </div>
          <div
            style={{
              margin: "0px 40px 0px 40px",
              maxHeight: "200px",
              fontSize: "70px",
              fontWeight: "700",
              color: "#333333",
              textOverflow: "ellipsis",
              lineHeight: "100%",
              wordBreak: "break-word",
            }}
          >
            {metaData.title}
          </div>
          <div
            style={{
              margin: "40px",
              fontSize: "30px",
              color: "#555555",
            }}
          >
            {metaData.description}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        debug: true,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
