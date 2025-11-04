import { verifyAccessToken } from "../services/token.service.js";
import User from "../models/user.model.js";

/*export const authenticate = async(req, res, next) => {
        try {


            // it will work only for auth but we are using cookie to access token
            /* const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }*/

/*const token = authHeader.split(" ")[1];
        const decoded = verifyAccessToken(token);

        req.user = await User.findById(decoded.id).select("-password");
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};*/

/*export const authorizeRoles = (...allowedRoles) => {


    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Access denied" });
        }
        next();
    };
};*/



export const authenticate = async(req, res, next) => {
    try {

        // it will for cookies 
        ///const token = req.cookies?.accessToken;(isko uncomment kardiyo atul aur duara wala hata diyo kyoki main optional changin nhi kar pa raha)
        const token = req.cookies.accessToken;
        //now we will write for Authorizationheader

        const authHeader = req.headers.authorization;
        //const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
        const bearerToken = authHeader.startsWith("Bearer") ? authHeader.split(" ")[1] : null;

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