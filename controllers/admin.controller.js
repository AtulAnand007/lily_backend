import User from "../models/user.model.js"
import cloudinary from "../config/cloudinary.js"

export const getAllUser = async(req, res) => {
    try {

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }

        const users = await user.find({ role: "USER" }).select("-password -refreshToken");
        logger.info("All user fetched successfully");

        return res.status(200).json({
            success: true,
            users,
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
        const user = await User.findById({ userId });

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