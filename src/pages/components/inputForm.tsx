import React, { useState } from "react";

interface InputFormProps {
  handleSubmit: Function;
}

const InputForm = ({ handleSubmit }: InputFormProps) => {
  const [url, setUrl] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(url);
  };

  return (
    <div className="mx-auto">
      <form className="w-full" onSubmit={onSubmit}>
        <div className="flex m-4 shadow-xl">
          <input
            className="w-full p-4 pl-3 pr-8 text-2xl placeholder-gray-600 text-gray-900 border border-gray-300 rounded-l-lg bg-gray-50 focus:shadow-outline focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
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
    </div>
  );
};

export default InputForm;
