import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { VendorControllers } from './vendor.controller';
import {
  applyVendorSchema,
  updateVendorSchema,
  changeVendorStatusSchema,
} from './vendor.validation';

const router = express.Router();

router.get('/', VendorControllers.getAllVendors);

router.post(
  '/apply',
  auth(USER_ROLE.user, USER_ROLE.vendor),
  validateRequest(applyVendorSchema),
  VendorControllers.applyAsVendor,
);

router.get(
  '/me',
  auth(USER_ROLE.vendor, USER_ROLE.user),
  VendorControllers.getMyVendorProfile,
);

router.patch(
  '/me',
  auth(USER_ROLE.vendor, USER_ROLE.user),
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
