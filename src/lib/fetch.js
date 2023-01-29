// get html from url
export const fetchHTML = async (url) => {
  const response = await fetch(url);
  const html = await response.text();
  return html;
};
