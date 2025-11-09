import express from "express";
import {
  registerUser,
  VerifyUserotp,
  resendOtp,
  login,
  refreshAccesstoken,
  logout,
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth.controller.js";
import {authenticate} from "../middlewares/auth.middleware.js"

const router = express.Router();

router.post("/register", registerUser);
router.post("/verifyOtp", VerifyUserotp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/refresh", refreshAccesstoken);
router.post("/logout", authenticate, logout);
router.post("/request-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);


export default router;
