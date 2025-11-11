import logger from "../config/logger.js";
import Category from "../models/category.model.js";
import cloudinary from "../config/cloudinary.js";

// create category -- admin only
export const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory, isActive } = req.body;

    // check for duplicate category
    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category name must be unique",
      });
    }
    const category = new Category({
      name,
      description,
      parentCategory: parentCategory || null,
      isActive: isActive !== undefined ? isActive : true,
    });
    // upload image if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
        transformation: [{ width: 500, height: 500, crop: "limit" }],
      });
      category.image = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }
    await category.save();
    logger.info(`Category created: ${category.name}`);
    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error(`Error creating category: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
