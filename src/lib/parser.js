import { parse } from "node-html-parser";

function parseMetaTagsFromRoot(root) {
  const metaTags = root.querySelectorAll("meta");
  const metaTagsObject = {};
  metaTags.forEach((tag) => {
    const name =
      (tag.getAttribute("property") || tag.getAttribute("name") || "").trim();
    const content = tag.getAttribute("content");
    if (name && content) {
      metaTagsObject[name] = content;
    }
  });
  return metaTagsObject;
}

function parseThemeColorFromRoot(root) {
  const themeColorTags = root.querySelectorAll("meta").filter((tag) => {
    const name = (tag.getAttribute("name") || "").toLowerCase();
    return name === "theme-color" && tag.getAttribute("content");
  });

  if (themeColorTags.length === 0) {
    return "";
  }

  const lightThemeColor = themeColorTags.find((tag) => {
    const media = (tag.getAttribute("media") || "").toLowerCase();
    return media.includes("prefers-color-scheme: light");
  });
  if (lightThemeColor) {
    return lightThemeColor.getAttribute("content");
  }

  const noMediaThemeColor = themeColorTags.find(
    (tag) => !tag.getAttribute("media")
  );
  if (noMediaThemeColor) {
    return noMediaThemeColor.getAttribute("content");
  }

  return themeColorTags[0].getAttribute("content");
}

function scoreFaviconCandidate(tag) {
  const rel = (tag.getAttribute("rel") || "").toLowerCase();
  const type = (tag.getAttribute("type") || "").toLowerCase();
  const sizes = (tag.getAttribute("sizes") || "").toLowerCase().trim();

  // SVG is resolution-independent — always preferred when available.
  if (type === "image/svg+xml") {
    return Number.MAX_SAFE_INTEGER;
  }

  // sizes="any" typically marks a vector or multi-resolution asset.
  if (sizes === "any") {
    return Number.MAX_SAFE_INTEGER - 1;
  }

  // Pick the largest declared dimension, e.g. "192x192" or "16x16 32x32".
  let bestArea = 0;
  for (const match of sizes.matchAll(/(\d+)\s*x\s*(\d+)/g)) {
    const area = Number(match[1]) * Number(match[2]);
    if (area > bestArea) {
      bestArea = area;
    }
  }

  if (bestArea > 0) {
    return bestArea;
  }

  // Apple touch icons are conventionally 180x180 even when sizes is omitted.
  if (rel.includes("apple-touch-icon")) {
    return 180 * 180;
  }

  return 0;
}

function parseFaviconFromRoot(root) {
  const candidates = root.querySelectorAll("link").filter((tag) => {
    const rel = (tag.getAttribute("rel") || "").toLowerCase();
    const href = tag.getAttribute("href") || "";
    if (!href || /\.ico($|\?)/i.test(href)) {
      return false;
    }
    return rel.includes("icon");
  });

  if (candidates.length === 0) {
    return "";
  }

  let best = candidates[0];
  let bestScore = scoreFaviconCandidate(best);
  for (let i = 1; i < candidates.length; i++) {
    const score = scoreFaviconCandidate(candidates[i]);
    if (score > bestScore) {
      best = candidates[i];
      bestScore = score;
    }
  }

  return best.getAttribute("href");
}

function parseTitleFromRoot(root) {
  const titleTag = root.querySelector("title");
  return (titleTag && titleTag.text) || "";
}

function resolveDescription(metaTags) {
  return (
    metaTags["og:description"] ||
    metaTags["twitter:description"] ||
    metaTags.description ||
    ""
  );
}

function getFaviconUrl(pageUrl, faviconUrl) {
  if (!faviconUrl) {
    return "";
  }

  try {
    return new URL(faviconUrl, pageUrl).toString();
  } catch {
    return "";
  }
}

function getHostname(url) {
  const urlObject = new URL(url);
  return urlObject.hostname;
}

function getValidColor(color = "#bbbbbb") {
  if (!color || typeof color !== "string") {
    return "#bbbbbb";
  }
  return color.startsWith("#") ? color : "#bbbbbb";
}

export const getSiteMetaDataFromHTML = (url, html) => {
  const root = parse(html);
  const metaTags = parseMetaTagsFromRoot(root);
  const favicon = getFaviconUrl(url, parseFaviconFromRoot(root));
  const themeColor = parseThemeColorFromRoot(root);

  console.log(url, metaTags, favicon, themeColor);

  return {
    title: metaTags["og:title"] || parseTitleFromRoot(root),
    description: resolveDescription(metaTags),
    site_name: metaTags["og:site_name"] || getHostname(url),
    color: getValidColor(themeColor),
    favicon: favicon || "",
  };
};
