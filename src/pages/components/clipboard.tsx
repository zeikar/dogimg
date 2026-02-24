import React, { useState } from "react";

interface ClipboardProps {
  url: string;
}

const getOgImageUrl = (url: string) =>
  `https://dogimg.vercel.app/api/og?url=${url}`;

const escapeHtmlAttribute = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

const getMetaTag = (url: string) =>
  `<meta property="og:image" content="${escapeHtmlAttribute(
    getOgImageUrl(url)
  )}" />`;

const NEXT_METADATA_SNIPPET = `export async function generateMetadata() {
  const fullUrl = "https://your-site.com/your-page";

  return {
    openGraph: {
      images: [\`https://dogimg.vercel.app/api/og?url=\${fullUrl}\`],
    },
  };
}`;

const Clipboard: React.FC<ClipboardProps> = ({ url }) => {
  const [copiedUrl, setCopiedUrl] = useState("");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const isCopied = copiedUrl === url;
  const metaTag = getMetaTag(url);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(metaTag);
      setCopiedUrl(url);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyMetadataSnippet = async () => {
    try {
      await navigator.clipboard.writeText(NEXT_METADATA_SNIPPET);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 1200);
    } catch (error) {
      console.error(error);
    }
  };

  if (!url) {
    return null;
  }

  return (
    <section className="px-4 pt-1 pb-3 text-gray-700">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-700">Add to your site</h2>
          <button
            className={`transition duration-300 ease-in-out ${
              isCopied
                ? "bg-green-400 hover:bg-green-500"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white font-medium py-1.5 px-3 rounded focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
            onClick={handleCopyToClipboard}
          >
            {isCopied ? "Copied!" : "Copy meta tag"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Paste this tag inside your page&apos;s{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5">&lt;head&gt;</code>.
        </p>
        <pre className="mt-2 overflow-x-auto rounded border border-slate-200 bg-white p-2 text-xs text-slate-700 sm:text-sm">
          <code>{metaTag}</code>
        </pre>
        <p className="mt-2 break-all text-xs text-slate-500">
          OG URL: {getOgImageUrl(url)}
        </p>

        <div className="mt-4 border-t border-slate-200 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-700">
              Next.js metadata example
            </h3>
            <button
              className={`transition duration-300 ease-in-out ${
                copiedSnippet
                  ? "bg-green-400 hover:bg-green-500"
                  : "bg-slate-700 hover:bg-slate-800"
              } text-white font-medium py-1.5 px-3 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-500`}
              onClick={handleCopyMetadataSnippet}
            >
              {copiedSnippet ? "Copied!" : "Copy snippet"}
            </button>
          </div>
          <pre className="mt-2 overflow-x-auto rounded border border-slate-200 bg-white p-2 text-xs text-slate-700 sm:text-sm">
            <code>{NEXT_METADATA_SNIPPET}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};

export default Clipboard;
