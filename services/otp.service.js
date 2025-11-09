import crypto from "crypto";
import { sendEmail } from "../config/mailer.js";
import { getRedisClient } from "../config/redis.js";
import {
  verifyEmailTemplate,
  verifyEmailText,
} from "../utils/emailTemplate/verifyEmailTemplate.js";
import logger from "../config/logger.js";

const OTP_EXPIRY = 10 * 60; // 10 minutes
const OTP_COOLDOWN = 60; // 1 minute between resend
const OTP_MAX_REQUESTS = 3; // 3 times in 10 minutes
const OTP_MAX_FAILED_ATTEMPTS = 5; // Max wrong tries before lock
const OTP_PREFIX = "otp:register"; // Prefix for registration OTP

export const generateAndSendOTP = async (email, fullName) => {
  const redis = getRedisClient();
  if (!redis) throw new Error("Redis not initialized");

  //Step 1: Prevent locked users
  const lockKey = `${OTP_PREFIX}:lock:${email}`;
  const isLocked = await redis.get(lockKey);
  if (isLocked) {
    const err = new Error(
      "Too many failed attempts. Please try again after 10 minutes."
    );
    err.code = "ACCOUNT_LOCKED";
    throw err;
  }

  const otpKey = `${OTP_PREFIX}:${email}`;
  const countKey = `${OTP_PREFIX}:count:${email}`;
  const lastRequestKey = `${OTP_PREFIX}:last:${email}`;

  // check last resend time (cooldown check)
  const lastRequest = await redis.get(lastRequestKey);
  if (lastRequest) {
    const remaining =
      OTP_COOLDOWN - (Date.now() - parseInt(lastRequest)) / 1000;
    if (remaining > 0) {
      const seconds = Math.ceil(remaining);
      const err = new Error(
        `Please wait ${seconds}s before requesting a new OTP.`
      );
      err.code = "OTP_COOLDOWN";
      throw err;
    }
  }

  // --- RATE LIMIT check ---
  const count = await redis.get(countKey);
  if (count && parseInt(count) >= OTP_MAX_REQUESTS) {
    const err = new Error(
      "Maximum OTP requests reached. Try again after 10 minutes."
    );
    err.code = "OTP_RATE_LIMIT";
    throw err;
  }

  // generate new OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const pipeline = redis.multi();
  pipeline.set(otpKey, hashedOtp, "EX", OTP_EXPIRY); // 10 min expiry
  pipeline.incr(countKey);
  pipeline.expire(countKey, OTP_EXPIRY); // 10 min window
  // update last request timestamp
  pipeline.set(lastRequestKey, Date.now().toString(), "EX", OTP_COOLDOWN); // 1 min cooldown
  await pipeline.exec();

  // send email
  try {
    await sendEmail({
      to: email,
      subject: "Verify your email - Lily 🌱",
      html: verifyEmailTemplate(fullName, otp),
      text: verifyEmailText(fullName, otp),
    });
    logger.info(`OTP sent successfully to ${email}`);
  } catch (err) {
    // Cleanup Redis if email fails
    await redis.del(otpKey, countKey, lastRequestKey);
    logger.error(`Failed to send OTP to ${email}: ${err.message}`);
    const emailError = new Error(
      "Failed to send verification email. Please try again."
    );
    emailError.code = "EMAIL_SEND_FAILED";
    throw emailError;
  }

  return {
    success: true,
    message: "OTP send successfully",
    email,
  };
};

// verifyOTP service
export const verifyOTP = async (email, enteredOtp, user) => {
  const redis = getRedisClient();
  if (!redis) throw new Error("Redis not initialized");

  const otpKey = `${OTP_PREFIX}:${email}`;
  const failKey = `${OTP_PREFIX}:fail:${email}`;
  const countKey = `${OTP_PREFIX}:count:${email}`;
  const lastKey = `${OTP_PREFIX}:last:${email}`;

  // --- Validation check for OTP input ---
  if (!enteredOtp || !/^\d{6}$/.test(enteredOtp)) {
    return {
      success: false,
      code: "INVALID_FORMAT",
      message: "Invalid OTP format.",
    };
  }

  const storedHashedOtp = await redis.get(otpKey);

  if (!storedHashedOtp) {
    logger.warn(`OTP verification failed for ${email}: OTP expired or missing`);
    return {
      success: false,
      code: "OTP_EXPIRED",
      message: "OTP expired or not found.",
    };
  }

  const hashedEnteredOtp = crypto
    .createHash("sha256")
    .update(enteredOtp)
    .digest("hex");

  if (storedHashedOtp !== hashedEnteredOtp) {
    const failCount = await redis.incr(failKey);
    if (failCount === 1) await redis.expire(failKey, OTP_EXPIRY);

    if (failCount >= OTP_MAX_FAILED_ATTEMPTS) {
      //Step 2: Lock user for 10 minutes
      const lockKey = `${OTP_PREFIX}:lock:${email}`;
      await redis.set(lockKey, "LOCKED", "EX", OTP_EXPIRY); // lock for same as OTP_EXPIRY (10 min)
      await redis.del(otpKey); // invalidate current OTP

      logger.warn(
        `User ${email} locked for ${
          OTP_EXPIRY / 60
        } minutes after ${failCount} failed attempts`
      );

      return {
        success: false,
        code: "ACCOUNT_LOCKED",
        message: "Too many incorrect attempts. You are locked for 10 minutes.",
      };
    }

    logger.warn(
      `Incorrect OTP for ${email}. Attempts: ${failCount}/${OTP_MAX_FAILED_ATTEMPTS}`
    );
    return {
      success: false,
      code: "OTP_INCORRECT",
      message: `Incorrect OTP. You have ${
        OTP_MAX_FAILED_ATTEMPTS - failCount
      } attempts left.`,
    };
  }

  // OTP verified - clear Redis data
  const pipeline = redis.multi();
  pipeline.del(otpKey);
  pipeline.del(countKey);
  pipeline.del(lastKey);
  pipeline.del(failKey);
  await pipeline.exec();

  // --- Update user ---
  try {
    user.isVerified = true;
    await user.save();
    logger.info(`OTP verified successfully for ${email}`);
  } catch (err) {
    logger.error(
      `Failed to update user verification for ${email}: ${err.message}`
    );
    return {
      success: false,
      code: "DB_ERROR",
      message: "Verification succeeded but could not update user record.",
    };
  }

  return { success: true, message: "OTP verified successfully." };
};
