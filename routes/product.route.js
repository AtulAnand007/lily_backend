import express from 'express';
import { getProductById, updateProductImage } from '../controllers/product.controller.js';

const router = express.Router();

router.get("/:id", getProductById);
router.put("/update-image/:id", async(req, res, next) => {
    req.uploadType = "product_image";
    next();
}, upload.single("image"), updateProductImage);

export default router;