import { verifyAccessToken } from "../services/token.service.js";
import User from "../models/user.model.js";
import logger from "../config/logger.js"

export const authorizeRoles = (...roles) => {


    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Access denied" });
        }
        next();
    };
};


export const authenticate = async(req, res, next) => {
    try {

        // it will for cookies 
        const token = req.cookies ?.accessToken;
        //now we will write for Authorization header

        const authHeader = req.headers.authorization;
        const bearerToken = authHeader ?.startsWith("Bearer") ? authHeader.split(" ")[1] : null;

        const finalToken = token || bearerToken;
        if (!finalToken) {
            logger.warn(`Unauthorized request from ${req.ip} - no token`);
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = verifyAccessToken(finalToken);

        req.user = await User.findById(decoded.id).select("-password");
        logger.info(`Authenticated user ${req.user.email} (${req.user._id})`);
        next();


    } catch (error) {
        logger.error(`Authentication failed: ${error.message}`);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}