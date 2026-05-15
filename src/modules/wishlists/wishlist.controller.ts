import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import { WishlistServices } from './wishlist.service';

const getMyWishlist = catchAsync(async (req: Request, res: Response) => {
  const result = await WishlistServices.getMyWishlist(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Wishlist fetched',
    data: result,
  });
});

const addItem = catchAsync(async (req: Request, res: Response) => {
  const result = await WishlistServices.addItem(req.user.id, req.body.product);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Added to wishlist',
    data: result,
  });
});

const removeItem = catchAsync(async (req: Request, res: Response) => {
  const result = await WishlistServices.removeItem(req.user.id, req.params.productId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Removed from wishlist',
    data: result,
  });
});

const clearWishlist = catchAsync(async (req: Request, res: Response) => {
  const result = await WishlistServices.clearWishlist(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Wishlist cleared',
    data: result,
  });
});

export const WishlistControllers = {
  getMyWishlist,
  addItem,
  removeItem,
  clearWishlist,
};
