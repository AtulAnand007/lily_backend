import express from 'express';
import { registerUser, VerifyUserotp } from '../controllers/auth.controller.js';


const router = express.Router();


router.post("/register", registerUser);
router.post("/verifyOtp", VerifyUserotp);
export default router;