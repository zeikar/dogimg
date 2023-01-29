import fs from "fs";
import satori from "satori";
import pkg from "@resvg/resvg-js";
const { Resvg } = pkg;

export const createImage = async (metaData) => {
  const robotoArrayBuffer = await fs.readFileSync("fonts/NotoSans-Regular.ttf");

  const svg = await satori(
    {
      type: "div",
      props: {
        children: [
          {
            type: "div",
            props: {
              children: metaData.site_name,
              style: {
                border: "1px",
                margin: "40px",
                fontSize: "30px",
                color: "#222222",
              },
            },
          },
          {
            type: "div",
            props: {
              children: metaData.title,
              style: {
                border: "1px",
                margin: "40px",
                fontSize: "30px",
                color: "#333333",
              },
            },
          },
          {
            type: "div",
            props: {
              children: metaData.description,
              style: {
                border: "1px",
                margin: "40px",
                fontSize: "30px",
                color: "#444444",
              },
            },
          },
        ],
        style: { display: "flex", flexDirection: "column" },
      },
    },
    {
      width: 1200,
      height: 600,
      fonts: [
        {
          name: "Roboto",
          // Use `fs` (Node.js only) or `fetch` to read the font as Buffer/ArrayBuffer and provide `data` here.
          data: robotoArrayBuffer,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );

  const opts = {
    fitTo: {
      mode: "width",
      value: 1200,
    },
  };
  const resvg = new Resvg(svg, opts);
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  return pngBuffer;
};
