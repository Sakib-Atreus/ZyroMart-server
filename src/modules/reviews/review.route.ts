import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { ReviewControllers } from './review.controller';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdParamsSchema,
  reviewByProductParamsSchema,
} from './review.validation';

const router = express.Router();

// Public: list reviews for a product (with summary for the detail page)
router.get(
  '/product/:productId',
  validateRequest(reviewByProductParamsSchema),
  ReviewControllers.listByProduct,
);

// Authenticated: fetch my own review for a product (to drive the "edit" UI)
router.get(
  '/product/:productId/me',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(reviewByProductParamsSchema),
  ReviewControllers.getMyReviewForProduct,
);

router.post(
  '/',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(createReviewSchema),
  ReviewControllers.createReview,
);

router.patch(
  '/:id',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(updateReviewSchema),
  ReviewControllers.updateReview,
);

router.delete(
  '/:id',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(reviewIdParamsSchema),
  ReviewControllers.deleteReview,
);

export const ReviewRoute = router;
