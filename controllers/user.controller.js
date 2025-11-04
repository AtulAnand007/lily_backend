// get/update profile, manage addresses, change password, admin list users, delete users, etc.
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

// user CRUD operations