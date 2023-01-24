const { createCanvas, loadImage } = require("canvas");
import { MetaData } from "../types/metadata";

export const createImage = async (metaData: MetaData) => {
  const width = 1200;
  const height = 630;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.textBaseline = "top";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  // Logo image (favicon?)
  //const logo = await loadImage("https://google.com/favicon.ico");
  //context.drawImage(logo, 50, 50, 50, 50);

  // Logo text (og:site_name)
  context.font = "bold 32pt Sans-Serif";
  context.fillStyle = "#222222";
  context.fillText(metaData.site_name, 150, 50);

  // Title (og:title)
  context.font = "bold 72pt Sans-Serif";
  context.fillStyle = "#333333";
  context.fillText(metaData.title, 50, 150);

  // Description (og:description)
  context.font = "24pt Sans-Serif";
  context.fillStyle = "#444444";
  context.fillText(metaData.description, 50, 350);

  return canvas.toBuffer("image/png");
};
