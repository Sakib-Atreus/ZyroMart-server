import { Router } from 'express';
import { AuthControllers } from './auth.controller';
import validateRequest from '../../middleware/validateRequest';
import { UserValidations } from '../users/user.validation';
import { AuthValidations } from './auth.validation';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../users/user.constant';

const router = Router();

router.post(
  '/signup',
  validateRequest(UserValidations.userCreateValidationSchema),
  AuthControllers.registeredUser,
);

router.post(
  '/login',
  validateRequest(AuthValidations.loginUserValidationSchema),
  AuthControllers.loginUser,
);

router.post(
  '/change-password',
  auth(USER_ROLE.admin, USER_ROLE.user),
  validateRequest(AuthValidations.changePasswordValidationSchema),
  AuthControllers.changePassword,
);

router.post('/logout', auth(USER_ROLE.admin, USER_ROLE.user), AuthControllers.logoutUser);

export const AuthRoutes = router;
