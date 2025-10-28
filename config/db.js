import express from 'express';
import mongoose from "mongoose";
import logger from "./logger.js";
import dotenv from 'dotenv';

dotenv.config();


const connectDB = async() => {
    try {

        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info("Databsse connected");

    } catch (error) {
        logger.error("Database connection failed", {
            message: error.message
        });
        console.log(error);
        process.exit(1);
    }
}

export default connectDB;