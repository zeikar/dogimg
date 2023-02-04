import React from "react";
import Navbar from "./components/navbar";
import PreviewImage from "./components/preview";

export default function Home() {
  const [url, setUrl] = React.useState("");
  const [ogApi, setOgApi] = React.useState("");

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Generate", url);
    setOgApi("/api/og?url=" + url);
  };

  return (
    <>
      <header>
        <Navbar />
      </header>
      <main className="container mx-auto my-4">
        <div
          className="
            flex
            flex-col
            justify-center
            items-center
            bg-white
            mx-auto
            rounded-lg
          "
        >
          <div>
            <PreviewImage src={ogApi} />
          </div>
          <div>
            <form className="" onSubmit={handleGenerate}>
              <input
                type="text"
                placeholder="Enter a URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button type="submit">Generate</button>
            </form>
          </div>
        </div>
      </main>
      <footer className=""></footer>
    </>
  );
}
