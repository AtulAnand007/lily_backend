import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "../config/jwt.js";

export const generateAccessToken = (user) => {
    return jwt.sign({
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role || "user",
        },
        JWT_CONFIG.ACCESS_SECRET, { expiresIn: JWT_CONFIG.ACCESS_EXPIRES_IN }
    );
};

export const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id },
        JWT_CONFIG.REFRESH_SECRET, { expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN }
    );
};

export const generateEmailVerifyToken = (user, newemail) => {
    return jwt.sign({ id: user._id, newemail },
        JWT_CONFIG.SECRET, { expiresIn: "15m" }
    );
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_CONFIG.ACCESS_SECRET);
};


export const verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_CONFIG.REFRESH_SECRET);
};