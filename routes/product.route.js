import express from 'express';
import { getProductById, updateProductImage } from '../controllers/product.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
const router = express.Router();

// product routes for all 
router.get("/:id", getProductById);


// product routes for admin
router.use(authenticate);
router.use(authorizeRoles("ADMIN"));

router.put("/update-image/:id", async(req, res, next) => {
    req.uploadType = "product_image";
    next();
}, upload.single("image"), updateProductImage);

export default router;