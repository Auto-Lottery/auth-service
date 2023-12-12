import { createClient } from "redis";
import { getVaultData } from "./vault";

let redisClient: ReturnType<typeof createClient>;

const connectRedis = async () => {
  try {
    const configData = await getVaultData("kv/data/redis");
    redisClient = createClient({
      url: configData.REDIS_URI
    });

    await redisClient.connect();

    redisClient.on("error", (err) => console.log("Redis Client Error", err));
    console.log("Redis connected");
  } catch (err) {
    return new Error("Cannot connect redis");
  }
};

export { redisClient, connectRedis };
