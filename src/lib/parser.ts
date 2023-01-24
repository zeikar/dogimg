import { MetaData } from "../types/metadata";

export const getSiteMetaDataFromMetaTags = (metaTags: any): MetaData => {
  return {
    title: metaTags["og:title"] || "",
    description: metaTags["og:description"] || "",
    site_name: metaTags["og:site_name"] || "",
  };
};
