import express from 'express';
import dotenv from 'dotenv'
import bodyParser from 'body-parser';
import logger from './config/logger.js';
import connectDB from './config/db.js';


// env configuration 
dotenv.config();

const app = express();

//Mongodb connection
connectDB();


// server setup 
const port = process.env.PORT || 8001;
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
})