import express from 'express';
import { VariantControllers } from './variant.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../users/user.constant';

const router = express.Router();

// Create a new variant
router.post('/', VariantControllers.createVariant);

// Get all variants
router.get('/', VariantControllers.getAllVariants);

// Get a single variant by ID
router.get('/:variantId', VariantControllers.getSingleVariant);

// Delete a variant
router.delete('/:variantId', auth(USER_ROLE.admin), VariantControllers.deleteVariant);

// Update a variant
router.put('/:variantId', auth(USER_ROLE.admin), VariantControllers.updateVariant);

export const VariantRoute = router;
