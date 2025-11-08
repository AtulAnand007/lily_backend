import Product from "../models/product.model.js";

import logger from "../config/logger.js";
import cloudinary from "../config/cloudinary.js";

export const createProduct = async(req, res) => {
    try {
        if (req.user.role != 'ADMIN') {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }
        const { name, description, price, stock, category, images, isFeatured } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ message: "Name, price, and category are required" });
        }

        let imageUrl = "";
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "products",
                resource_type: "image",
            })

            imageUrl = result.secure_url;
        }

        const product = await Product.create({
            name,
            description,
            price,
            stock,
            category,
            images: imageUrl ? [imageUrl] : [],
            isFeatured,
        });
        logger.info("Product created successfully");
        res.status(201).json({
            message: "✅ Product created successfully",
            product,
        });


    } catch (error) {
        logger.error("Product creation failed", {
            message: error.message
        })
        res.status(500).json({ message: "Internal Srever error" })
    }
}

export const updateProductDetail = async(req, res) => {

}