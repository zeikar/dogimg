import { load } from "cheerio";

function parseMetaTagsFromHTML(html) {
  const $ = load(html);
  const metaTags = $("meta")
    .toArray()
    .reduce((acc, tag) => {
      const { name, property, content } = tag.attribs;
      if (name || property) {
        acc[name || property] = content;
      }
      return acc;
    }, {});

  console.log(metaTags);
  return metaTags;
}

function parseFaviconFromHTML(html) {
  const $ = load(html);
  const favicon = $("link[rel='icon']")
    .toArray()
    .reduce((acc, tag) => {
      const { href } = tag.attribs;
      if (href) {
        acc = href;
      }
      return acc;
    }, "");

  return favicon;
}

function parseTitleFromHTML(html) {
  const $ = load(html);
  const title = $("title").text();
  return title;
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

  return {
    title: metaTags["og:title"] || parseTitleFromHTML(html),
    description: metaTags["og:description"] || "",
    site_name: metaTags["og:site_name"] || "",
    color: metaTags["theme-color"] || "",
    favicon: favicon || "",
  };
};
