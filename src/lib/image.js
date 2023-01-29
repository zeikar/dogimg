import fs from "fs";
import satori from "satori";
import pkg from "@resvg/resvg-js";
const { Resvg } = pkg;

const notoSans = await fs.readFileSync("fonts/NotoSans-Regular.ttf");
const notoSansKR = await fs.readFileSync("fonts/NotoSansKR-Regular.otf");

export const createImage = async (metaData) => {
  const svg = await satori(
    {
      type: "div",
      props: {
        children: [
          {
            type: "div",
            props: {
              children: [
                {
                  type: "img",
                  props: {
                    src: metaData.favicon,
                    style: {
                      width: "100px",
                      height: "100px",
                    },
                  },
                },
                metaData.site_name,
              ],
              style: {
                display: "flex",
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
        style: {
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          // linear-gradient
          background: `linear-gradient(0, ${metaData.color} 0%, #ffffff 30%)`,
        },
      },
    },
    {
      width: 1200,
      height: 600,
      fonts: [
        {
          name: "Noto Sans",
          data: notoSans,
          weight: 400,
          style: "normal",
        },
        {
          name: "Noto Sans KR",
          data: notoSansKR,
          weight: 400,
          style: "normal",
        },
      ],
      embedFont: true, // false이면 resvg에서 font 처리
    }
  );

  const opts = {
    fitTo: {
      mode: "width",
      value: 1200,
    },
    font: {
      fontFiles: ["fonts/NotoSans-Regular.ttf", "fonts/NotoSansKR-Regular.otf"], // You can add more fonts here.
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      defaultFontFamily: "Noto Sans", // Default font family.
    },
  };
  const resvg = new Resvg(svg, opts);
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  return pngBuffer;
};
