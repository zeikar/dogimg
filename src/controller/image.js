import { createImage } from "../lib/image.js";
import { getMetaTags } from "../lib/fetch.js";
import { getSiteMetaDataFromMetaTags } from "../lib/parser.js";

export const generateOGImage = async (url) => {
  const metaTags = await getMetaTags(url);
  const metaData = getSiteMetaDataFromMetaTags(metaTags);
  var img = await createImage(metaData);
  return img;
};
