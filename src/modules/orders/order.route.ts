import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { OrderControllers } from './order.controller';
import {
  createOrderSchema,
  cancelOrderSchema,
  updateOrderStatusSchema,
  orderIdParamsSchema,
} from './order.validation';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLE.user, USER_ROLE.vendor),
  validateRequest(createOrderSchema),
  OrderControllers.createOrder,
);

router.get(
  '/me',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  OrderControllers.getMyOrders,
);

router.get(
  '/vendor/me',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  OrderControllers.getVendorOrders,
);

router.get(
  '/',
  auth(USER_ROLE.admin),
  OrderControllers.getAllOrders,
);

router.get(
  '/:id',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(orderIdParamsSchema),
  OrderControllers.getOrderById,
);

router.patch(
  '/:id/cancel',
  auth(USER_ROLE.user, USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(cancelOrderSchema),
  OrderControllers.cancelOrder,
);

router.patch(
  '/:id/status',
  auth(USER_ROLE.vendor, USER_ROLE.admin),
  validateRequest(updateOrderStatusSchema),
  OrderControllers.updateOrderStatus,
);

export const OrderRoute = router;
