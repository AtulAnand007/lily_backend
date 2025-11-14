import logger from "../config/logger.js";
import Category from "../models/category.model.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

// create category -- admin only
export const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory, isActive } = req.body;

    if(!name || typeof name !== "string"){
      return res.status(400).json({
        success: false,
        message: "Category name is required."
      })
    }

    // check for duplicate category
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Category name must be unique",
      });
    }
    const category = new Category({
      name: name.trim(),
      description: description?.trim() || "",
      parentCategory: parentCategory || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    // upload image if provided
    if (req.file?.path && req.file?.filename) {
      category.image = {
        url: req.file.path,
        public_id: req.file.filename,
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
      message: "Internal Server error",
    });
  }
};

// update category -- only for admin
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentCategory, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // update fields
    if (name) category.name = name;
    if (description) category.description = description;
    if (parentCategory !== undefined) category.parentCategory = parentCategory;
    if (isActive !== undefined) category.isActive = isActive;

    // handle image update only if a new file was uploaded
    if (req.file?.path && req.file?.filename) {
      // delete old image if it exists
      if (category.image?.public_id) {
        try {
          await cloudinary.uploader.destroy(category.image.public_id);
          logger.info("Old category image deleted from Cloudinary");
        } catch (err) {
          logger.warn(`Failed to delete old category image: ${err.message}`);
        }
      }

      // assign new image
      category.image = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    await category.save({ validateBeforeSave: false });

    logger.info(`Category updated: ${category.name}`);
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error(`Error while updating category: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error while updating category",
    });
  }
};

// delete category -- admin only
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      })
    }

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }


  } catch (error) {
    logger.error(`Error while deleting category: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Server error while deleting category"
    })
  }
};
