import express from "express";

import V1Routes from "./api/v1/routes/routes";
import { connectDb } from "./api/v1/config/mongodb";
import { connectRedis } from "./api/v1/config/redis";
import { PORT } from "./api/v1/config";

const app = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);

app.get("/", function (req, res: express.Response) {
  res.send("Hello World!!!");
});

app.use("/v1", V1Routes);

const port: number = PORT;
app.listen(port, async () => {
  console.log(`Started server on ${port} port`);
  connectDb();
  connectRedis();
});
