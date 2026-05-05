import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { CategoryControllers } from './category.controller';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
} from './category.validation';

const router = express.Router();

router.get('/', CategoryControllers.getAllCategories);
router.get('/featured', CategoryControllers.getFeaturedCategories);
router.get('/:slug', CategoryControllers.getCategoryBySlug);

router.post(
  '/',
  auth(USER_ROLE.admin),
  validateRequest(createCategorySchema),
  CategoryControllers.createCategory,
);

router.patch(
  '/:id',
  auth(USER_ROLE.admin),
  validateRequest(updateCategorySchema),
  CategoryControllers.updateCategory,
);

router.delete(
  '/:id',
  auth(USER_ROLE.admin),
  validateRequest(categoryParamsSchema),
  CategoryControllers.deleteCategory,
);

export const CategoryRoute = router;
