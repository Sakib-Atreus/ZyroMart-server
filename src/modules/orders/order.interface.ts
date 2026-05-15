import { Types } from 'mongoose';

export type TOrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type TPaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';
export type TPaymentMethod = 'stripe' | 'cod' | 'sslcommerz';

export interface IAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  country: string;
  postalCode?: string;
  phone: string;
}

export interface IOrderItem {
  product: Types.ObjectId;
  variant: Types.ObjectId;
  vendor: Types.ObjectId;
  productSnapshot: {
    name: string;
    brand: string;
    thumbnail: string;
    slug: string;
  };
  variantSnapshot: {
    sku: string;
    options: Record<string, string>;
  };
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface IStatusHistoryEntry {
  status: TOrderStatus;
  at: Date;
  note?: string;
}

export interface IOrder {
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];

  shippingAddress: IAddress;
  billingAddress?: IAddress;

  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;

  status: TOrderStatus;
  paymentStatus: TPaymentStatus;
  paymentMethod: TPaymentMethod;

  stripe?: {
    sessionId?: string;
    paymentIntentId?: string;
    chargeId?: string;
  };

  sslcommerz?: {
    tranId?: string;
    valId?: string;
    bankTranId?: string;
  };

  statusHistory: IStatusHistoryEntry[];
  placedAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}
