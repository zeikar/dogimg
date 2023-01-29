import { load } from "cheerio";

// get meta tags from url
export const getMetaTags = async (url) => {
  const response = await fetch(url);
  const html = await response.text();
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
};

// get favicon from url
export const getFavicon = async (url) => {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const favicon = $("link[rel='icon']")
    .toArray()
    .reduce((acc, tag) => {
      const { href } = tag.attribs;
      if (href) {
        acc = href;
      }
      return acc;
    }, {});

  return favicon;
};
