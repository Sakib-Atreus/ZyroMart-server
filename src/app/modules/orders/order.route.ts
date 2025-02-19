import express from 'express';
import { OrderControllers } from './order.controller';
import validateRequest from '../../middleware/validateRequest';
import { OrderValidations } from './order.validation';

const router = express.Router();

// this all routes call the controllers function to :
// create or post a new order
router.post(
  '/',
  validateRequest(OrderValidations.orderValidationSchema),
  OrderControllers.createOrder,
);

// get all orders
router.get('/', OrderControllers.getAllOrders);

// get a single order
router.get('/:orderId', OrderControllers.getSingleOrder);

export const OrderRoute = router;
