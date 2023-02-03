import { parse } from "node-html-parser";

function parseMetaTagsFromHTML(html) {
  const root = parse(html);
  const metaTags = root.querySelectorAll("meta");
  const metaTagsObject = {};
  metaTags.forEach((tag) => {
    const name = tag.getAttribute("property") || tag.getAttribute("name");
    const content = tag.getAttribute("content");
    if (name && content) {
      metaTagsObject[name] = content;
    }
  });
  return metaTagsObject;
}

function parseFaviconFromHTML(html) {
  const root = parse(html);
  const linkTags = root.querySelectorAll("link");
  const faviconTag = linkTags.find((tag) => {
    const rel = tag.getAttribute("rel");
    return (
      rel && rel.includes("icon") && !tag.getAttribute("href").endsWith(".ico")
    ); // 현재 ico 파일은 satori에서 지원하지 않음
  });
  if (!faviconTag) {
    return "";
  }
  return faviconTag.getAttribute("href");
}

function parseTitleFromHTML(html) {
  const titleTag = parse(html).querySelector("title");
  return (titleTag && titleTag.text) || "";
}

function getFaviconUrl(url, faviconUrl) {
  if (faviconUrl.startsWith("http")) {
    return faviconUrl;
  }

  const baseUrl = getBaseUrl(url);
  if (faviconUrl.startsWith("/")) {
    return baseUrl + faviconUrl;
  }
  return "";
  //return baseUrl + "/favicon.ico";
}

function getBaseUrl(url) {
  return url.split("/").slice(0, 3).join("/");
}

function getHostname(url) {
  const urlObject = new URL(url);
  return urlObject.hostname;
}

function getValidColor(color = "#bbbbbb") {
  return color.startsWith("#") ? color : "#bbbbbb";
}

export const getSiteMetaDataFromHTML = (url, html) => {
  const metaTags = parseMetaTagsFromHTML(html);
  const favicon = getFaviconUrl(url, parseFaviconFromHTML(html));

  console.log(url, metaTags, favicon);
  return {
    title: metaTags["og:title"] || parseTitleFromHTML(html),
    description: metaTags["og:description"] || "",
    site_name: metaTags["og:site_name"] || getHostname(url),
    color: getValidColor(metaTags["theme-color"]),
    favicon: favicon || "",
  };
};
