import AppError from '../../Error/AppError';
import { cache } from '../../utility/cache';
import { generateUniqueSlug } from '../../utility/generateSlug';
import { ICategory } from './category.interface';
import { CategoryModel } from './category.model';

const CACHE_ALL_KEY = 'categories:all';
const CACHE_SLUG_PREFIX = 'categories:slug:';
const CACHE_TTL = 3600; // 1 hour — categories change rarely

const invalidateCategoryCache = () => cache.delPattern('categories:*');

const createCategory = async (payload: Partial<ICategory> & { name: string }) => {
  const slug = await generateUniqueSlug(payload.name, CategoryModel);
  const doc = await CategoryModel.create({ ...payload, slug });
  await invalidateCategoryCache();
  return doc;
};

const getAllCategories = async () => {
  const hit = await cache.get<unknown[]>(CACHE_ALL_KEY);
  if (hit) return hit;

  const data = await CategoryModel.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  await cache.set(CACHE_ALL_KEY, data, CACHE_TTL);
  return data;
};

const getFeaturedCategories = async () => {
  const key = 'categories:featured';
  const hit = await cache.get<unknown[]>(key);
  if (hit) return hit;

  const data = await CategoryModel.find({ isActive: true, isFeatured: true })
    .sort({ sortOrder: 1 })
    .lean();
  await cache.set(key, data, CACHE_TTL);
  return data;
};

const getCategoryBySlug = async (slug: string) => {
  const key = `${CACHE_SLUG_PREFIX}${slug}`;
  const hit = await cache.get<unknown>(key);
  if (hit) return hit;

  const doc = await CategoryModel.findOne({ slug }).lean();
  if (!doc) throw new AppError(404, 'Category not found');
  await cache.set(key, doc, CACHE_TTL);
  return doc;
};

const getCategoryById = async (id: string) => {
  const doc = await CategoryModel.findById(id).lean();
  if (!doc) throw new AppError(404, 'Category not found');
  return doc;
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
  const update: Partial<ICategory> = { ...payload };
  if (payload.name) {
    update.slug = await generateUniqueSlug(payload.name, CategoryModel);
  }
  const doc = await CategoryModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!doc) throw new AppError(404, 'Category not found');
  await invalidateCategoryCache();
  return doc;
};

const deleteCategory = async (id: string) => {
  const doc = await CategoryModel.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  );
  if (!doc) throw new AppError(404, 'Category not found');
  await invalidateCategoryCache();
  return doc;
};

export const CategoryServices = {
  createCategory,
  getAllCategories,
  getFeaturedCategories,
  getCategoryBySlug,
  getCategoryById,
  updateCategory,
  deleteCategory,
  invalidateCategoryCache,
};
