import User from "../models/user.model.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import logger from "../config/logger.js";
import { generateAndSendOTP, } from "../services/otp.service.js";

// register
export const registerUser = async(req, res) => {
    try {

        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({
            fullName,
            email,
            password,
        });


        await generateAndSendOTP(user);

        res.json({ message: "OTP send to your email for verification" });


    } catch (error) {
        logger.error("Register failed", { message: error.message });
        res.status(500).json({ message: " Internal Server error" });
    }
}

// login 


// refresh


// logout