import express from 'express';
import { createOrder, getOrders } from '../controllers/orderController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Apply auth protect middleware to all routes
router.use(protect);

router.route('/')
  .post(createOrder)
  .get(getOrders);

export default router;
