import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import { USER_ROLE } from '../users/user.constant';
import { ReviewServices } from './review.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.createReview(req.user.id, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Review posted',
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user.role === USER_ROLE.admin;
  const result = await ReviewServices.updateReview(req.user.id, req.params.id, req.body, isAdmin);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review updated',
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user.role === USER_ROLE.admin;
  const result = await ReviewServices.deleteReview(req.user.id, req.params.id, isAdmin);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review deleted',
    data: result,
  });
});

const listByProduct = catchAsync(async (req: Request, res: Response) => {
  const { data, meta, summary } = await ReviewServices.listByProduct(
    req.params.productId,
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Reviews fetched',
    data: { reviews: data, summary },
    meta,
  });
});

const getMyReviewForProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.getMyReviewForProduct(req.user.id, req.params.productId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result ? 'Review found' : 'No review yet',
    data: result,
  });
});

export const ReviewControllers = {
  createReview,
  updateReview,
  deleteReview,
  listByProduct,
  getMyReviewForProduct,
};
