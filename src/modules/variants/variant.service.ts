import crypto from 'crypto';
import AppError from '../../Error/AppError';
import { ProductModel } from '../products/product.model';
import { IVariant } from './variant.interface';
import { VariantModel } from './variant.model';

const hashOptions = (options: Record<string, string>): string => {
  const normalized = Object.keys(options)
    .sort()
    .map(k => `${k}=${options[k]}`)
    .join('|');
  return crypto.createHash('sha1').update(normalized).digest('hex');
};

const cartesian = (options: { key: string; values: string[] }[]): Record<string, string>[] =>
  options.reduce<Record<string, string>[]>(
    (acc, opt) => acc.flatMap(combo => opt.values.map(v => ({ ...combo, [opt.key]: v }))),
    [{}],
  );

const ensureProductOwnership = async (productId: string, vendorId: string, isAdmin = false) => {
  const product = await ProductModel.findById(productId);
  if (!product || product.isDeleted) throw new AppError(404, 'Product not found');
  if (!isAdmin && product.vendor.toString() !== vendorId) {
    throw new AppError(403, 'You do not own this product');
  }
  return product;
};

const validateOptionsAgainstProduct = (
  options: Record<string, string>,
  declarations: { key: string; values: string[] }[],
) => {
  const declByKey = new Map(declarations.map(d => [d.key, d]));
  const declaredKeys = new Set(declByKey.keys());

  for (const key of Object.keys(options)) {
    if (!declaredKeys.has(key)) {
      throw new AppError(400, `Option '${key}' is not declared on this product`);
    }
    const value = options[key];
    const allowed = declByKey.get(key)!.values;
    if (!allowed.includes(value)) {
      throw new AppError(
        400,
        `Option '${key}' value '${value}' not in declared values: ${allowed.join(', ')}`,
      );
    }
  }
  for (const key of declaredKeys) {
    if (!(key in options)) {
      throw new AppError(400, `Missing option '${key}' — required by product declaration`);
    }
  }
};

const createVariant = async (
  vendorId: string,
  input: Omit<IVariant, 'optionsHash' | 'reservedStock' | 'options' | 'product'> & {
    product: string;
    options: Record<string, string>;
  },
  isAdmin = false,
) => {
  const product = await ensureProductOwnership(input.product, vendorId, isAdmin);
  if (!product.hasVariants) {
    throw new AppError(400, 'Product is not configured with variants');
  }
  validateOptionsAgainstProduct(input.options, product.variantOptions);

  const optionsHash = hashOptions(input.options);
  const variant = await VariantModel.create({
    ...input,
    optionsHash,
    reservedStock: 0,
  });
  return variant;
};

const generateBulkVariants = async (
  vendorId: string,
  input: {
    product: string;
    defaults: { price: number; compareAtPrice?: number; stock: number };
    overrides?: {
      options: Record<string, string>;
      price?: number;
      compareAtPrice?: number;
      stock?: number;
      sku?: string;
    }[];
  },
  isAdmin = false,
) => {
  const product = await ensureProductOwnership(input.product, vendorId, isAdmin);
  if (!product.hasVariants || product.variantOptions.length === 0) {
    throw new AppError(400, 'Product has no variantOptions declared');
  }

  const combinations = cartesian(product.variantOptions);
  const overrideByHash = new Map(
    (input.overrides ?? []).map(o => [hashOptions(o.options), o]),
  );

  // Idempotent: skip combinations that already have a variant
  const existing = await VariantModel.find({ product: product._id })
    .select('optionsHash')
    .lean();
  const existingHashes = new Set(existing.map(v => v.optionsHash));

  const docs = combinations
    .filter(options => !existingHashes.has(hashOptions(options)))
    .map(options => {
      const optionsHash = hashOptions(options);
      const override = overrideByHash.get(optionsHash);
      const sku =
        override?.sku ||
        `${product.slug.toUpperCase().slice(0, 8)}-${optionsHash.slice(0, 8)}`;
      return {
        product: product._id,
        sku,
        options,
        optionsHash,
        price: override?.price ?? input.defaults.price,
        compareAtPrice: override?.compareAtPrice ?? input.defaults.compareAtPrice,
        stock: override?.stock ?? input.defaults.stock,
        reservedStock: 0,
        isActive: true,
      };
    });

  if (docs.length === 0) return [];

  const created = await VariantModel.insertMany(docs);
  return created;
};

const updateVariant = async (
  vendorId: string,
  variantId: string,
  input: Partial<IVariant> & { options?: Record<string, string> },
  isAdmin = false,
) => {
  const variant = await VariantModel.findById(variantId);
  if (!variant) throw new AppError(404, 'Variant not found');

  const product = await ensureProductOwnership(
    variant.product.toString(),
    vendorId,
    isAdmin,
  );

  const update: Record<string, unknown> = { ...input };
  if (input.options) {
    validateOptionsAgainstProduct(input.options, product.variantOptions);
    update.optionsHash = hashOptions(input.options);
    update.options = new Map(Object.entries(input.options));
  }

  const updated = await VariantModel.findByIdAndUpdate(variantId, update, {
    new: true,
    runValidators: true,
  });
  return updated;
};

const deleteVariant = async (vendorId: string, variantId: string, isAdmin = false) => {
  const variant = await VariantModel.findById(variantId);
  if (!variant) throw new AppError(404, 'Variant not found');
  await ensureProductOwnership(variant.product.toString(), vendorId, isAdmin);
  variant.isActive = false;
  await variant.save();
  return variant;
};

const getVariantsForProduct = async (productId: string) => {
  return VariantModel.find({ product: productId, isActive: true }).lean();
};

export const VariantServices = {
  createVariant,
  generateBulkVariants,
  updateVariant,
  deleteVariant,
  getVariantsForProduct,
  hashOptions,
};
