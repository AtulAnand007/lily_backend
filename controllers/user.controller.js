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
// get user detail

export const getUserDetail = async (req, res) => {
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

export const uploadAndUpdateImage = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }

    const userId = req.user.id;
    const imageUrl = req.file.path;
    const publicId = req.file.filename;

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
        logger.warn(`Failed to delete old image: ${err.message}`);
      }
    }

    user.profileImage = imageUrl;
    user.profileImagePublicId = publicId;

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

export const updateUserName = async (req, res) => {
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
export const updateUserPassword = async (req, res) => {
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

    // this check is for improved UX experience -- AI suggested
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
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
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
export const updateUserEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enteredEmail } = req.body;

    if (!enteredEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    const existingUser = await User.findOne({email: enteredEmail});
    if(existingUser){
      return res.status(400).json({
        success: false,
        message: "User already exist with this email address"
      })
    }
    const user = await User.findById(userId);
    if(!user){
      return res.status(400).json({
        success: false,
        message: "User does not exist"
      })
    }
    if(user.authProvider==="google"){
      return res.status(403).json({
        success: false,
        message: "Google-auth users cannot set or change a password.",
      });
    }

    user.email = enteredEmail
    user.refreshToken = null;
    await user.save();    
  } catch (error) {
    logger.error("Email update failed", {message: error.message})
    return res.status(500).json({
      success: false,
      message: "Failed to update email"
    })
  }
};
