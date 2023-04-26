import React from "react";
import Navbar from "./components/navbar";
import Heading from "./components/heading";
import PreviewImage from "./components/preview";
import InputForm from "./components/inputForm";
import Clipboard from "./components/clipboard";

export default function Home() {
  const [ogApi, setOgApi] = React.useState("");
  const [url, setUrl] = React.useState("");

  const handleGenerate = (url: string) => {
    console.log("Generate", url);
    setUrl(url);
    setOgApi("/api/og?url=" + url);
  };

  return (
    <>
      <header>
        <Navbar />
      </header>
      <div className="w-full">
        <Heading />
      </div>
      <main className="container mx-auto my-4 max-w-5xl">
        <div
          className="
            flex
            flex-col
            justify-center
            items-center
            bg-white
            mx-auto
            rounded-lg
            shadow-lg
          "
        >
          <div className="w-full">
            <InputForm handleSubmit={handleGenerate} />
          </div>
          <div className="w-full">
            <PreviewImage src={ogApi} />
          </div>
          <div className="w-full">
            <Clipboard url={url} />
          </div>
        </div>
      </main>
      <footer className=""></footer>
    </>
  );
}
