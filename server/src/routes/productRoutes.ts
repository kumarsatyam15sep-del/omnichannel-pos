import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/productController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = express.Router();

// Apply auth protect middleware to all routes
router.use(protect);

router.route('/')
  .post(authorize(['manager', 'admin']), createProduct)
  .get(getProducts);

router.route('/:id')
  .get(getProductById)
  .put(authorize(['manager', 'admin']), updateProduct)
  .delete(authorize(['admin']), deleteProduct);

export default router;
