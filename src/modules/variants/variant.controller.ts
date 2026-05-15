import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import { USER_ROLE } from '../users/user.constant';
import { VendorServices } from '../vendors/vendor.service';
import { VariantServices } from './variant.service';

const resolveVendorId = async (req: Request) => {
  if (req.user.role === USER_ROLE.admin) return { vendorId: '', isAdmin: true };
  const vendor = await VendorServices.getApprovedVendorByUserOrFail(req.user.id);
  return { vendorId: vendor._id.toString(), isAdmin: false };
};

const createVariant = catchAsync(async (req: Request, res: Response) => {
  const { vendorId, isAdmin } = await resolveVendorId(req);
  const result = await VariantServices.createVariant(vendorId, req.body, isAdmin);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Variant created',
    data: result,
  });
});

const generateBulkVariants = catchAsync(async (req: Request, res: Response) => {
  const { vendorId, isAdmin } = await resolveVendorId(req);
  const result = await VariantServices.generateBulkVariants(vendorId, req.body, isAdmin);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: `${(result as unknown[]).length} variants created`,
    data: result,
  });
});

const updateVariant = catchAsync(async (req: Request, res: Response) => {
  const { vendorId, isAdmin } = await resolveVendorId(req);
  const result = await VariantServices.updateVariant(
    vendorId,
    req.params.id,
    req.body,
    isAdmin,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Variant updated',
    data: result,
  });
});

const deleteVariant = catchAsync(async (req: Request, res: Response) => {
  const { vendorId, isAdmin } = await resolveVendorId(req);
  const result = await VariantServices.deleteVariant(vendorId, req.params.id, isAdmin);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Variant deactivated',
    data: result,
  });
});

const getVariantsForProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await VariantServices.getVariantsForProduct(req.params.productId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Variants fetched',
    data: result,
  });
});

export const VariantControllers = {
  createVariant,
  generateBulkVariants,
  updateVariant,
  deleteVariant,
  getVariantsForProduct,
};
