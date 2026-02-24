// get html from url
export const fetchHTML = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch HTML: ${response.status}`);
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html")) {
      throw new Error(`Invalid content-type: ${contentType || "unknown"}`);
    }

    const html = await response.text();
    // Keep memory usage stable for very large pages.
    return html.slice(0, 2_000_000);
  } finally {
    clearTimeout(timeout);
  }
};
