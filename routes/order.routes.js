import express from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';
import { getAllOrders, getOrderById } from '../controllers/order.controller.js';

const router = express.Router();


router.get("/:id", getOrderById);


// for admin only 
router.use(authenticate);
router.use(authorizeRoles("ADMIN"));

router.get("/allorder", getAllOrders);

export default router;