import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { VendorControllers } from './vendor.controller';
import {
  applyVendorSchema,
  updateVendorSchema,
  changeVendorStatusSchema,
  adminCreateVendorSchema,
} from './vendor.validation';

const router = express.Router();

// Admin routes — mounted BEFORE `:slug` so they don't collide with it
router.get(
  '/admin/list',
  auth(USER_ROLE.admin),
  VendorControllers.adminListVendors,
);

router.post(
  '/admin/create',
  auth(USER_ROLE.admin),
  validateRequest(adminCreateVendorSchema),
  VendorControllers.adminCreateVendor,
);

router.get('/', VendorControllers.getAllVendors);

router.post(
  '/apply',
  auth(USER_ROLE.user, USER_ROLE.vendor),
  validateRequest(applyVendorSchema),
  VendorControllers.applyAsVendor,
);

router.get(
  '/me',
  auth(USER_ROLE.vendor, USER_ROLE.user, USER_ROLE.admin),
  VendorControllers.getMyVendorProfile,
);

router.patch(
  '/me',
  auth(USER_ROLE.vendor, USER_ROLE.user, USER_ROLE.admin),
  validateRequest(updateVendorSchema),
  VendorControllers.updateMyVendorProfile,
);

router.patch(
  '/:id/status',
  auth(USER_ROLE.admin),
  validateRequest(changeVendorStatusSchema),
  VendorControllers.changeVendorStatus,
);

router.get('/:slug', VendorControllers.getVendorBySlug);

export const VendorRoute = router;
