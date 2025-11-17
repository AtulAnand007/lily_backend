import express from "express";
import {
  authenticate,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";
const router = express.Router();
import {
  getAllUser,
  deleteUser,
  getUserdetail,
  getDashboardOverview,
} from "../controllers/admin.controller.js";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

// middleware use
router.use(authenticate);
router.use(authorizeRoles("ADMIN"));

// admin to user
router.get("/all", getAllUser);
router.get("/:userId", getUserdetail);
router.delete("/:userId", deleteUser);

// admin to product
router.post(
  "/create",
  (req, res, next) => {
    (req.uploadType = "product_image"), next();
  },
  upload.single("image"),
  createProduct
);
router.put(
  "/update-product/:id",
  (req, res, next) => {
    req.uploadType = "product_image";
    next();
  },
  upload.single("image"),
  updateProduct
);
router.delete(
  "/delete/:prodId",
  deleteProduct
);

// admin to admin
router.get(
  "/dashboard",
  getDashboardOverview
);

export default router;
