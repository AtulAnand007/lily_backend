import express from express;
import User from "../models/user.model";
import { getUserDetail } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
const router = express.Router();


router.post("/getUserDetail", authenticate, getUserDetail);

export default router;