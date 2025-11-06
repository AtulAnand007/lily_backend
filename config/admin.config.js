import User from '../models/user.model.js';
import logger from './logger.js';
import bcrypt from 'bcryptjs';


export const adminSetup = async() => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            logger.error("Admin credentials missing in environment variables");
            return;
        }


        let adminUser = await User.findOne({ email: adminEmail });
        if (adminUser) {
            logger.info(" Admin user already exists");
            return;
        }


        const hashedPassword = await bcrypt.hash(adminPassword, 10);


        adminUser = new User({
            fullName: "Flower Shop Admin",
            email: adminEmail,
            password: hashedPassword,
            role: "ADMIN",
            isVerified: true,
        });

        await adminUser.save();

        logger.info("Admin user created successfully ");

    } catch (error) {
        logger.error(` Failed to create admin user: ${error.message}`);
    }
}