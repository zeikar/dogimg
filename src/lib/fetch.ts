const cheerio = require("cheerio");

// get meta tags from url
export const getMetaTags = async (url: string) => {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const metaTags = $("meta")
    .toArray()
    .reduce((acc: any, tag: any) => {
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
export const getFavicon = async (url: string) => {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const favicon = $("link[rel='icon']")
    .toArray()
    .reduce((acc: any, tag: any) => {
      const { href } = tag.attribs;
      if (href) {
        acc = href;
      }
      return acc;
    }, {});

  return favicon;
};
