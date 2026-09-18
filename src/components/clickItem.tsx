import React from "react";

interface ClickItemProps {
  onSelect: (url: string) => void;
  url: string;
}

const ClickItem: React.FC<ClickItemProps> = ({ onSelect, url }) => {
  return (
    <button
      type="button"
      className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 sm:text-sm"
      onClick={() => onSelect(url)}
    >
      {url}
    </button>
  );
};

export default ClickItem;
