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

function parseFaviconFromRoot(root) {
  const linkTags = root.querySelectorAll("link");
  const faviconTag = linkTags.find((tag) => {
    const rel = (tag.getAttribute("rel") || "").toLowerCase();
    const href = tag.getAttribute("href") || "";
    return rel.includes("icon") && href && !/\.ico($|\?)/i.test(href);
  });

  if (!faviconTag) {
    return "";
  }

  return faviconTag.getAttribute("href");
}

function parseTitleFromRoot(root) {
  const titleTag = root.querySelector("title");
  return (titleTag && titleTag.text) || "";
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
    description: metaTags["og:description"] || "",
    site_name: metaTags["og:site_name"] || getHostname(url),
    color: getValidColor(themeColor),
    favicon: favicon || "",
  };
};
