import AppError from '../../Error/AppError';
import QueryBuilder from '../../utility/QueryBuilder';
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

const createProduct = async (vendorId: string, input: CreateProductInput) => {
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
    status: 'pending',
  });
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

  // If attributes or category changed, re-validate against blueprint
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
  // Edits by vendor require re-approval
  if (!isAdmin) update.status = 'pending';

  const updated = await ProductModel.findByIdAndUpdate(productId, update, {
    new: true,
    runValidators: true,
  });
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

  // soft-disable all variants
  await VariantModel.updateMany({ product: productId }, { isActive: false });
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
  return product;
};

const getAllProducts = async (query: Record<string, unknown>) => {
  const baseFilter = { status: 'approved', isDeleted: false };
  const builder = new QueryBuilder(ProductModel.find(baseFilter), query)
    .search(['name', 'brand', 'description', 'tags'])
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

const getProductBySlug = async (slug: string) => {
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

  return { ...product, variants };
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
};
