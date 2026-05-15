import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { VariantControllers } from './variant.controller';
import {
  createVariantSchema,
  bulkVariantsSchema,
  updateVariantSchema,
  variantIdParamsSchema,
  variantByProductParamsSchema,
} from './variant.validation';

const router = express.Router();

router.get(
  '/product/:productId',
  validateRequest(variantByProductParamsSchema),
  VariantControllers.getVariantsForProduct,
);

router.post(
  '/',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(createVariantSchema),
  VariantControllers.createVariant,
);

router.post(
  '/bulk',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(bulkVariantsSchema),
  VariantControllers.generateBulkVariants,
);

router.patch(
  '/:id',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(updateVariantSchema),
  VariantControllers.updateVariant,
);

router.delete(
  '/:id',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(variantIdParamsSchema),
  VariantControllers.deleteVariant,
);

export const VariantRoute = router;
