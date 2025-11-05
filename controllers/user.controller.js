// get/update profile, manage addresses, change password, admin list users, delete users, etc.
// user & ADMIN CRUD operations
import logger from "../config/logger.js";
import User from "../models/user.model.js";

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


export const uploadandUpdateImage = async(req, res) => {
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