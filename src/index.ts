import express from "express";
import * as cron from "node-cron";
import V1Routes from "./api/v1/routes/routes";
import { connectDb } from "./api/v1/config/mongodb";
import { connectRedis } from "./api/v1/config/redis";
import { PORT } from "./api/v1/config";
import { infoLog } from "./api/v1/utilities/log";
import VaultManager from "./api/v1/services/vault-manager";
import { SystemUser } from "./api/v1/services/system-user";

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
  infoLog(`Started server on ${port} port`);
  connectDb();
  connectRedis();
  const vaultManager = VaultManager.getInstance();
  const authUser = await vaultManager.read("kv/data/authSystemUser");
  SystemUser.login(authUser);
});

cron.schedule("0 */6 * * *", async () => {
  const vaultManager = VaultManager.getInstance();
  const authUser = await vaultManager.read("kv/data/authSystemUser");
  SystemUser.login(authUser);
});
