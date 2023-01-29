import { createImage } from "../lib/image.js";
import { fetchHTML } from "../lib/fetch.js";
import { getSiteMetaDataFromHTML } from "../lib/parser.js";

export const generateOGImage = async (url) => {
  const html = await fetchHTML(url);
  const metaData = getSiteMetaDataFromHTML(url, html);
  console.log(metaData);
  const img = await createImage(metaData);
  return img;
};
