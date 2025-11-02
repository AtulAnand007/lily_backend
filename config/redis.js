import Redis from "ioredis";
import logger from "../config/logger.js"; // make sure logger is imported

let redisClient;

export const connectRedis = async() => {
    try {
        redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
            retryStrategy(times) {
                return Math.min(times * 2000, 10000);
            },
        });

        redisClient.on("connect", () => logger.info("Redis connected successfully"));
        redisClient.on("error", (err) =>
            logger.error(`Error while connecting to Redis: ${err.message}`)
        );

        return redisClient;
    } catch (error) {
        logger.error("Failed to connect Redis", { message: error.message });
        return null;
    }
};

export const getRedisClient = () => {
    if (!redisClient) {
        logger.warn("Redis client not initialized. Returning null.");
        return null;
    }
    return redisClient;
};