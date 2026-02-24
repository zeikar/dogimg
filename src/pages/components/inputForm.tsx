import React, { useState } from "react";
import ClickItem from "./clickItem";

interface InputFormProps {
  handleSubmit: Function;
}

const InputForm = ({ handleSubmit }: InputFormProps) => {
  const [url, setUrl] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(url.trim());
  };

  const selectUrl = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    const target = e.target as HTMLSpanElement;
    setUrl(target.innerText);
  };

  return (
    <div className="mx-auto">
      <form className="w-full" onSubmit={onSubmit}>
        <div className="flex m-4">
          <input
            className="w-full shadow-xl p-4 pl-3 pr-8 text-2xl placeholder-gray-600 text-gray-900 border border-gray-300 rounded-l-lg bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            type="text"
            placeholder="Enter a URL"
            aria-label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button
            className="inset-y-0 right-0 flex items-center px-4 font-bold text-white bg-indigo-600 rounded-r-lg hover:bg-indigo-500 focus:bg-indigo-700"
            type="submit"
          >
            Generate
          </button>
        </div>
      </form>
      <div className="mx-auto text-center text-gray-600">
        Try these:
        <ClickItem url="https://github.com" onClick={selectUrl} />
        <ClickItem url="https://vercel.com" onClick={selectUrl} />
        <ClickItem url="https://nextjs.org" onClick={selectUrl} />
      </div>
    </div>
  );
};

export default InputForm;
