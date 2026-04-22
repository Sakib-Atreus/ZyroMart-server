import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import { UserServices } from './user.service';

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getMe(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile fetched',
    data: result,
  });
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.updateMe(req.user.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated',
    data: result,
  });
});

const adminList = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await UserServices.adminList(
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users fetched',
    data,
    meta,
  });
});

export const UserControllers = {
  getMe,
  updateMe,
  adminList,
};
