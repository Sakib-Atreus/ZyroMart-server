import { PipelineStage, Types } from 'mongoose';
import AppError from '../../Error/AppError';
import QueryBuilder from '../../utility/QueryBuilder';
import { cache, hashParams } from '../../utility/cache';
import { TMeta } from '../../interface/sendResponse.interface';
import { generateUniqueSlug } from '../../utility/generateSlug';
import config from '../../config';
import { CategoryModel } from '../categories/category.model';
import { VariantModel } from '../variants/variant.model';
import { IProduct, TProductStatus } from './product.interface';
import { ProductModel } from './product.model';
import { validateAttributes, validateVariantOptionKeys } from './validateAttributes';

type CreateProductInput = Partial<IProduct> & {
  category: string;
  name: string;
  brand: string;
  description: string;
  images: string[];
  thumbnail: string;
  basePrice: number;
  hasVariants?: boolean;
  variantOptions?: IProduct['variantOptions'];
  attributes?: Record<string, unknown>;
};

// --- Cache invalidation helper ------------------------------------------------
const invalidateProductCache = () => cache.delPattern('products:*');

// --- Query parsing ------------------------------------------------------------
/**
 * Parse `?attrs=color:Black,ram:8GB` into `{ color: 'Black', ram: '8GB' }`.
 * Also accepts the same input passed as an already-decoded object.
 */
const parseAttrsQuery = (raw: unknown): Record<string, string> | null => {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const entries = Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'string' && v.length > 0)
      .map(([k, v]) => [k, v as string] as [string, string]);
    return entries.length ? Object.fromEntries(entries) : null;
  }
  if (typeof raw !== 'string') return null;
  const pairs = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.split(':').map(x => x.trim()));
  const out: Record<string, string> = {};
  for (const [k, v] of pairs) {
    if (k && v) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
};

// --- Writes -------------------------------------------------------------------
const createProduct = async (
  vendorId: string,
  input: CreateProductInput,
  autoApprove = false,
) => {
  const category = await CategoryModel.findById(input.category).lean();
  if (!category) throw new AppError(404, 'Category not found');
  if (!category.isActive) throw new AppError(400, 'Category is inactive');

  validateAttributes(category.attributeSchema, input.attributes ?? {});

  if (input.hasVariants) {
    validateVariantOptionKeys(
      category.attributeSchema,
      (input.variantOptions ?? []).map(v => v.key),
    );
  }

  const slug = await generateUniqueSlug(input.name, ProductModel);

  const doc = await ProductModel.create({
    ...input,
    slug,
    vendor: vendorId,
    currency: input.currency ?? config.default_currency,
    status: autoApprove ? 'approved' : 'pending',
  });

  await invalidateProductCache();
  return doc;
};

const updateProduct = async (
  vendorId: string,
  productId: string,
  input: Partial<CreateProductInput>,
  isAdmin = false,
) => {
  const product = await ProductModel.findById(productId);
  if (!product || product.isDeleted) throw new AppError(404, 'Product not found');
  if (!isAdmin && product.vendor.toString() !== vendorId) {
    throw new AppError(403, 'You do not own this product');
  }

  const categoryId = input.category ?? product.category.toString();
  if (input.attributes || input.category || input.variantOptions) {
    const category = await CategoryModel.findById(categoryId).lean();
    if (!category) throw new AppError(404, 'Category not found');
    const mergedAttrs = {
      ...Object.fromEntries(product.attributes as Map<string, unknown>),
      ...(input.attributes ?? {}),
    };
    validateAttributes(category.attributeSchema, mergedAttrs);

    const variantOpts = input.variantOptions ?? product.variantOptions;
    const hasVariants = input.hasVariants ?? product.hasVariants;
    if (hasVariants) {
      validateVariantOptionKeys(
        category.attributeSchema,
        variantOpts.map(v => v.key),
      );
    }
  }

  const update: Partial<IProduct> = { ...(input as Partial<IProduct>) };
  if (input.name && input.name !== product.name) {
    update.slug = await generateUniqueSlug(input.name, ProductModel);
  }
  if (!isAdmin) update.status = 'pending';

  const updated = await ProductModel.findByIdAndUpdate(productId, update, {
    new: true,
    runValidators: true,
  });

  await invalidateProductCache();
  return updated;
};

const deleteProduct = async (vendorId: string, productId: string, isAdmin = false) => {
  const product = await ProductModel.findById(productId);
  if (!product || product.isDeleted) throw new AppError(404, 'Product not found');
  if (!isAdmin && product.vendor.toString() !== vendorId) {
    throw new AppError(403, 'You do not own this product');
  }
  product.isDeleted = true;
  product.status = 'archived';
  await product.save();

  await VariantModel.updateMany({ product: productId }, { isActive: false });
  await invalidateProductCache();
  return product;
};

const changeProductStatus = async (
  id: string,
  status: TProductStatus,
  rejectionReason?: string,
) => {
  const product = await ProductModel.findByIdAndUpdate(
    id,
    { status, ...(rejectionReason ? { rejectionReason } : {}) },
    { new: true, runValidators: true },
  );
  if (!product) throw new AppError(404, 'Product not found');
  await invalidateProductCache();
  return product;
};

// --- Reads --------------------------------------------------------------------

/**
 * Public catalog listing.
 * Supports:
 *  - text search via $text (uses `product_text_search` index)
 *  - attribute filter: `?attrs=color:Black,ram:8GB` (joins Variants)
 *  - standard filters, pagination, sort
 *  - 5-minute cache keyed on the query signature
 */
type ProductListResult = { data: unknown[]; meta: TMeta };

const getAllProducts = async (
  query: Record<string, unknown>,
): Promise<ProductListResult> => {
  const cacheKey = `products:list:${hashParams(query)}`;
  const hit = await cache.get<ProductListResult>(cacheKey);
  if (hit) return hit;

  const attrs = parseAttrsQuery(query.attrs);
  const result: ProductListResult = attrs
    ? await listWithVariantFilter(query, attrs)
    : await listSimple(query);

  await cache.set(cacheKey, result, 300);
  return result;
};

const listSimple = async (
  query: Record<string, unknown>,
): Promise<ProductListResult> => {
  const baseFilter: Record<string, unknown> = { status: 'approved', isDeleted: false };
  const hasSearch = typeof query.searchTerm === 'string' && query.searchTerm.trim().length > 0;

  const builder = new QueryBuilder(ProductModel.find(baseFilter), query);
  if (hasSearch) builder.textSearch();
  builder.filter().sort().fields().paginate();

  const [data, meta] = await Promise.all([
    builder.modelQuery.populate('category', 'name slug').lean(),
    builder.countTotal(),
  ]);
  return { data, meta };
};

/**
 * Aggregation pipeline for attribute-based variant filtering.
 * Finds products that have at least one active variant whose `options` match ALL
 * of the requested attribute key/value pairs.
 */
const listWithVariantFilter = async (
  query: Record<string, unknown>,
  attrs: Record<string, string>,
): Promise<ProductListResult> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 12);
  const skip = (page - 1) * limit;
  const sortField = (query.sort as string) || '-createdAt';
  const sortObj: Record<string, 1 | -1> = sortField.startsWith('-')
    ? { [sortField.slice(1)]: -1 }
    : { [sortField]: 1 };

  const baseMatch: Record<string, unknown> = { status: 'approved', isDeleted: false };

  // Pass-through simple filters (brand, category, etc.)
  const passthrough = ['brand', 'category'];
  for (const k of passthrough) {
    if (typeof query[k] === 'string' && (query[k] as string).length > 0) {
      baseMatch[k] = k === 'category' ? new Types.ObjectId(query[k] as string) : query[k];
    }
  }
  if (query.minPrice || query.maxPrice) {
    const range: Record<string, number> = {};
    if (query.minPrice) range.$gte = Number(query.minPrice);
    if (query.maxPrice) range.$lte = Number(query.maxPrice);
    baseMatch.basePrice = range;
  }

  // Compose per-attribute $eq conditions in Mongo aggregation syntax
  const variantConditions = Object.entries(attrs).map(
    ([k, v]) => ({ $eq: [`$options.${k}`, v] }),
  );

  const commonPipeline: PipelineStage[] = [
    { $match: baseMatch },
    {
      $lookup: {
        from: 'variants',
        let: { productId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$product', '$$productId'] },
                  { $eq: ['$isActive', true] },
                  ...variantConditions,
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: '_matches',
      },
    },
    { $match: { '_matches.0': { $exists: true } } },
  ];

  const dataPipeline: PipelineStage[] = [
    ...commonPipeline,
    { $sort: sortObj },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, slug: 1 } }],
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    { $project: { _matches: 0 } },
  ];

  const countPipeline: PipelineStage[] = [
    ...commonPipeline,
    { $count: 'total' },
  ];

  const [data, countRows] = await Promise.all([
    ProductModel.aggregate(dataPipeline),
    ProductModel.aggregate(countPipeline),
  ]);

  const total = countRows[0]?.total ?? 0;
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const getProductBySlug = async (slug: string) => {
  const cacheKey = `products:slug:${slug}`;
  const hit = await cache.get<unknown>(cacheKey);
  if (hit) return hit;

  const product = await ProductModel.findOne({
    slug,
    status: 'approved',
    isDeleted: false,
  })
    .populate('category', 'name slug attributeSchema')
    .populate('vendor', 'shopName slug logo rating')
    .lean();
  if (!product) throw new AppError(404, 'Product not found');

  const variants = await VariantModel.find({
    product: product._id,
    isActive: true,
  }).lean();

  const result = { ...product, variants };
  await cache.set(cacheKey, result, 300);
  return result;
};

const getProductById = async (id: string) => {
  const product = await ProductModel.findById(id);
  if (!product || product.isDeleted) throw new AppError(404, 'Product not found');
  return product;
};

const getVendorProducts = async (vendorId: string, query: Record<string, unknown>) => {
  const builder = new QueryBuilder(
    ProductModel.find({ vendor: vendorId, isDeleted: false }),
    query,
  )
    .search(['name', 'brand', 'tags'])
    .filter()
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    builder.modelQuery.populate('category', 'name slug').lean(),
    builder.countTotal(),
  ]);
  return { data, meta };
};

export const ProductServices = {
  createProduct,
  updateProduct,
  deleteProduct,
  changeProductStatus,
  getAllProducts,
  getProductBySlug,
  getProductById,
  getVendorProducts,
  invalidateProductCache,
};
