import User from "../models/user.model.js"
import cloudinary from "../config/cloudinary.js"
import logger from "../config/logger.js";

export const getAllUser = async(req, res) => {
    try {

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }

        const user = await User.find({ role: "USER" }).select("-password -refreshToken");
        logger.info("All user fetched successfully");

        return res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {

        logger.error("Failed to fetch users", { message: error.message });
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",

        });

    }
};


export const deleteUser = async(req, res) => {

    try {

        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }

        const { userId } = req.params;
        const user = await User.findById(userId).select("-password -refreshToken");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.profileImagePublicId) {
            await cloudinary.uploader.destroy(user.profileImagePublicId);
        }

        await user.deleteOne();
        logger.info(`User deleted successfully: ${user.email}`);
        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });


    } catch (error) {

        logger.error("Failed to delete user", { message: error.message });
        return res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });

    }
}

export const getUserdetail = async(req, res) => {
    try {

        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }
        const { userId } = req.params;
        const user = await User.findById(userId).select("-password -refreshToken");
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        logger.info("User fetched succesffully by admin");
        return res.status(200).json({
            message: "User fetched successfully",
            user,
        });



    } catch (error) {
        logger.error("Failed to get user", { message: error.message });
        return res.status(500).json({
            success: false,
            message: "Failed to get  user",
        });
    }
}