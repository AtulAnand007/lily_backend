import express from 'express';
import { getProductById } from '../controllers/product.controller.js';

const router = express.Router();

router.get("/:id", getProductById);


export default router;