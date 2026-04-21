import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import { OrderServices } from './order.service';

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.createOrderFromCart(req.user.id, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Order placed successfully',
    data: result,
  });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await OrderServices.getMyOrders(
    req.user.id,
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Orders fetched',
    data,
    meta,
  });
});

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.getOrderById(req.params.id, {
    id: req.user.id,
    role: req.user.role,
  });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order fetched',
    data: result,
  });
});

const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.cancelOrder(
    req.params.id,
    req.user.id,
    req.body?.reason,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order cancelled',
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.updateStatusByVendorOrAdmin(
    req.params.id,
    req.body.status,
    { id: req.user.id, role: req.user.role },
    req.body.note,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Order status updated to ${result.status}`,
    data: result,
  });
});

const getVendorOrders = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await OrderServices.getVendorOrders(
    req.user.id,
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor orders fetched',
    data,
    meta,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await OrderServices.getAllOrders(
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Orders fetched',
    data,
    meta,
  });
});

export const OrderControllers = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getVendorOrders,
  getAllOrders,
};
