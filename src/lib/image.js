import fs from "fs";
import satori from "satori";
import pkg from "@resvg/resvg-js";
const { Resvg } = pkg;

const notoSans = await fs.readFileSync("fonts/NotoSans-Regular.ttf");
const notoSansBold = await fs.readFileSync("fonts/NotoSans-Bold.ttf");
const notoSansKR = await fs.readFileSync("fonts/NotoSansKR-Regular.otf");
const notoSansKRBold = await fs.readFileSync("fonts/NotoSansKR-Bold.otf");

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
                {
                  type: "div",
                  props: {
                    children: metaData.site_name,
                    style: {
                      margin: "auto 0px auto 10px",
                    },
                  },
                },
              ],
              style: {
                display: "flex",
                margin: "40px",
                fontSize: "50px",
                color: "#222222",
              },
            },
          },
          {
            type: "div",
            props: {
              children: metaData.title,
              style: {
                margin: "0px 40px 0px 40px",
                maxHeight: "200px",
                fontSize: "70px",
                fontWeight: "bold",
                color: "#333333",
                textOverflow: "ellipsis",
                lineHeight: "100%",
                wordBreak: "break-word",
              },
            },
          },
          {
            type: "div",
            props: {
              children: metaData.description,
              style: {
                margin: "40px",
                fontSize: "30px",
                color: "#555555",
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
        {
          name: "Noto Sans",
          data: notoSansBold,
          weight: 700,
          style: "normal",
        },
        {
          name: "Noto Sans KR",
          data: notoSansKRBold,
          weight: 700,
          style: "normal",
        },
      ],
      embedFont: true, // false이면 resvg에서 font 처리
      debug: true,
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
