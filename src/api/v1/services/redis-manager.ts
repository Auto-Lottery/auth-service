import { createClient } from "redis";

export class RedisManager {
  private static instance: RedisManager;
  private client: ReturnType<typeof createClient> | null = null;

  private constructor() {}

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public getClient() {
    return this.client;
  }

  public async connect(url: string): Promise<void> {
    this.client = createClient({
      url
    });
    this.client.connect();
    this.client.on("error", (err) => {
      console.error(`Redis connection error: ${err}`);
    });
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      this.client = null;
    }
  }
}
