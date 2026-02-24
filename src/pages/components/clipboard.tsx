import React, { useState } from "react";

interface ClipboardProps {
  url: string;
}

const getMetaTag = (url: string) =>
  `<meta property="og:image" content="https://dogimg.vercel.app/api/og?url=${encodeURIComponent(
    url
  )}" />`;

const Clipboard: React.FC<ClipboardProps> = ({ url }) => {
  const [copiedUrl, setCopiedUrl] = useState("");
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

  if (!url) {
    return null;
  }

  return (
    <div className="px-4 py-2 text-gray-600">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <p className="text-sm text-gray-500">Add to your site:</p>
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
      <details className="mt-2">
        <summary className="cursor-pointer text-center text-xs text-gray-500 hover:text-gray-700">
          Show meta tag
        </summary>
        <div className="mt-2 w-full overflow-x-auto rounded bg-gray-100 p-2 text-left">
          <code className="block break-all text-xs sm:text-sm">{metaTag}</code>
        </div>
      </details>
    </div>
  );
};

export default Clipboard;
