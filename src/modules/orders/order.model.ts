import { Schema, model } from 'mongoose';
import { IAddress, IOrder, IOrderItem, IStatusHistoryEntry } from './order.interface';

const AddressSchema = new Schema<IAddress>(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String },
    phone: { type: String, required: true },
  },
  { _id: false },
);

const ProductSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    thumbnail: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false },
);

const VariantSnapshotSchema = new Schema(
  {
    sku: { type: String, required: true },
    options: { type: Map, of: String, required: true },
  },
  { _id: false },
);

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'Variant', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    productSnapshot: { type: ProductSnapshotSchema, required: true },
    variantSnapshot: { type: VariantSnapshotSchema, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const StatusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      required: true,
    },
    at: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    items: { type: [OrderItemSchema], required: true },

    shippingAddress: { type: AddressSchema, required: true },
    billingAddress: { type: AddressSchema },

    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, default: 0, min: 0 },
    tax: { type: Number, required: true, default: 0, min: 0 },
    discount: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'BDT', uppercase: true },

    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'cod', 'sslcommerz'],
      required: true,
    },

    stripe: {
      sessionId: { type: String, index: true },
      paymentIntentId: { type: String },
      chargeId: { type: String },
    },

    sslcommerz: {
      tranId: { type: String, index: true, sparse: true },
      valId: { type: String },
      bankTranId: { type: String },
    },

    statusHistory: { type: [StatusHistorySchema], default: [] },
    placedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, paymentStatus: 1 });

export const OrderModel = model<IOrder>('Order', OrderSchema);
