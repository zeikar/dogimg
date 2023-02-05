import React, { useState, useEffect } from "react";

interface ClipboardProps {
  url: string;
}

const getMetaTag = (url: string) =>
  `<meta property="og:image" content="https://dogimg.vercel.app/api/og?url=${url}" />`;

const Clipboard: React.FC<ClipboardProps> = ({ url }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getMetaTag(url));
      setIsCopied(true);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setIsCopied(false);
  }, [url]);

  if (!url) {
    return null;
  }

  return (
    <div className="px-4 py-3 text-center text-gray-600">
      <p className="text-sm text-gray-500 inline-block">Add to your site:</p>
      <div className="bg-gray-100 m-2 p-2 rounded inline-block">
        <code className="text-sm">{getMetaTag(url)}</code>
      </div>
      <button
        className={`transition duration-300 ease-in-out ${
          isCopied
            ? "bg-green-400 hover:bg-green-500"
            : "bg-blue-500 hover:bg-blue-600"
        } text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
        onClick={handleCopyToClipboard}
      >
        {isCopied ? "Copied!" : "Copy to Clipboard"}
      </button>
    </div>
  );
};

export default Clipboard;
