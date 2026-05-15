import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import { VendorServices } from './vendor.service';

const applyAsVendor = catchAsync(async (req: Request, res: Response) => {
  const result = await VendorServices.applyAsVendor(req.user.id, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Vendor application submitted',
    data: result,
  });
});

const getMyVendorProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await VendorServices.getMyVendorProfile(req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor profile fetched',
    data: result,
  });
});

const updateMyVendorProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await VendorServices.updateMyVendorProfile(req.user.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor profile updated',
    data: result,
  });
});

const getAllVendors = catchAsync(async (_req: Request, res: Response) => {
  const result = await VendorServices.getAllVendors();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendors fetched',
    data: result,
  });
});

const getVendorBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await VendorServices.getVendorBySlug(req.params.slug);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor fetched',
    data: result,
  });
});

const changeVendorStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await VendorServices.changeVendorStatus(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Vendor status updated to ${result.status}`,
    data: result,
  });
});

const adminListVendors = catchAsync(async (req: Request, res: Response) => {
  const { vendors, statusCounts } = await VendorServices.adminListVendors({
    status: req.query.status as string | undefined,
    searchTerm: req.query.searchTerm as string | undefined,
  });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendors fetched (admin)',
    data: { vendors, statusCounts },
  });
});

const adminCreateVendor = catchAsync(async (req: Request, res: Response) => {
  const result = await VendorServices.adminCreateVendor(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Vendor created and approved',
    data: result,
  });
});

export const VendorControllers = {
  applyAsVendor,
  getMyVendorProfile,
  updateMyVendorProfile,
  getAllVendors,
  getVendorBySlug,
  changeVendorStatus,
  adminListVendors,
  adminCreateVendor,
};
