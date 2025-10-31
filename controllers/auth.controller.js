import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import logger from "../config/logger.js";
import { generateAndSendOTP, verifyOTP } from "../services/otp.service.js";
import {
    generateAccessToken,
    generateRefreshToken,
} from "../services/token.service.js";
// register
export const registerUser = async(req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({
            fullName,
            email,
            password,
        });

        await generateAndSendOTP(user);

        return res
            .status(200)
            .json({ message: "OTP send to your email for verification" });
    } catch (error) {
        logger.error("Register failed", { message: error.message });
        return res.status(500).json({ message: " Internal Server error" });
    }
};

// otp verification
export const VerifyUserotp = async(req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isOtpMatched = await verifyOTP(user, otp);
        if (!isOtpMatched) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        logger.info(` Email verified successfully for ${email}`);
        return res.status(200).json({ message: "Email verification successful" });
    } catch (error) {
        logger.error("OTP verification failed", { message: error.message });
        return res.status(500).json({ message: "OTP verification failed" });
    }
};

// otp resend
export const resendOtp = async(req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await generateAndSendOTP(user);

        logger.info(` New otp sent Successfully on email : ${email}`);
        return res.status(200).json({
            message: "New Otp sent Successfully",
        });
    } catch (error) {
        logger.error("Failed to resend OTP", { message: error.message });
        return res.status(500).json({ message: "Failed to resend OTP" });
    }
};

// verify resend otp
/*export const verifyResendOtp = async(req, res) => {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return res.status(400).json({ message: "Email and OTP are required" });
            }
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const isOtpMatched = await verifyOTP(user, otp);
            if (!isOtpMatched) {
                return res.status(400).json({ message: "Invalid or expired OTP" });
            }

            logger.info(` Email verified successfully for ${email}`);
            return res.status(200).json({
                message: "Email verification successfull"



            })
        } catch (error) {
            logger.error("Otp verification failed", error.message);
            return res.status(500).json({ message: " Otp verifaction  failed" })
        }
    } 
    */
// login

export const login = async(req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email }).select("+password");
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



        /*res.status(200).json({
      message: "Login Successful",
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });*/
    } catch (error) {
        logger.error("Login failed", { message: error.message });
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// refreshAccess token
export const refreshAccesstoken = async(req, res) => {
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

export const logout = async(req, res) => {
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