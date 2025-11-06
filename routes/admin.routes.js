import express from "express"
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
const router = express.Router();
import { getAllUser } from "../controllers/admin.controller.js";


router.get("/all", authenticate, authorizeRoles("ADMIN"), getAllUser);
export default router;