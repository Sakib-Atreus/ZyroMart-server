import { Types } from 'mongoose';
import AppError from '../../Error/AppError';
import { ProductModel } from '../products/product.model';
import { VariantModel } from '../variants/variant.model';
import { CartModel } from './cart.model';

/**
 * Carts never store prices. Price is resolved from Variant every read
 * and re-validated at order placement. This prevents client-side tampering.
 */
const getOrCreateCart = async (userId: string) => {
  let cart = await CartModel.findOne({ user: userId });
  if (!cart) cart = await CartModel.create({ user: userId, items: [] });
  return cart;
};

const hydrateCart = async (userId: string) => {
  const cart = await CartModel.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'name brand slug thumbnail currency status isDeleted',
    })
    .populate({
      path: 'items.variant',
      select: 'sku options price compareAtPrice stock reservedStock isActive images',
    })
    .lean();

  if (!cart) return { items: [], subtotal: 0, itemCount: 0 };

  // Filter out items whose product/variant was deleted or archived
  const validItems = cart.items.filter(item => {
    const product = item.product as unknown as { status?: string; isDeleted?: boolean } | null;
    const variant = item.variant as unknown as { isActive?: boolean } | null;
    return (
      product &&
      variant &&
      !product.isDeleted &&
      product.status === 'approved' &&
      variant.isActive
    );
  });

  // If stale items were found, remove them from the DB cart so order creation
  // never sees them and throws "no longer available".
  if (validItems.length < cart.items.length) {
    const validVariantIds = validItems.map(
      i => (i.variant as unknown as { _id: Types.ObjectId })._id,
    );
    CartModel.updateOne(
      { user: userId },
      { $pull: { items: { variant: { $nin: validVariantIds } } } },
    ).exec().catch(() => undefined);
  }

  let subtotal = 0;
  const items = validItems.map(item => {
    const variant = item.variant as unknown as {
      price: number;
      stock: number;
      reservedStock: number;
    };
    const lineTotal = variant.price * item.quantity;
    subtotal += lineTotal;
    return {
      ...item,
      lineTotal,
      availableStock: variant.stock - variant.reservedStock,
    };
  });

  return {
    items,
    subtotal,
    itemCount: items.reduce((n, it) => n + it.quantity, 0),
  };
};

const addItem = async (
  userId: string,
  payload: { product: string; variant: string; quantity: number },
) => {
  const [product, variant] = await Promise.all([
    ProductModel.findById(payload.product).lean(),
    VariantModel.findById(payload.variant).lean(),
  ]);

  if (!product || product.isDeleted || product.status !== 'approved') {
    throw new AppError(404, 'Product not available');
  }
  if (!variant || !variant.isActive) {
    throw new AppError(404, 'Variant not available');
  }
  if (variant.product.toString() !== payload.product) {
    throw new AppError(400, 'Variant does not belong to the given product');
  }

  const available = variant.stock - variant.reservedStock;
  if (available < payload.quantity) {
    throw new AppError(409, `Only ${available} unit(s) available`);
  }

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find(it => it.variant.toString() === payload.variant);

  if (existing) {
    const newQty = existing.quantity + payload.quantity;
    if (newQty > available) {
      throw new AppError(409, `Only ${available} unit(s) available`);
    }
    existing.quantity = newQty;
  } else {
    cart.items.push({
      product: new Types.ObjectId(payload.product),
      variant: new Types.ObjectId(payload.variant),
      quantity: payload.quantity,
      addedAt: new Date(),
    });
  }

  await cart.save();
  return hydrateCart(userId);
};

const updateItemQuantity = async (userId: string, variantId: string, quantity: number) => {
  const cart = await CartModel.findOne({ user: userId });
  if (!cart) throw new AppError(404, 'Cart not found');

  const item = cart.items.find(it => it.variant.toString() === variantId);
  if (!item) throw new AppError(404, 'Item not in cart');

  const variant = await VariantModel.findById(variantId).lean();
  if (!variant || !variant.isActive) throw new AppError(404, 'Variant not available');

  const available = variant.stock - variant.reservedStock;
  if (quantity > available) {
    throw new AppError(409, `Only ${available} unit(s) available`);
  }

  item.quantity = quantity;
  await cart.save();
  return hydrateCart(userId);
};

const removeItem = async (userId: string, variantId: string) => {
  const cart = await CartModel.findOne({ user: userId });
  if (!cart) throw new AppError(404, 'Cart not found');
  cart.items = cart.items.filter(it => it.variant.toString() !== variantId);
  await cart.save();
  return hydrateCart(userId);
};

const clearCart = async (userId: string) => {
  await CartModel.updateOne({ user: userId }, { $set: { items: [] } }, { upsert: true });
  return { items: [], subtotal: 0, itemCount: 0 };
};

export const CartServices = {
  hydrateCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
