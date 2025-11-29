import express from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';
import { getAllOrders } from '../controllers/order.controller.js';

const router = express.Router();



// for admin only 
router.use(authenticate);
router.use(authorizeRoles("ADMIN"));

router.get("/allorder", getAllOrders);

export default router;