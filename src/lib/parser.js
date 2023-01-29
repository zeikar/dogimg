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

  console.log(favicon);
  return favicon;
}

export const getSiteMetaDataFromHTML = (html) => {
  const metaTags = parseMetaTagsFromHTML(html);
  const favicon = parseFaviconFromHTML(html);

  return {
    title: metaTags["og:title"] || "",
    description: metaTags["og:description"] || "",
    site_name: metaTags["og:site_name"] || "",
    favicon: favicon || "",
  };
};
