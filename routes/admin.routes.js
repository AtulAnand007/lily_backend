import express from "express"
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
const router = express.Router();
import { getAllUser, deleteUser } from "../controllers/admin.controller.js";


router.get("/all", authenticate, authorizeRoles("ADMIN"), getAllUser);
router.delete("/:userId", authenticate, authorizeRoles("ADMIN"), deleteUser);
export default router;