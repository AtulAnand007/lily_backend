import express from "express"
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
const router = express.Router();
import {
    getAllUser,
    deleteUser,
    getUserdetail

} from "../controllers/admin.controller.js";


router.get("/all", authenticate, authorizeRoles("ADMIN"), getAllUser);
router.get("/:userId", authenticate, authorizeRoles("ADMIN"), getUserdetail);
router.delete("/:userId", authenticate, authorizeRoles("ADMIN"), deleteUser);
export default router;