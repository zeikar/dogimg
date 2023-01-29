export const getSiteMetaDataFromMetaTags = (metaTags) => {
  return {
    title: metaTags["og:title"] || "",
    description: metaTags["og:description"] || "",
    site_name: metaTags["og:site_name"] || "",
  };
};
