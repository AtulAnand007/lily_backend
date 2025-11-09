import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import logger from "../config/logger.js";
import { generateAndSendOTP, verifyOTP } from "../services/otp.service.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../services/token.service.js";
import {
  generateResetTokenAndSendEmail,
  verifyResetToken,
  clearResetData,
} from "../services/passwordReset.service.js";

// register
export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      password,
    });

    await generateAndSendOTP(normalizedEmail, fullName);

    logger.info(`OTP sent successfully to ${normalizedEmail}`);
    return res.status(200).json({
      success: true,
      message: "OTP sent to your email for verification.",
    });
  } catch (error) {
    logger.error("Register failed", { message: error.message, code: error.code });

    // Handle specific error codes from OTP service
    if (error.code === "OTP_COOLDOWN") {
      return res.status(429).json({ message: error.message });
    }
    if (error.code === "OTP_RATE_LIMIT") {
      return res.status(429).json({ message: error.message });
    }
    if (error.code === "ACCOUNT_LOCKED") {
      return res.status(403).json({ message: error.message });
    }
    if (error.code === "EMAIL_SEND_FAILED") {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error." });
  }
};

// otp verification
export const VerifyUserotp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const result = await verifyOTP(normalizedEmail, otp, user);

    if (!result.success) {
      // Handle different OTP error codes gracefully
      switch (result.code) {
        case "OTP_EXPIRED":
          return res.status(400).json({ message: result.message });
        case "OTP_INCORRECT":
          return res.status(400).json({ message: result.message });
        case "TOO_MANY_ATTEMPTS":
        case "ACCOUNT_LOCKED":
          return res.status(403).json({ message: result.message });
        case "DB_ERROR":
          return res.status(500).json({ message: result.message });
        default:
          return res.status(400).json({ message: "Invalid or expired OTP." });
      }
    }

    logger.info(`Email verified successfully for ${normalizedEmail}`);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error("OTP verification failed", { message: error.message, code: error.code });
    return res.status(500).json({ message: "OTP verification failed." });
  }
};


// otp resend
export const resendOtp = async (req, res) => {
  try {
    const { email, fullName } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await generateAndSendOTP(normalizedEmail, fullName || user.fullName);

    logger.info(`New OTP sent successfully to ${normalizedEmail}`);
    return res.status(200).json({
      success: true,
      message: "New OTP sent successfully.",
    });
  } catch (error) {
    logger.error("Failed to resend OTP", { message: error.message, code: error.code });

    // Handle rate limit / cooldown / lock
    if (error.code === "OTP_COOLDOWN") {
      return res.status(429).json({ message: error.message });
    }
    if (error.code === "OTP_RATE_LIMIT") {
      return res.status(429).json({ message: error.message });
    }
    if (error.code === "ACCOUNT_LOCKED") {
      return res.status(403).json({ message: error.message });
    }
    if (error.code === "EMAIL_SEND_FAILED") {
      return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to resend OTP." });
  }
};


// login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({email}).select("+password");
    if (!user) {
      return res.status(404).json({ message: " Invalid user" });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    logger.info("Login Successful");

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        message: "Login successful",
        user: user.toJSON(),
      });

  } catch (error) {
    logger.error("Login failed", { message: error.message });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// refreshAccess token
export const refreshAccesstoken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }
    const newAccessToken = generateAccessToken(user);

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, //
      })
      .status(200)
      .json({ message: "Access token refreshed successfully" });
  } catch (error) {
    logger.error("Refresh token failed", { message: error.message });
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
};

// logout

export const logout = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    logger.info(`Logout Successful for user: ${user.email}`);
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    logger.error("Logout failed", { message: error.message });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// --- for forget password feature ---
// step1: request password reset email
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      // don't reveal that the email does not exist
      return res.status(200).json({
        success: true,
        message: "If this email exists, a reset link has been sent.",
      });
    }
    await generateResetTokenAndSendEmail(user);
    return res.json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (err) {
    logger.error("Reset email error: ", err);
    if (err.code === "RESET_COOLDOWN" || err.code === "RESET_RATE_LIMIT") {
      return res.status(429).json({ success: false, message: err.message });
    }
     if (err.code === "EMAIL_SEND_FAILED") {
      return res.status(500).json({ success: false, message: err.message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to send reset link." });
  }
};

// step2: Reset Password
export const resetPassword = async (req, res) => {
  try {
    // email & token will be fetched from params by frontend and send in body to backend
    const { email, token, newPassword, confirmPassword } = req.body;

    if (!email || !token || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });
    }

    // validate token
    const valid = await verifyResetToken(email, token);
    if (!valid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset link." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // clear reset data in redis
    await clearResetData(email);

    logger.info(`Password reset successful for ${email}`);
    return res.json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    logger.error("Reset password error: ", err);
    return res.status(500).json({
      success: false,
      message: "Server error while resetting password.",
    });
  }
};
