import { Request, Response } from 'express';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import { VendorServices } from '../vendors/vendor.service';
import { USER_ROLE } from '../users/user.constant';
import { ProductServices } from './product.service';

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const vendor = await VendorServices.getApprovedVendorByUserOrFail(req.user.id);
  const result = await ProductServices.createProduct(vendor._id.toString(), req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Product submitted for approval',
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user.role === USER_ROLE.admin;
  let vendorId = '';
  if (!isAdmin) {
    const vendor = await VendorServices.getApprovedVendorByUserOrFail(req.user.id);
    vendorId = vendor._id.toString();
  }
  const result = await ProductServices.updateProduct(
    vendorId,
    req.params.id,
    req.body,
    isAdmin,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product updated',
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user.role === USER_ROLE.admin;
  let vendorId = '';
  if (!isAdmin) {
    const vendor = await VendorServices.getApprovedVendorByUserOrFail(req.user.id);
    vendorId = vendor._id.toString();
  }
  const result = await ProductServices.deleteProduct(vendorId, req.params.id, isAdmin);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product deleted',
    data: result,
  });
});

const changeProductStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.changeProductStatus(
    req.params.id,
    req.body.status,
    req.body.rejectionReason,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Product status updated to ${result.status}`,
    data: result,
  });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await ProductServices.getAllProducts(
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Products fetched',
    data,
    meta,
  });
});

const getProductBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.getProductBySlug(req.params.slug);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product fetched',
    data: result,
  });
});

const getVendorProducts = catchAsync(async (req: Request, res: Response) => {
  const vendor = await VendorServices.getApprovedVendorByUserOrFail(req.user.id);
  const { data, meta } = await ProductServices.getVendorProducts(
    vendor._id.toString(),
    req.query as Record<string, unknown>,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor products fetched',
    data,
    meta,
  });
});

export const ProductControllers = {
  createProduct,
  updateProduct,
  deleteProduct,
  changeProductStatus,
  getAllProducts,
  getProductBySlug,
  getVendorProducts,
};
