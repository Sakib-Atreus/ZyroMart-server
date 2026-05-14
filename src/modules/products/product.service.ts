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
 * Parse `?attrs=color:Black|Blue,ram:8GB` into `{ color: ['Black','Blue'], ram: ['8GB'] }`.
 * Pipe (`|`) separates multiple values for the same key.
 * Also accepts the same input passed as an already-decoded object.
 */
const parseAttrsQuery = (raw: unknown): Record<string, string[]> | null => {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const entries = Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'string' && (v as string).length > 0)
      .map(([k, v]) => [k, (v as string).split('|').filter(Boolean)] as [string, string[]]);
    return entries.length ? Object.fromEntries(entries) : null;
  }
  if (typeof raw !== 'string') return null;
  const out: Record<string, string[]> = {};
  for (const pair of raw.split(',').map(s => s.trim()).filter(Boolean)) {
    const idx = pair.indexOf(':');
    if (idx < 0) continue;
    const k = pair.slice(0, idx).trim();
    const vals = pair.slice(idx + 1).trim().split('|').filter(Boolean);
    if (k && vals.length) out[k] = vals;
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
 * Resolve a category ID to itself plus all active direct children.
 * Cached for 1 hour (same TTL as the category list endpoint).
 * Returns null when the category has no children (avoids unnecessary $in query).
 */
const resolveChildCategories = async (categoryId: string): Promise<Types.ObjectId[] | null> => {
  const cacheKey = `categories:children:${categoryId}`;
  const hit = await cache.get<string[]>(cacheKey);
  if (hit !== null) {
    return hit.length ? hit.map(id => new Types.ObjectId(id)) : null;
  }
  const children = await CategoryModel.find(
    { parent: new Types.ObjectId(categoryId), isActive: true },
    '_id',
  ).lean();
  const ids = children.map(c => c._id.toString());
  await cache.set(cacheKey, ids, 3600);
  return ids.length ? children.map(c => c._id as Types.ObjectId) : null;
};

/**
 * If `query.category` is a parent with children, expand it to include all child IDs
 * so a click on "Mac" returns MacBook products, "Headphone & Speaker" returns
 * Earbuds + Speaker, etc.
 */
const expandCategoryFilter = async (
  query: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  if (typeof query.category !== 'string' || !query.category) return query;
  const childIds = await resolveChildCategories(query.category);
  if (!childIds) return query;
  return {
    ...query,
    // Store as string array — DB functions convert to ObjectId when needed
    category: [query.category, ...childIds.map(id => id.toString())],
  };
};

/**
 * Public catalog listing.
 * Supports:
 *  - text search via $text (uses `product_text_search` index)
 *  - variant attribute filter: `?attrs=color:Black|Blue,ram:8GB` (joins Variants)
 *  - product-level attribute filter: `?attrFilters=os:Android|iOS,nfc:Yes` (matches product.attributes map)
 *  - category hierarchy: parent category automatically includes child categories
 *  - standard filters, pagination, sort
 *  - 5-minute cache keyed on the resolved query signature
 */
type ProductListResult = { data: unknown[]; meta: TMeta };

const getAllProducts = async (
  query: Record<string, unknown>,
): Promise<ProductListResult> => {
  // Expand parent category → [parent, ...children] before cache lookup so the
  // cache key reflects the actual IDs being queried.
  const resolvedQuery = await expandCategoryFilter(query);

  const cacheKey = `products:list:${hashParams(resolvedQuery)}`;
  const hit = await cache.get<ProductListResult>(cacheKey);
  if (hit) return hit;

  const attrs = parseAttrsQuery(resolvedQuery.attrs);
  const productLevelAttrs = parseAttrsQuery(resolvedQuery.attrFilters);
  const result: ProductListResult = attrs
    ? await listWithVariantFilter(resolvedQuery, attrs, productLevelAttrs)
    : await listSimple(resolvedQuery, productLevelAttrs);

  await cache.set(cacheKey, result, 300);
  return result;
};

/** Apply category filter to baseFilter, supporting both single ID and array ($in). */
const applyCategoryFilter = (
  baseFilter: Record<string, unknown>,
  category: unknown,
): void => {
  if (typeof category === 'string' && category) {
    baseFilter.category = new Types.ObjectId(category);
  } else if (Array.isArray(category) && (category as string[]).length > 0) {
    baseFilter.category = { $in: (category as string[]).map(id => new Types.ObjectId(id)) };
  }
};

const listSimple = async (
  query: Record<string, unknown>,
  productLevelAttrs: Record<string, string[]> | null = null,
): Promise<ProductListResult> => {
  const baseFilter: Record<string, unknown> = { status: 'approved', isDeleted: false };

  // Extract category here so QueryBuilder never sees it (it can't handle $in arrays)
  const { category, ...queryWithoutCategory } = query;
  applyCategoryFilter(baseFilter, category);

  // Product-level attribute filters (e.g. os, nfc, network) applied directly
  if (productLevelAttrs) {
    for (const [k, v] of Object.entries(productLevelAttrs)) {
      baseFilter[`attributes.${k}`] = v.length === 1 ? v[0] : { $in: v };
    }
  }

  const hasSearch = typeof queryWithoutCategory.searchTerm === 'string' && queryWithoutCategory.searchTerm.trim().length > 0;
  const builder = new QueryBuilder(ProductModel.find(baseFilter), queryWithoutCategory);
  if (hasSearch) builder.search(['name', 'brand', 'tags', 'shortDescription']);
  builder.filter().sort().fields().paginate();

  const [data, meta] = await Promise.all([
    builder.modelQuery.populate('category', 'name slug').lean(),
    builder.countTotal(),
  ]);
  return { data, meta };
};

/**
 * Aggregation pipeline for attribute-based filtering.
 * For products WITH variants: finds those that have at least one active variant
 * whose `options` match ALL requested attrs (supports multi-value OR logic per key).
 * For products WITHOUT variants: matches against the product-level `attributes` map.
 */
const listWithVariantFilter = async (
  query: Record<string, unknown>,
  attrs: Record<string, string[]>,
  productLevelAttrs: Record<string, string[]> | null = null,
): Promise<ProductListResult> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 12);
  const skip = (page - 1) * limit;
  const sortField = (query.sort as string) || '-createdAt';
  const sortObj: Record<string, 1 | -1> = sortField.startsWith('-')
    ? { [sortField.slice(1)]: -1 }
    : { [sortField]: 1 };

  const baseMatch: Record<string, unknown> = { status: 'approved', isDeleted: false };

  // Brand pass-through
  if (typeof query.brand === 'string' && query.brand) {
    baseMatch.brand = query.brand;
  }
  // Category: supports both single string ID and array (expanded hierarchy)
  applyCategoryFilter(baseMatch, query.category);
  if (query.minPrice || query.maxPrice) {
    const range: Record<string, number> = {};
    if (query.minPrice) range.$gte = Number(query.minPrice);
    if (query.maxPrice) range.$lte = Number(query.maxPrice);
    baseMatch.basePrice = range;
  }

  // Product-level attribute filters (e.g. os, nfc, network) applied to baseMatch
  // so they filter ALL products regardless of variant status
  if (productLevelAttrs) {
    for (const [k, v] of Object.entries(productLevelAttrs)) {
      baseMatch[`attributes.${k}`] = v.length === 1 ? v[0] : { $in: v };
    }
  }

  // Variant conditions: each attr uses $eq (single value) or $in (multiple values)
  const variantConditions = Object.entries(attrs).map(([k, v]) =>
    v.length === 1
      ? { $eq: [`$options.${k}`, v[0]] }
      : { $in: [`$options.${k}`, v] },
  );

  // Product-level attribute conditions (for non-variant products)
  const productAttrMatch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(attrs)) {
    productAttrMatch[`attributes.${k}`] = v.length === 1 ? v[0] : { $in: v };
  }

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
    // Products with a matching variant OR any product whose product.attributes match
    // (handles attrs that are in the schema as isVariantOption but not used as variant
    //  dimensions by specific products — e.g. RAM stored as a product attr on phones)
    {
      $match: {
        $or: [
          { '_matches.0': { $exists: true } },
          productAttrMatch,
        ],
      },
    },
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

/** Safely convert a Mongoose Map (or already-plain object) to a plain Record. */
const mapToObj = (val: unknown): Record<string, unknown> => {
  if (!val) return {};
  if (val instanceof Map) return Object.fromEntries(val);
  if (typeof val === 'object') return val as Record<string, unknown>;
  return {};
};

const getProductBySlug = async (slug: string) => {
  const cacheKey = `products:slug:${slug}`;
  const hit = await cache.get<unknown>(cacheKey);
  if (hit) return hit;

  // Single aggregation — product + variants + category + vendor in one DB round trip
  const rows = await ProductModel.aggregate([
    { $match: { slug, status: 'approved', isDeleted: false } },
    {
      $lookup: {
        from: 'variants',
        let: { pid: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$product', '$$pid'] }, { $eq: ['$isActive', true] }] } } },
        ],
        as: 'variants',
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, slug: 1, attributeSchema: 1 } }],
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'vendors',
        localField: 'vendor',
        foreignField: '_id',
        pipeline: [{ $project: { shopName: 1, slug: 1, logo: 1, rating: 1 } }],
        as: 'vendor',
      },
    },
    { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
    { $limit: 1 },
  ]);

  if (!rows.length) throw new AppError(404, 'Product not found');

  const raw = rows[0];
  const result = {
    ...raw,
    attributes: mapToObj(raw.attributes),
    variants: (raw.variants ?? []).map((v: Record<string, unknown>) => ({
      ...v,
      options: mapToObj(v.options),
    })),
  };
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

const getNewArrivals = async (limit = 12) => {
  const cacheKey = `products:new-arrivals:${limit}`;
  const hit = await cache.get<unknown[]>(cacheKey);
  if (hit) return hit;

  const data = await ProductModel.find({ status: 'approved', isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category', 'name slug')
    .select('name slug brand thumbnail basePrice compareAtPrice currency averageRating reviewCount createdAt isOnlineExclusive')
    .lean();

  await cache.set(cacheKey, data, 300);
  return data;
};

const getTopSelling = async (limit = 12) => {
  const cacheKey = `products:top-selling:${limit}`;
  const hit = await cache.get<unknown[]>(cacheKey);
  if (hit) return hit;

  const data = await ProductModel.find({ status: 'approved', isDeleted: false })
    .sort({ totalSold: -1 })
    .limit(limit)
    .populate('category', 'name slug')
    .select('name slug brand thumbnail basePrice compareAtPrice currency averageRating reviewCount totalSold isOnlineExclusive')
    .lean();

  await cache.set(cacheKey, data, 300);
  return data;
};

const getOnlineExclusive = async (limit = 12) => {
  const cacheKey = `products:online-exclusive:${limit}`;
  const hit = await cache.get<unknown[]>(cacheKey);
  if (hit) return hit;

  const data = await ProductModel.find({
    status: 'approved',
    isDeleted: false,
    isOnlineExclusive: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category', 'name slug')
    .select('name slug brand thumbnail basePrice compareAtPrice currency averageRating reviewCount isOnlineExclusive')
    .lean();

  await cache.set(cacheKey, data, 300);
  return data;
};

const getSimilarProducts = async (productId: string, limit = 8) => {
  const cacheKey = `products:similar:${productId}:${limit}`;
  const hit = await cache.get<unknown[]>(cacheKey);
  if (hit) return hit;

  const product = await ProductModel.findById(productId).lean();
  if (!product || product.isDeleted) throw new AppError(404, 'Product not found');

  const data = await ProductModel.find({
    _id: { $ne: product._id },
    status: 'approved',
    isDeleted: false,
    $or: [
      { category: product.category },
      { tags: { $in: (product.tags ?? []) } },
      { brand: product.brand },
    ],
  })
    .sort({ averageRating: -1, totalSold: -1 })
    .limit(limit)
    .select('name slug brand thumbnail basePrice compareAtPrice currency averageRating reviewCount')
    .lean();

  await cache.set(cacheKey, data, 300);
  return data;
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
  getNewArrivals,
  getTopSelling,
  getOnlineExclusive,
  getSimilarProducts,
  invalidateProductCache,
};
