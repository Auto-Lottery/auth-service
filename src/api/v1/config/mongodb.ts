import mongoose from "mongoose";
import VaultManager from "../services/vault-manager";
import { errorLog, infoLog } from "../utilities/log";
import { isDev } from ".";

export const connectDb = async () => {
  try {
    const vaultManager = VaultManager.getInstance();
    const configKey = isDev ? "kv/data/mongodbDev" : "kv/data/mongodb";
    const config = await vaultManager.read(configKey);
    await mongoose.connect(config.MONGO_URL, {
      serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true
      }
    });
  } catch (err) {
    errorLog(err);
    throw new Error("Өгөгдлийн сантай холбогдоход алдаа гарлаа");
  }
};

mongoose.connection.on("connected", async () => {
  infoLog("MongoDB connected.");
});

export const transactional = async <T>(
  session: mongoose.mongo.ClientSession,
  callback: () => Promise<T>
): Promise<T | null> => {
  await session.startTransaction();
  let res: T | null = null;
  try {
    res = await callback();
    await session.commitTransaction();
  } catch (err) {
    errorLog("Transactional using error");
    await session.abortTransaction();
  }

  return res;
};
