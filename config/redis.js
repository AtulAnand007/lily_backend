import Redis from "ioredis";

let redisClient;

export const connectRedis = async () => {
  redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    retryStrategy(times) {
      return Math.min(times * 2000, 10000);
    },
  });

  redisClient.on("connect", () => console.log(`Redis connected successfully`));
  redisClient.on("error", (err) =>
    console.log(`Error while connecting to redis, ${err}`)
  );
  return redisClient;
};

export const getRedisClient = ()=>{
    if(!redisClient) throw new Error("Redis client not initialized!")
    return redisClient;
}
