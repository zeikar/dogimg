import React, { useState } from "react";

interface ClickItemProps {
  onClick: (event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void;
  url: string;
}

const ClickItem: React.FC<ClickItemProps> = ({ onClick, url }) => {
  return (
    <span
      className="text-indigo-600 cursor-pointer p-1 hover:underline inline-block"
      onClick={onClick}
    >
      {url}
    </span>
  );
};

export default ClickItem;
