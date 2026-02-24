import React, { useState } from "react";
import ClickItem from "./clickItem";

interface InputFormProps {
  handleSubmit: (url: string) => void;
}

const InputForm = ({ handleSubmit }: InputFormProps) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const isValidUrl = (value: string) => {
    try {
      const normalized = /^https?:\/\//i.test(value) ? value : `http://${value}`;
      const parsed = new URL(normalized);
      return Boolean(parsed.hostname);
    } catch {
      return false;
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!isValidUrl(trimmedUrl)) {
      setError("Please enter a valid URL.");
      return;
    }
    setError("");
    handleSubmit(trimmedUrl);
  };

  const selectUrl = (selectedUrl: string) => {
    setError("");
    setUrl(selectedUrl);
  };

  return (
    <div className="mx-auto">
      <form className="w-full" onSubmit={onSubmit} noValidate>
        <div className="flex m-4">
          <input
            className="w-full shadow-xl p-4 pl-3 pr-8 text-2xl placeholder-gray-600 text-gray-900 border border-gray-300 rounded-l-lg bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            type="url"
            inputMode="url"
            placeholder="Enter a URL"
            aria-label="URL"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "url-input-error" : undefined}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) {
                setError("");
              }
            }}
            required
          />
          <button
            className="inset-y-0 right-0 flex items-center px-4 font-bold text-white bg-indigo-600 rounded-r-lg hover:bg-indigo-500 focus:bg-indigo-700"
            type="submit"
          >
            Generate
          </button>
        </div>
        {error ? (
          <p id="url-input-error" className="mx-4 text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </form>
      <div className="mx-auto text-center text-gray-600">
        Try these:
        <ClickItem url="https://github.com" onSelect={selectUrl} />
        <ClickItem url="https://vercel.com" onSelect={selectUrl} />
        <ClickItem url="https://nextjs.org" onSelect={selectUrl} />
      </div>
    </div>
  );
};

export default InputForm;
