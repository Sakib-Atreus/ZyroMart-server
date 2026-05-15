import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import { CartServices } from './cart.service';

const getMyCart = catchAsync(async (req: Request, res: Response) => {
  const result = await CartServices.hydrateCart(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Cart fetched',
    data: result,
  });
});

const addItem = catchAsync(async (req: Request, res: Response) => {
  const result = await CartServices.addItem(req.user.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Item added to cart',
    data: result,
  });
});

const updateItemQuantity = catchAsync(async (req: Request, res: Response) => {
  const result = await CartServices.updateItemQuantity(
    req.user.id,
    req.params.variantId,
    req.body.quantity,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Cart item updated',
    data: result,
  });
});

const removeItem = catchAsync(async (req: Request, res: Response) => {
  const result = await CartServices.removeItem(req.user.id, req.params.variantId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Item removed from cart',
    data: result,
  });
});

const clearCart = catchAsync(async (req: Request, res: Response) => {
  const result = await CartServices.clearCart(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Cart cleared',
    data: result,
  });
});

export const CartControllers = {
  getMyCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
