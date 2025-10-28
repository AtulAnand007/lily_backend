import winston from "winston";
import "winston-daily-rotate-file";
import fs from "fs";

// Ensuring  the logs directory exists
const logDir = "logs";
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Defining  log formats
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(
        ({ timestamp, level, message }) =>
        `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
);

// Daily rotate file for all logs
const dailyRotateTransport = new winston.transports.DailyRotateFile({
    filename: `${logDir}/%DATE%-combined.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d", //it  Keep logs for 14 days
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
});

// Separate file for errors only
const errorFileTransport = new winston.transports.File({
    filename: `${logDir}/error.log`,
    level: "error",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
});

// Creating  logger instance
const logger = winston.createLogger({
    level: "info",
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        dailyRotateTransport,
        errorFileTransport,
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: `${logDir}/exceptions.log` }),
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: `${logDir}/rejections.log` }),
    ],
});

export default logger;