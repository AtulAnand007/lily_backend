import express from 'express';
import { registerUser, VerifyUserotp, resendOtp } from '../controllers/auth.controller.js';


const router = express.Router();


router.post("/register", registerUser);
router.post("/verifyOtp", VerifyUserotp);
router.post("/resend-otp", resendOtp);

export default router;