import express from "express";
import { generateOGImage } from "./src/controller/image.js";

const app = express();
const port = 8080;

app.get("/:url", async (req, res) => {
  try {
    var img = await generateOGImage(req.params.url);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");

    return;
  }

  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });
  res.end(img);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
