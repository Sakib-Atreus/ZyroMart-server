import { Variant } from './variant.interface';
import { VariantModel } from './variant.model';

// Create a new variant
const createVariantIntoDB = async (variant: Variant) => {
  const result = await VariantModel.create(variant);
  return result;
};

// Get all variants
const getAllVariantsFromDB = async (searchTerm: object): Promise<Variant[]> => {
  const result = await VariantModel.find(searchTerm);
  return result;
};

// Get a single variant
const getSingleVariantFromDB = async (variantId: string) => {
  const result = await VariantModel.findById(variantId);
  return result;
};

// Delete a variant
const deleteVariantFromDB = async (variantId: string) => {
  const result = await VariantModel.deleteOne({ _id: variantId });
  return result;
};

// Update a variant
const updateVariantFromDB = async (variantId: string, updateData: Partial<VariantOptions>) => {
  const result = await VariantModel.findByIdAndUpdate(variantId, updateData, {
    new: true,
    runValidators: true,
  }).exec();
  return result;
};

export const VariantServices = {
  createVariantIntoDB,
  getAllVariantsFromDB,
  getSingleVariantFromDB,
  deleteVariantFromDB,
  updateVariantFromDB,
};
