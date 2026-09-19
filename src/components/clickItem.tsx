import React from "react";

interface ClickItemProps {
  onSelect: (url: string) => void;
  url: string;
  hue: number;
}

const ClickItem: React.FC<ClickItemProps> = ({ onSelect, url, hue }) => {
  return (
    <button
      type="button"
      className="group inline-flex items-center gap-1.5 font-mono text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      onClick={() => onSelect(url)}
    >
      <span
        aria-hidden="true"
        className="size-2 rounded-full"
        style={{ backgroundColor: `hsl(${hue} 74% 56%)` }}
      />
      <span className="underline decoration-line decoration-2 underline-offset-4 group-hover:decoration-ink">
        {new URL(url).hostname.replace(/^www\./, "")}
      </span>
    </button>
  );
};

export default ClickItem;
