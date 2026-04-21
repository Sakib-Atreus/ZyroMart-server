import AppError from '../../Error/AppError';
import { generateUniqueSlug } from '../../utility/generateSlug';
import { ICategory } from './category.interface';
import { CategoryModel } from './category.model';

const createCategory = async (payload: Partial<ICategory> & { name: string }) => {
  const slug = await generateUniqueSlug(payload.name, CategoryModel);
  const doc = await CategoryModel.create({ ...payload, slug });
  return doc;
};

const getAllCategories = async () => {
  return CategoryModel.find({ isActive: true }).sort({ name: 1 }).lean();
};

const getCategoryBySlug = async (slug: string) => {
  const doc = await CategoryModel.findOne({ slug }).lean();
  if (!doc) throw new AppError(404, 'Category not found');
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
  return doc;
};

const deleteCategory = async (id: string) => {
  const doc = await CategoryModel.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  );
  if (!doc) throw new AppError(404, 'Category not found');
  return doc;
};

export const CategoryServices = {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
