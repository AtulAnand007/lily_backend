import express from "express";
import { getUserDetail, uploadandUpdateImage } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
const router = express.Router();
import { upload } from "../middlewares/multer.middleware.js";

router.get("/getUserDetail", authenticate, getUserDetail);
router.post("/upload-image", authenticate, upload.single("image"), uploadandUpdateImage);
export default router;