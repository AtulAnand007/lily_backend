import mongoose from "mongoose";
import logger from "./logger.js";
import dotenv from 'dotenv';
import { adminSetup } from "./admin.config.js";
dotenv.config();


const connectDB = async() => {
    try {

        await mongoose.connect(process.env.MONGO_URI, {
            // useNewUrlParser: true,
            //useUnifiedTopology: true,
        });
        logger.info("Database connected");

        await adminSetup();
        logger.info("Admin setup completed");

    } catch (error) {
        logger.error("Database connection failed", {
            message: error.message
        });
        console.log(error);
        process.exit(1);
    }
}

export default connectDB;