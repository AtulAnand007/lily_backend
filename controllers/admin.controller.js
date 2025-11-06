import User from "../models/user.model.js"


export const getAllUser = async(req, res) => {
    try {

        if (req.user.role != 'ADMIN') {
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