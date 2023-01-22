import express, { Express, Request, Response } from "express";
import { createImage } from "./src/lib/image";

const app: Express = express();
const port = 8080;

app.get("/:url", async (req: Request, res: Response) => {
  var img = await createImage(req.params.url);

  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });
  res.end(img);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
