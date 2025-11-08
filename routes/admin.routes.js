import express from "express"
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
const router = express.Router();
import {
    getAllUser,
    deleteUser,
    getUserdetail

} from "../controllers/admin.controller.js";
import { createProduct } from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
// admin to user
router.get("/all", authenticate, authorizeRoles("ADMIN"), getAllUser);
router.get("/:userId", authenticate, authorizeRoles("ADMIN"), getUserdetail);
router.delete("/:userId", authenticate, authorizeRoles("ADMIN"), deleteUser);

// admin to product

router.post("/create", authenticate, authorizeRoles("ADMIN"), upload.single("image"), createProduct);
export default router;