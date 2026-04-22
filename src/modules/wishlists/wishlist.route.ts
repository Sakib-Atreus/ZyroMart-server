import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { WishlistControllers } from './wishlist.controller';
import { addWishlistItemSchema, wishlistItemParamsSchema } from './wishlist.validation';

const router = express.Router();

router.use(auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin));

router.get('/', WishlistControllers.getMyWishlist);

router.post(
  '/items',
  validateRequest(addWishlistItemSchema),
  WishlistControllers.addItem,
);

router.delete(
  '/items/:productId',
  validateRequest(wishlistItemParamsSchema),
  WishlistControllers.removeItem,
);

router.delete('/', WishlistControllers.clearWishlist);

export const WishlistRoute = router;
