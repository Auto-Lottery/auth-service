import mongoose from "mongoose";
import { getVaultData } from "./vault";

export const connectDb = async () => {
  try {
    const configData = await getVaultData("kv/data/mongodb");
    const connection = await mongoose.connect(configData.MONGO_URL, {
      serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true
      }
    });
    console.log("MongoDB connected.");
    return connection;
  } catch (err) {
    console.log(err);
    return new Error("Өгөгдлийн сантай холбогдоход алдаа гарлаа");
  }
};
