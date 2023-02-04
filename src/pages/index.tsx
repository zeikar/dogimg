import React from "react";
import Navbar from "./components/navbar";

export default function Home() {
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [ogApi, setOgApi] = React.useState("");

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Generate", url);
    setLoading(true);
    setOgApi("/api/og?url=" + url);
  };

  return (
    <>
      <header>
        <Navbar />
      </header>
      <main>
        <div>
          <img
            className=""
            src={ogApi}
            alt="Open Graph Image Generated by DOGimg"
            width={1200}
            height={630}
          />
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
      </main>
      <footer className=""></footer>
    </>
  );
}
