import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from './user.constant';
import { UserControllers } from './user.controller';
import { UserValidations } from './user.validation';

const router = express.Router();

router.get(
  '/me',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  UserControllers.getMe,
);

router.patch(
  '/me',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(UserValidations.updateMeValidationSchema),
  UserControllers.updateMe,
);

export const UserRoute = router;
