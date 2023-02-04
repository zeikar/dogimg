import React from "react";
import Navbar from "./components/navbar";
import PreviewImage from "./components/preview";
import InputForm from "./components/inputForm";

export default function Home() {
  const [ogApi, setOgApi] = React.useState("");

  const handleGenerate = (url: string) => {
    console.log("Generate", url);
    setOgApi("/api/og?url=" + url);
  };

  return (
    <>
      <header>
        <Navbar />
      </header>
      <main className="container mx-auto my-4 max-w-6xl">
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
          <div className="w-full mb-4">
            <PreviewImage src={ogApi} />
          </div>
        </div>
      </main>
      <footer className=""></footer>
    </>
  );
}
