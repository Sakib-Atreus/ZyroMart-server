import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { ProductControllers } from './product.controller';
import {
  createProductSchema,
  updateProductSchema,
  changeProductStatusSchema,
  productIdParamsSchema,
} from './product.validation';

const router = express.Router();

// public
router.get('/', ProductControllers.getAllProducts);
router.get('/featured/new-arrivals', ProductControllers.getNewArrivals);
router.get('/featured/top-selling', ProductControllers.getTopSelling);
router.get('/featured/online-exclusive', ProductControllers.getOnlineExclusive);
router.get('/similar/:id', ProductControllers.getSimilarProducts);

// vendor dashboard
router.get(
  '/vendor/me',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  ProductControllers.getVendorProducts,
);

// public detail — must be last so named segments above take priority
router.get('/:slug', ProductControllers.getProductBySlug);

// vendor write
router.post(
  '/',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(createProductSchema),
  ProductControllers.createProduct,
);

router.patch(
  '/:id',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(updateProductSchema),
  ProductControllers.updateProduct,
);

router.delete(
  '/:id',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(productIdParamsSchema),
  ProductControllers.deleteProduct,
);

// admin moderation
router.patch(
  '/:id/status',
  auth(USER_ROLE.admin),
  validateRequest(changeProductStatusSchema),
  ProductControllers.changeProductStatus,
);

export const ProductRoute = router;
