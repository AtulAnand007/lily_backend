import logger from "../config/logger.js";
import Category from "../models/category.model.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

// create category -- admin only
export const createCategory = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admins only",
      });
    }

    const { name, description, parentCategory, isActive } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    // check for duplicate category
    const formattedName = name.trim().toLowerCase();
    const existing = await Category.findOne({ name: formattedName });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Category name must be unique",
      });
    }

    // validate parentCategory ID
    if (parentCategory && !mongoose.isValidObjectId(parentCategory)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent category ID",
      });
    }

    // check parent exists
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found",
        });
      }
    }

    const category = new Category({
      name: formattedName,
      description: typeof description === "string" ? description.trim() : "",
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
    if (name !== undefined) {
      const formattedName = name.trim().toLowerCase();

      const existing = await Category.findOne({ name: formattedName });
      if (existing && existing._id.toString() !== id) {
        return res.status(409).json({
          success: false,
          message: "Category name already exists",
        });
      }

      category.name = formattedName;
    }

    if (description !== undefined) {
      category.description =
        typeof description === "string"
          ? description.trim()
          : category.description;
    }

    if (parentCategory !== undefined) {
      // prevent self-parenting
      if (parentCategory === id) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be its own parent",
        });
      }

      // validate ObjectId
      if (parentCategory && !mongoose.isValidObjectId(parentCategory)) {
        return res.status(400).json({
          success: false,
          message: "Invalid parent category ID",
        });
      }

      // ensure parent exists
      if (parentCategory) {
        const parent = await Category.findById(parentCategory);
        if (!parent) {
          return res.status(404).json({
            success: false,
            message: "Parent category not found",
          });
        }
      }

      category.parentCategory = parentCategory || null;
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }
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

    await category.save();

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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
  } catch (error) {
    logger.error(`Error while deleting category: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error while deleting category",
    });
  }
};
