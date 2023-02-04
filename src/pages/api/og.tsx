import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { fetchHTML } from "@/lib/fetch";
import { getSiteMetaDataFromHTML } from "@/lib/parser";

export const config = {
  runtime: "edge",
};

function getURLFromRequest(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // ?url=<url>
  const hasUrl = searchParams.has("url");
  if (!hasUrl) {
    return "https://github.com/zeikar/zeikar";
  }

  const url = searchParams.get("url");
  if (url?.startsWith("http") === false) {
    return `http://${url}`;
  }

  return url;
}

// Shorten string without cutting words in JavaScript
function shortenString(str: string, maxLength: number) {
  let words = str.split(" ");
  let shortened = "";

  while (words.length > 0) {
    let word = words.shift();
    if ((shortened + word).length > maxLength) break;
    shortened += word + " ";
  }

  if (shortened.length < str.length) {
    shortened += "...";
  }
  return shortened;
}

export default async function handler(req: NextRequest) {
  try {
    const url = getURLFromRequest(req);
    const html = await fetchHTML(url);
    const metaData = getSiteMetaDataFromHTML(url, html);
    console.log(metaData);

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
            {
              // if metaData.favicon is undefined, then don't render the image
              metaData.favicon && (
                <img
                  width="100"
                  height="100"
                  src={metaData.favicon}
                  style={{
                    marginRight: "10px",
                  }}
                />
              )
            }
            <div
              style={{
                margin: "auto 0px auto 0px",
              }}
            >
              {shortenString(metaData.site_name, 30)}
            </div>
          </div>
          <div
            style={{
              margin: "0px 40px 0px 40px",
              minHeight: "100px",
              maxHeight: "200px",
              fontSize: "70px",
              fontWeight: "700",
              color: "#333333",
              lineHeight: "100%",
              wordBreak: "break-word",
            }}
          >
            {shortenString(metaData.title, 60)}
          </div>
          <div
            style={{
              margin: "40px",
              fontSize: "30px",
              color: "#555555",
            }}
          >
            {shortenString(metaData.description, 220)}
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
