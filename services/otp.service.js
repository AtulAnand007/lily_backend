import crypto from "crypto";
import { sendEmail } from "../config/mailer.js";

// otp generation & send email function
export const generateAndSendOTP = async (user) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const otpExpires = Date.now() + 10 * 60 * 1000;

  user.otp = hashedOTP;
  user.otpExpires = otpExpires;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Verify your email - Plantify 🌱",
    text: `Hi ${user.fullName},\n\nYour verification code is: ${otp}\nIt is valid for 10 minutes.\n\nThank you for registering with Plantify!`,
  });

  console.log(`✅ OTP sent to ${user.email}`);
  return otp;
};

// otp verification function
export const verifyOTP = async (user, enteredOtp) => {
  const hashedEnteredOtp = crypto
    .createHash("sha256")
    .update(enteredOtp)
    .digest("hex");

  if (
    user.otp !== hashedEnteredOtp ||
    !user.otpExpires ||
    user.otpExpires < Date.now()
  ) {
    return false;
  }

  user.otp = undefined;
  user.otpExpires = undefined;
  user.isVerified = true;
  await user.save();

  return true;
};


// ✅ Generate and send OTP for forgot password
export const generateAndSendResetOTP = async (user) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const otpExpires = Date.now() + 10 * 60 * 1000;

  user.resetOtp = hashedOTP;
  user.resetOtpExpires = otpExpires;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Password Reset Code - Plantify 🌱",
    text: `Hi ${user.fullName},\n\nYour password reset code is: ${otp}\nIt will expire in 10 minutes.\n\nIf you didn’t request this, please ignore this email.`,
  });

  console.log(`🔐 Reset OTP sent to ${user.email}`);
  return otp;
};

// ✅ Verify reset OTP
export const verifyResetOTP = async (user, enteredOtp) => {
  const hashedEnteredOtp = crypto
    .createHash("sha256")
    .update(enteredOtp)
    .digest("hex");

  if (
    user.resetOtp !== hashedEnteredOtp ||
    !user.resetOtpExpires ||
    user.resetOtpExpires < Date.now()
  ) {
    return false;
  }

  user.resetOtp = undefined;
  user.resetOtpExpires = undefined;
  await user.save();

  return true;
};