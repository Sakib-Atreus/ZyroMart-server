import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { CartControllers } from './cart.controller';
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamsSchema,
} from './cart.validation';

const router = express.Router();

router.use(auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin));

router.get('/', CartControllers.getMyCart);

router.post(
  '/items',
  validateRequest(addCartItemSchema),
  CartControllers.addItem,
);

router.patch(
  '/items/:variantId',
  validateRequest(updateCartItemSchema),
  CartControllers.updateItemQuantity,
);

router.delete(
  '/items/:variantId',
  validateRequest(cartItemParamsSchema),
  CartControllers.removeItem,
);

router.delete('/', CartControllers.clearCart);

export const CartRoute = router;
