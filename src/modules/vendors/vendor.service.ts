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

// Admin: list every vendor regardless of status, with optional filter + counts
const adminListVendors = async (query: { status?: string; searchTerm?: string }) => {
  const filter: Record<string, unknown> = {};
  if (query.status && query.status !== 'all') filter.status = query.status;
  if (query.searchTerm) {
    filter.$or = [
      { shopName: { $regex: query.searchTerm, $options: 'i' } },
      { slug: { $regex: query.searchTerm, $options: 'i' } },
      { 'contact.email': { $regex: query.searchTerm, $options: 'i' } },
    ];
  }

  const [vendors, counts] = await Promise.all([
    VendorModel.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean(),
    VendorModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const statusCounts = counts.reduce(
    (acc: Record<string, number>, cur: { _id: string; count: number }) => {
      acc[cur._id] = cur.count;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0, suspended: 0 },
  );

  return { vendors, statusCounts };
};

// Admin: create a vendor directly for an existing user (skips application flow).
// Auto-approves and promotes the user's role to 'vendor'.
const adminCreateVendor = async (payload: {
  user: string;
  shopName: string;
  description?: string;
  logo?: string;
  banner?: string;
  address: IVendor['address'];
  contact: IVendor['contact'];
  commissionRate?: number;
}) => {
  const user = await User.findById(payload.user);
  if (!user || user.isDeleted) throw new AppError(404, 'User not found');

  const existing = await VendorModel.findOne({ user: payload.user });
  if (existing) throw new AppError(409, 'User already has a vendor profile');

  const slug = await generateUniqueSlug(payload.shopName, VendorModel);
  const vendor = await VendorModel.create({
    ...payload,
    slug,
    status: 'approved',
    commissionRate: payload.commissionRate ?? 0.08,
  });

  await User.findByIdAndUpdate(payload.user, { role: USER_ROLE.vendor });
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
  adminListVendors,
  adminCreateVendor,
};
