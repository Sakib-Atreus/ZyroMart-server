import AppError from '../../Error/AppError';
import { generateUniqueSlug } from '../../utility/generateSlug';
import User from '../users/user.model';
import { USER_ROLE } from '../users/user.constant';
import { IVendor, TVendorStatus } from './vendor.interface';
import { VendorModel } from './vendor.model';

const applyAsVendor = async (userId: string, payload: Omit<IVendor, 'user' | 'slug' | 'status' | 'commissionRate' | 'rating' | 'totalSales'>) => {
  const existing = await VendorModel.findOne({ user: userId });
  if (existing) throw new AppError(409, 'You already have a vendor profile');

  const slug = await generateUniqueSlug(payload.shopName, VendorModel);
  const vendor = await VendorModel.create({ ...payload, user: userId, slug });
  return vendor;
};

const getMyVendorProfile = async (userId: string) => {
  const vendor = await VendorModel.findOne({ user: userId });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');
  return vendor;
};

const updateMyVendorProfile = async (userId: string, payload: Partial<IVendor>) => {
  const vendor = await VendorModel.findOneAndUpdate(
    { user: userId },
    payload,
    { new: true, runValidators: true },
  );
  if (!vendor) throw new AppError(404, 'Vendor profile not found');
  return vendor;
};

const getAllVendors = async () => {
  return VendorModel.find({ status: 'approved' }).sort({ createdAt: -1 }).lean();
};

const getVendorBySlug = async (slug: string) => {
  const vendor = await VendorModel.findOne({ slug, status: 'approved' }).lean();
  if (!vendor) throw new AppError(404, 'Vendor not found');
  return vendor;
};

const changeVendorStatus = async (
  id: string,
  update: { status: TVendorStatus; rejectionReason?: string; commissionRate?: number },
) => {
  const vendor = await VendorModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!vendor) throw new AppError(404, 'Vendor not found');

  // Promote user role to 'vendor' on approval
  if (update.status === 'approved') {
    await User.findByIdAndUpdate(vendor.user, { role: USER_ROLE.vendor });
  }
  return vendor;
};

const getApprovedVendorByUserOrFail = async (userId: string) => {
  const vendor = await VendorModel.findOne({ user: userId, status: 'approved' });
  if (!vendor) throw new AppError(403, 'Approved vendor profile required');
  return vendor;
};

export const VendorServices = {
  applyAsVendor,
  getMyVendorProfile,
  updateMyVendorProfile,
  getAllVendors,
  getVendorBySlug,
  changeVendorStatus,
  getApprovedVendorByUserOrFail,
};
