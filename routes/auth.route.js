import express from 'express';
import { registerUser, VerifyUserotp, resendOtp, login } from '../controllers/auth.controller.js';


const router = express.Router();


router.post("/register", registerUser);
router.post("/verifyOtp", VerifyUserotp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

export default router;