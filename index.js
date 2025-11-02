import express from 'express';
import dotenv from 'dotenv'
import logger from './config/logger.js';
import connectDB from './config/db.js';
import authRouters from './routes/auth.route.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectRedis } from './config/redis.js';
// env configuration 
dotenv.config();

const app = express();

//Mongodb connection
connectDB();

// Redis connection
connectRedis()

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "*",
    credentials: true
}));



//Routes
app.use("/api/auth", authRouters);


// server setup 
const port = process.env.PORT || 3001;
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
})