import { Types } from 'mongoose';

export type TVendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

export interface IVendor {
  user: Types.ObjectId;
  shopName: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  address: {
    line1: string;
    city: string;
    country: string;
    postalCode?: string;
  };
  contact: {
    email: string;
    phone?: string;
  };
  status: TVendorStatus;
  rejectionReason?: string;
  commissionRate: number;
  rating: number;
  totalSales: number;
  stripeAccountId?: string;
}
