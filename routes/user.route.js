import express from "express";
import {
    getUserDetail,
    uploadAndUpdateImage,
    updateUserName,
    updateUserPassword,
    updateUserEmail,
    verifyUpdatedEmail
} from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
const router = express.Router();
import { upload } from "../middlewares/multer.middleware.js";

router.get("/getUserDetail", authenticate, getUserDetail);
router.post(
    "/upload-image",
    authenticate,
    upload.single("image"),
    uploadAndUpdateImage
);
router.put("/update-name", authenticate, updateUserName);
router.put("/update-password", authenticate, updateUserPassword);
router.put("/update-email", authenticate, updateUserEmail)
router.get("/verify-email-update", verifyUpdatedEmail);
export default router;