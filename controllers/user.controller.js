// get/update profile, manage addresses, change password, admin list users, delete users, etc.
// user CRUD operations
import logger from "../config/logger.js";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";
import { sendEmail } from "../config/mailer.js";
import {
    changePasswordTemplate,
    changePasswordText,
} from "../utils/emailTemplate/changePasswordTemplate.js";
import { generateEmailVerifyToken } from "../services/token.service.js";
import { verifyEmailLinkTemplate, verifyEmailLinkText } from "../utils/emailTemplate/verifyEmailTemplate.js";
import { JWT_CONFIG } from "../config/jwt.js";
import jwt from "jsonwebtoken";

// get user detail
export const getUserDetail = async(req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user,
        });

        logger.info(`Fetched details for user ${user._id}`);
    } catch (error) {
        logger.error(`Failed to fetch user details: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching user details",
        });
    }
};

export const uploadAndUpdateImage = async(req, res) => {
    try {
        if (!req.file || !req.file.path) {
            return res.status(400).json({
                success: false,
                message: "No image file uploaded",
            });
        }

        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.profileImagePublicId) {
            try {
                await cloudinary.uploader.destroy(user.profileImagePublicId);
                logger.info("Old profile image deleted from Cloudinary");
            } catch (err) {
                logger.warn(`Failed to delete old profile image: ${err.message}`);
            }
        }
        // Atul fucking babes we do not need this because we are using multer-storage-cloudnary to
        // iske wajah se controller ke start hone se pahle wo upload ho jayega cloudinary main
        /*const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "user_profiles",
            transformation: [{width: 500, height: 500, crop: "limit"}],
        })*/

        user.profileImage = req.file.path;
        user.profileImagePublicId = req.file.filename;

        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: "Profile image uploaded & updated successfully",
            imageUrl,
            user,
        });
    } catch (error) {
        logger.error(`Image upload or update failed: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Image upload or update failed",
            error: error.message,
        });
    }
};

export const updateUserName = async(req, res) => {
    try {
        const userId = req.user.id;
        const { fullName } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (fullName) user.fullName = fullName;

        await user.save({ validateBeforeSave: false });

        logger.info(`Name updated successfully for ${user.email}`);
        return res.status(200).json({
            success: true,
            message: "Name updated successfully",
            user,
        });
    } catch (error) {
        logger.error("Name update failed", { message: error.message });
        return res.status(500).json({
            success: false,
            message: "Failed to update name",
        });
    }
};

// update user password -- only for local/non google user
export const updateUserPassword = async(req, res) => {
    try {
        const userId = req.user.id;

        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ message: "All fields required" });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "New password does not match with confirm new password",
            });
        }


        const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;

        if (newPassword.trim().length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long.",
            });
        }

        if (!strongPasswordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
            });
        }

        const user = await User.findById(userId).select("+password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.authProvider === "google") {
            return res.status(403).json({
                success: false,
                message: "Google-auth users cannot set or change a password.",
            });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Current password is incorrect" });
        }

        user.password = newPassword;
        user.refreshToken = null;
        await user.save();

        // email service
        await sendEmail({
            to: user.email,
            subject: "Password Changed Successfully - Lily 🌱",
            html: changePasswordTemplate(user.fullName),
            text: changePasswordText(user.fullName),
        });

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        logger.error("Password update failed", { message: error.message });
        return res.status(500).json({
            success: false,
            message: "Failed to update password",
        });
    }
};

// update user email -- only for non google auth users

export const updateUserEmail = async(req, res) => {
    try {
        const userId = req.user.id;
        const { newemail } = req.body;

        if (!newemail) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newemail)) {
            return res.status(400).json({ success: false, message: "Please provide a valid email address." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }


        if (user.authProvider === "google") {
            return res.status(403).json({
                success: false,
                message: "Google account users cannot manually update their email.",
            });
        }

        const existingemail = await User.findOne({ email: newemail });
        if (existingemail) {
            return res.status(409).json({ success: false, message: "Email is already in use." });
        }

        user.pendingEmail = newemail;
        await user.save({ validateBeforeSave: false });


        const token = generateEmailVerifyToken(user, newemail);
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email-update?token=${token}`;

        await sendEmail({
            to: newemail,
            subject: "Verify Your New Email - Lily 🌱",
            html: verifyEmailLinkTemplate(user.fullName, verificationUrl),
            text: verifyEmailLinkText(user.fullName, verificationUrl),
        });

        logger.info("Email verification link sent successfully");
        res.status(200).json({ success: true, message: "Verification link sent successfully" });
    } catch (error) {
        logger.error("Email verification error:", error);
        res.status(500).json({ message: "Failed to send verification link" });
    }
};




export const verifyUpdatedEmail = async(req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Verification token missing.",
            });
        }


        const decoded = jwt.verify(token, JWT_CONFIG.SECRET);
        const { id, newemail } = decoded;


        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }


        user.email = newemail;
        user.pendingEmail = undefined;
        await user.save({ validateBeforeSave: false });

        logger.info(`Email updated successfully for user: ${user._id}`);

        return res.status(200).json({
            success: true,
            message: "Email updated successfully.",
        });

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(400).json({
                success: false,
                message: "Verification link expired. Please request a new one.",
            });
        }

        logger.error("Email verification failed:", { error: error.message });
        return res.status(400).json({
            success: false,
            message: "Invalid or expired verification link.",
        });
    }
};