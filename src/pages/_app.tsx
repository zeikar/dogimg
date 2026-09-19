import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";
import localFont from "next/font/local";
import { SITE_URL, getOgImageUrl } from "@/lib/og-url";

const SITE_HOME = `${SITE_URL}/`;
const SITE_OG_IMAGE = getOgImageUrl(SITE_HOME);
const PAGE_TITLE = "DOGimg: Open Graph Image Generator for Any URL";
// The brand goes in og:site_name, which the card (and most unfurls) show
// separately from the title.
const SHARE_TITLE = "Turn any URL into an Open Graph image";
const DESCRIPTION =
  "Add one og:image tag and every page you share gets its own 1200×630 preview card. Free dynamic Open Graph image API: nothing to design, nothing to deploy.";

// The same files the cards are rendered with, so the page and its output share
// a typeface.
const notoSans = localFont({
  src: [
    { path: "../assets/fonts/noto-sans-latin-400.woff", weight: "400" },
    { path: "../assets/fonts/noto-sans-latin-700.woff", weight: "700" },
  ],
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_HOME} />
        <meta property="og:site_name" content="DOGimg" />
        <meta property="og:title" content={SHARE_TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={SITE_OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="The Open Graph card DOGimg generates for its own home page"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SHARE_TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={SITE_OG_IMAGE} />
        <link rel="canonical" href={SITE_HOME} />
        <link rel="apple-touch-icon" href="/dog.svg" />
        <meta name="theme-color" content="#67e8f9" />
        <meta name="msapplication-TileColor" content="#67e8f9" />
        <meta name="msapplication-TileImage" content="/dog.svg" />
        <meta name="application-name" content="DOGimg" />
        <meta name="apple-mobile-web-app-title" content="DOGimg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/dog.svg" />
      </Head>
      <div className={notoSans.className}>
        <Component {...pageProps} />
      </div>
      <Analytics />
    </>
  );
}
