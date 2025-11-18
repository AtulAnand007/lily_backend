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

// middleware use 
router.use(authenticate);

router.get("/getUserDetail", getUserDetail);
router.post(
    "/upload-image",
    (req, res, next) => {
        req.uploadType = "users_profile";
        next()
    },
    upload.single("image"),
    uploadAndUpdateImage
);
router.put("/update-name", updateUserName);
router.put("/update-password", updateUserPassword);
router.put("/update-email", updateUserEmail)
router.get("/verify-email-update", verifyUpdatedEmail);
export default router;