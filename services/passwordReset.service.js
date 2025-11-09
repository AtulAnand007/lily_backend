import crypto from "crypto";
import { getRedisClient } from "../config/redis.js";
import { sendEmail } from "../config/mailer.js";
import {
  resetPasswordTemplate,
  resetPasswordText,
} from "../utils/emailTemplate/resetPasswordTemplate.js";

const RESET_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const RESET_COOLDOWN = 60; // 1 minute between requests
const RESET_MAX_REQUESTS = 3; // Max 3 requests per 15 mins
const RESET_PREFIX = "password_reset";

export const generateResetTokenAndSendEmail = async (user) => {
  const redis = getRedisClient();
  if (!redis) throw new Error("Redis not initialized");

  const { email, fullName } = user;

  const rateKey = `${RESET_PREFIX}:rate:${email}`;
  const resetKey = `${RESET_PREFIX}:${email}`;
  const countKey = `${RESET_PREFIX}:count:${email}`;

  // check cooldown - 1req per 60 sec
  const lastRequest = await redis.get(rateKey);
  if (lastRequest) {
    const remaining =
      RESET_COOLDOWN - (Date.now() - parseInt(lastRequest)) / 1000;
    if (remaining > 0) {
      throw {
        code: "RESET_COOLDOWN",
        message: `Please wait ${Math.ceil(
          remaining
        )}s before requesting another reset link.`,
      };
    }
  }
  // max requests per window
  const count = await redis.get(countKey);
  if (count && parseInt(count) >= RESET_MAX_REQUESTS) {
    throw {
      code: "RESET_RATE_LIMIT",
      message: "Too many password reset requests. Try again later.",
    };
  }

  // generate reset token
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Atomic Redis updates
  const pipeline = redis.multi();
  pipeline.set(resetKey, hashedToken, "EX", RESET_TOKEN_EXPIRY);
  pipeline.set(rateKey, Date.now().toString(), "EX", RESET_COOLDOWN);
  pipeline.incr(countKey);
  pipeline.expire(countKey, RESET_TOKEN_EXPIRY);
  await pipeline.exec();

  // construct frontend reset URL
  const resetUrl = `${
    process.env.FRONTEND_URL
  }/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  // Send email
  try {
    await sendEmail({
      to: email,
      subject: "Reset Your Password - Lily 🌱",
      html: resetPasswordTemplate(fullName, resetUrl),
      text: resetPasswordText(fullName, resetUrl),
    });
  } catch (err) {
    await redis.del(resetKey, rateKey, countKey);
    throw {
      code: "EMAIL_SEND_FAILED",
      message: "Failed to send reset email. Please try again.",
    };
  }
  
  return { success: true, message: "Password reset email send successfully." };
};

export const verifyResetToken = async (email, token) => {
  const redis = getRedisClient();
  if (!redis) throw new Error("Redis not initialized");

  const resetKey = `${RESET_PREFIX}:${email}`;
  const storedHashedToken = await redis.get(resetKey);
  if (!storedHashedToken) return false;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const isValid = storedHashedToken === hashedToken;
  if (isValid) {
    await redis.del(resetKey);
  }
  return isValid;
};

export const clearResetData = async (email) => {
  const redis = getRedisClient();
  if (!redis) throw new Error("Redis not initialized");

  const keys = [
    `${RESET_PREFIX}:${email}`,
    `${RESET_PREFIX}:rate:${email}`,
    `${RESET_PREFIX}:count:${email}`,
  ];

  await redis.del(...keys);
};
