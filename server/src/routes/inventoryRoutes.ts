import express from 'express';
import {
  getInventory,
  getLowStock,
  updateStock
} from '../controllers/inventoryController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

router.route('/')
  .get(getInventory);

router.route('/low-stock')
  .get(authorize(['manager', 'admin']), getLowStock);

router.route('/:id')
  .put(authorize(['manager', 'admin']), updateStock);

export default router;
