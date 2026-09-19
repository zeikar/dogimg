import React, { useState } from "react";
import { SITE_URL, getOgImageUrl } from "@/lib/og-url";

interface ClipboardProps {
  // Empty until the visitor generates a card of their own.
  url: string;
}

const PLACEHOLDER_URL = "https://your-site.com/post";

const escapeHtmlAttribute = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

const SNIPPETS = {
  HTML: (url: string) =>
    `<meta property="og:image" content="${escapeHtmlAttribute(getOgImageUrl(url))}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />`,
  "Next.js": (url: string) =>
    `export async function generateMetadata() {
  const pageUrl = ${JSON.stringify(url)};

  return {
    openGraph: {
      images: [
        \`${SITE_URL}/api/og?url=\${encodeURIComponent(pageUrl)}\`,
      ],
    },
  };
}`,
};

type Format = keyof typeof SNIPPETS;

const HINTS: Record<Format, React.ReactNode> = {
  HTML: (
    <>
      Paste these inside your page&apos;s <code className="font-mono">&lt;head&gt;</code>.
    </>
  ),
  "Next.js": (
    <>
      Export this from a page or layout in the App Router, with{" "}
      <code className="font-mono">pageUrl</code> set to the page&apos;s own address.
    </>
  ),
};

const Clipboard: React.FC<ClipboardProps> = ({ url }) => {
  const [format, setFormat] = useState<Format>("HTML");
  const [copied, setCopied] = useState("");
  const snippet = SNIPPETS[format](url || PLACEHOLDER_URL);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(snippet);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section aria-labelledby="add-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="add-title" className="text-xl font-bold tracking-tight">
          Add it to your page
        </h2>
        <div
          role="group"
          aria-label="Snippet format"
          className="flex border-b border-line text-sm font-bold"
        >
          {(Object.keys(SNIPPETS) as Format[]).map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={format === name}
              onClick={() => setFormat(name)}
              className="-mb-px border-b-2 border-transparent px-3 py-1 text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-ink aria-pressed:border-ink aria-pressed:text-ink"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-sm text-muted">{HINTS[format]}</p>

      {/* One block per line, so a line that wraps hangs under its own start
          instead of looking like the next tag. */}
      <pre className="mt-3 rounded-xl bg-ink p-4 font-mono text-[0.8125rem] leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-white/90">
        <code>
          {snippet.split("\n").map((line, index) => (
            <span key={index} className="block min-h-[1lh] pl-[2ch] -indent-[2ch]">
              {line}
            </span>
          ))}
        </code>
      </pre>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {copied === snippet ? "Copied" : `Copy ${format === "HTML" ? "meta tags" : "snippet"}`}
      </button>

      {url ? (
        <p className="mt-5 text-sm text-muted">
          Or use the image URL on its own:
          <a
            className="mt-1 block truncate font-mono text-[0.8125rem] text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-ink"
            href={getOgImageUrl(url)}
            target="_blank"
            rel="noreferrer"
          >
            {getOgImageUrl(url)}
          </a>
        </p>
      ) : null}
    </section>
  );
};

export default Clipboard;
