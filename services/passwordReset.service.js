import crypto from "crypto";
import { getRedisClient } from "../config/redis";
import { sendEmail } from "../config/mailer";

const RESET_TOKEN_EXPIRY = 15 * 60; // 15 mins
const RESET_PREFIX = "password_reset";

export const generateResetTokenAndSendEmail = async (user) => {
  const redis = getRedisClient();
  if (!redis) throw new Error("Redis not initialized");

  const { email, fullName } = user;

  const rateKey = `${RESET_PREFIX}:rate:${email}`;
  const resetKey = `${RESET_PREFIX}:${email}`;

  // check cooldown - 1req per 60 sec
  const lastRequest = await redis.get(rateKey);
  if (lastRequest) {
    const remaining = 60 - (Date.now() - parseInt(lastRequest)) / 1000;
    if (remaining > 0) {
      throw {
        code: "RESET_COOLDOWN",
        message: `Please wait ${Math.ceil(
          remaining
        )}s before requesting another reset link.`,
      };
    }
  }

  // generate reset token
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // store hashed token in redis (15 min expiry)
  await redis.set(resetKey, hashedToken, "EX", RESET_TOKEN_EXPIRY);

  // set cooldown
  await redis.set(rateKey, Date.now().toString(), "EX", 60);

  // construct frontend reset URL
  const resetUrl = `${
    process.env.FRONTEND_URL
  }/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  // Send email
  await sendEmail({
    to: email,
    subject: "Reset Your Password - Lily 🌱",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 8px;">
          <p style="font-size: 16px;"><strong>Hello, ${
            fullName || "User"
          }</strong></p>
          <p>We received a request to reset your password. Click below to set a new one:</p>
          <div style="margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Reset Password</a>
          </div>
          <p>If you didn’t request this, you can ignore this email.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">This link is valid for 15 minutes.</p>
        </div>
      </div>
    `,
  });

  return {success: true, message: "Password reset email send successfully."}
};

export const verifyResetToken = async(email, token)=>{
    const redis = getRedisClient();
    if(!redis) throw new Error("Redis not initialized");

    const resetKey =`${RESET_PREFIX}:${email}`
    const storedHashedToken = await redis.get(resetKey)
    if(!storedHashedToken) return false;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
    return storedHashedToken === hashedToken;
}

export const clearResetData = async (email) => {
  const redis = getRedisClient();
  if (!redis) throw new Error("Redis not initialized");

  await redis.del(`${RESET_PREFIX}:${email}`);
  await redis.del(`${RESET_PREFIX}:rate:${email}`);
};
