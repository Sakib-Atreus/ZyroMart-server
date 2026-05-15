import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import AppError from '../../Error/AppError';
import { VendorModel } from '../vendors/vendor.model';
import { AnalyticsServices } from './analytics.service';

const platformOverview = catchAsync(async (_req: Request, res: Response) => {
  const data = await AnalyticsServices.getPlatformOverview();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Platform analytics fetched',
    data,
  });
});

const vendorOverview = catchAsync(async (req: Request, res: Response) => {
  const vendor = await VendorModel.findOne({ user: req.user.id });
  if (!vendor) throw new AppError(403, 'Vendor profile required');
  const data = await AnalyticsServices.getVendorOverview(vendor._id.toString());
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor analytics fetched',
    data,
  });
});

export const AnalyticsControllers = { platformOverview, vendorOverview };
