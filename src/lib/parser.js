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
    return rel && rel.includes("icon");
  });
  return faviconTag.getAttribute("href");
}

function parseTitleFromHTML(html) {
  const root = parse(html);
  return root.querySelector("title").text;
}

function getFaviconUrl(url, faviconUrl) {
  if (faviconUrl.startsWith("http")) {
    return faviconUrl;
  }

  const baseUrl = url.split("/").slice(0, 3).join("/");
  if (faviconUrl.startsWith("/")) {
    return baseUrl + faviconUrl;
  }
  return baseUrl + "/favicon.ico";
}

export const getSiteMetaDataFromHTML = (url, html) => {
  const metaTags = parseMetaTagsFromHTML(html);
  const favicon = getFaviconUrl(url, parseFaviconFromHTML(html));

  console.log(url, metaTags, favicon);
  return {
    title: metaTags["og:title"] || parseTitleFromHTML(html),
    description: metaTags["og:description"] || "",
    site_name: metaTags["og:site_name"] || "",
    color: metaTags["theme-color"] || "#cccccc",
    favicon: favicon || "",
  };
};
