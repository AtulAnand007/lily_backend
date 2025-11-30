import express from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';
import { getAllOrders, getOrderById, getUserOrders } from '../controllers/order.controller.js';

const router = express.Router();


router.get("/:id", getOrderById);



router.use(authenticate);

router.get("/UserOrder", getUserOrders);
router.use(authorizeRoles("ADMIN"));

router.get("/allorder", getAllOrders);

export default router;