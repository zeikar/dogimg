import React from "react";

interface ClickItemProps {
  onSelect: (url: string) => void;
  url: string;
}

const ClickItem: React.FC<ClickItemProps> = ({ onSelect, url }) => {
  return (
    <button
      type="button"
      className="inline-block cursor-pointer border-0 bg-transparent p-1 text-indigo-600 hover:underline"
      onClick={() => onSelect(url)}
    >
      {url}
    </button>
  );
};

export default ClickItem;
