import { isDev } from ".";
import { RedisManager } from "../services/redis-manager";
import VaultManager from "../services/vault-manager";
import { errorLog } from "../utilities/log";

const redisManager = RedisManager.getInstance();

export const connectRedis = async () => {
  try {
    const vaultManager = VaultManager.getInstance();
    const configKey = isDev ? "kv/data/redisDev" : "kv/data/redis";
    const configData = await vaultManager.read(configKey);
    redisManager.connect(configData.REDIS_URI);
  } catch (err) {
    await redisManager.disconnect();
    errorLog("REDIS CONNECT ERR::: ", err);
    return new Error("Cannot connect redis");
  }
};
