import { createImage } from "../lib/image";
import { getMetaTags } from "../lib/fetch";
import { getSiteMetaDataFromMetaTags } from "../lib/parser";

export const generateOGImage = async (url: string) => {
  const metaTags = await getMetaTags(url);
  const metaData = getSiteMetaDataFromMetaTags(metaTags);
  var img = await createImage(metaData);
  return img;
};
