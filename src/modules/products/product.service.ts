// import { Product } from './product.interface';
// import { ProductModel } from './product.model';

// // product create service
// const createProductIntoDB = async (product: Product) => {
//   const result = await ProductModel.create(product);
//   return result;
// };

// // this service work for get all product and search by a value
// const getAllProductsFromDB = async (
//   searchTerm: object,
// ): Promise<Product[] | null> => {
//   const result = await ProductModel.find(searchTerm);
//   return result;
// };

// // service for a single product
// const getSingleProductFromDB = async (_id: string) => {
//   const result = await ProductModel.findOne({ _id });
//   return result;
// };

// // this service work when a product delete
// const deleteProductFromDB = async (_id: string) => {
//   const result = await ProductModel.deleteOne({ _id });
//   return result;
// };

// // for update a product, this service work for it
// const updateProductFromDB = async (
//   _id: string,
//   updateData: Partial<Product>,
// ) => {
//   try {
//     const result = await ProductModel.findByIdAndUpdate(_id, updateData, {
//       new: true,
//       runValidators: true,
//     }).exec();
//     return result;
//   } catch (error) {
//     console.error(`Failed to update product with id ${_id}:`, error);
//     throw error;
//   }
// };

// // we can export this main service for using another file or controllers
// export const ProductServices = {
//   createProductIntoDB,
//   getAllProductsFromDB,
//   getSingleProductFromDB,
//   deleteProductFromDB,
//   updateProductFromDB,
// };



import { Product } from './product.interface';
import { ProductModel } from './product.model';
import { VariantModel } from '../variants/variant.model';
import { Variant } from '../variants/variant.interface';

// Create a new product
const createProductIntoDB = async (product: Product) => {
  const result = await ProductModel.create(product);
  return result;
};

// Get all products from the database with optional search filtering
// const getAllProductsFromDB = async (searchTerm: object = {}): Promise<Product[] | null> => {
//   const result = await ProductModel.find(searchTerm).populate('variants');
//   return result;
// };
const getAllProductsFromDB = async (filterQuery : any = {}): Promise<Product[] | null> => {
  const result = await ProductModel.find(filterQuery).populate('variants');
  return result;
};

// Get a single product by its ID
const getSingleProductFromDB = async (_id: string): Promise<Product | null> => {
  const result = await ProductModel.findById(_id).populate('variants');
  return result;
};

// Delete a product by its ID
const deleteProductFromDB = async (_id: string): Promise<any> => {
  // First, delete all variants related to the product
  await VariantModel.deleteMany({ productId: _id });

  // Then, delete the product itself
  const result = await ProductModel.findByIdAndDelete(_id);
  return result;
};

// Update a product by its ID
const updateProductFromDB = async (_id: string, updateData: Partial<Product>) => {
  const result = await ProductModel.findByIdAndUpdate(_id, updateData, {
    new: true,
    runValidators: true,
  }).populate('variants');
  return result;
};

// Add variants to an existing product
const addVariantsToProduct = async (productId: string, variants: Variant[]) => {
  // Find the product by ID
  const product = await ProductModel.findById(productId);

  if (!product) {
    throw new Error('Product not found');
  }

  // Add each variant to the product
  const variantPromises = variants.map((variant) => {
    return VariantModel.create({ ...variant, productId });
  });

  const newVariants = await Promise.all(variantPromises);

  // Optionally, update the product to include the new variants in the product's `variants` field
  product.variants.push(...newVariants);
  await product.save();

  return product;
};

// Update variant details for a specific product
const updateVariantDetails = async (variantId: string, updateData: Partial<Variant>) => {
  const updatedVariant = await VariantModel.findByIdAndUpdate(variantId, updateData, {
    new: true,
    runValidators: true,
  });
  return updatedVariant;
};

// Get variants of a specific product
const getVariantsForProduct = async (productId: string): Promise<Variant[] | null> => {
  const product = await ProductModel.findById(productId).populate('variants');
  return product ? product.variants : null;
};

export const ProductServices = {
  createProductIntoDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  deleteProductFromDB,
  updateProductFromDB,
  addVariantsToProduct,
  updateVariantDetails,
  getVariantsForProduct,
};
