import Product from "../models/product.model.js";

import logger from "../config/logger.js";
import cloudinary from "../config/cloudinary.js";

export const createProduct = async(req, res) => {
    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }

        const { name, description, price, stock, category, isFeatured } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ message: "Name, price, and category are required" });
        }

        let images = [];

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "products",
            });

            images.push({
                url: result.secure_url,
                public_id: result.public_id,
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            stock,
            category,
            images,
            isFeatured,
        });

        logger.info("Product created successfully");
        res.status(201).json({
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        logger.error("Product creation failed", { message: error.message });
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const updateProduct = async(req, res) => {
    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }

        const { id } = req.params;
        const updates = req.body;


        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }


        if (req.file) {

            if (product.images ?.length && product.images[0] ?.public_id) {
                await cloudinary.uploader.destroy(product.images[0].public_id);
            }


            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "products",
            });

            // Replace the image array
            updates.images = [{
                url: result.secure_url,
                public_id: result.public_id,
            }, ];
        }


        const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        logger.info(`Product ${id} updated successfully`);
        res.status(200).json({
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        logger.error("Product update failed", { message: error.message });
        res.status(500).json({ message: "Internal Server Error" });
    }
};