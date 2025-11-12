import express from "express"
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
const router = express.Router();
import {
    getAllUser,
    deleteUser,
    getUserdetail,
    getDashboardOverview

} from "../controllers/admin.controller.js";
import { createProduct, deleteProduct, updateProduct } from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

// admin to user
router.get("/all", authenticate, authorizeRoles("ADMIN"), getAllUser);
router.get("/:userId", authenticate, authorizeRoles("ADMIN"), getUserdetail);
router.delete("/:userId", authenticate, authorizeRoles("ADMIN"), deleteUser);

// admin to product

router.post("/create", authenticate, authorizeRoles("ADMIN"),
    async(req, res, next) => {
        req.uploadType = "product_image",
            next();
    },
    upload.single("image"), createProduct);
router.put("/update-product/:id", authenticate, authorizeRoles("ADMIN"), async() => {
    req.uploadType = "product_image"
    next();
}, upload.single("image"), updateProduct);
router.delete("/delete/:prodId", authenticate, authorizeRoles("ADMIN"), deleteProduct)


// admin to admin
router.get("/dashboard", authenticate, authorizeRoles("ADMIN"), getDashboardOverview);

export default router;