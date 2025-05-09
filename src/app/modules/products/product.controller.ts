// import { Request, Response } from 'express';
// import { ProductServices } from './product.service';
// import {
//   productValidationSchema,
//   partialProductValidationSchema,
// } from './product.validation';
// import { ZodError } from 'zod';

// // this is controller for creating a product
// const createProduct = async (req: Request, res: Response) => {
//   try {
//     const productData = req.body;
//     const parsedProductData = productValidationSchema.parse(productData);

//     // for send this data we can call service function
//     const result = await ProductServices.createProductIntoDB(parsedProductData);

//     // for send response
//     res.status(200).json({
//       success: true,
//       message: 'Product created successfully!',
//       data: result,
//     });
//   } catch (err: any) {
//     res.status(500).json({
//       success: false,
//       message: err.message || 'Something went wrong!!!',
//       err,
//     });
//   }
// };

// // use catchAsync and sendResponse
// /*
// const createProduct = catchAsync(async (req: Request, res: Response) => {
//   const productData = req.body;
//   const parsedProductData = productValidationSchema.parse(productData);

//   // Call service function to create the product
//   const result = await ProductServices.createProductIntoDB(parsedProductData);

//   // Send response using sendResponse utility
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Product created successfully!',
//     data: result,
//   });
// });

// export default createProduct;

// */

// // this control handle to get all products
// const getAllProducts = async (req: Request, res: Response) => {
//   try {
//     const searchTerm = req.query.searchTerm;
//     const query: any = {};

//     // If the search term is provided, create a query to search for products
//     // based on their name, category, and description
//     if (searchTerm) {
//       query.$or = [
//         { name: { $regex: searchTerm, $options: 'i' } },
//         { description: { $regex: searchTerm, $options: 'i' } },
//         { category: { $regex: searchTerm, $options: 'i' } },
//         { 'variants.type': { $regex: searchTerm, $options: 'i' } },
//         { 'variants.value': { $regex: searchTerm, $options: 'i' } },
//       ];
//     }

//     // Fetch all products from the database
//     const result = await ProductServices.getAllProductsFromDB(query);

//     // If no products are found, return a 404 status error
//     if (!result || result.length === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: 'Product not found!' });
//     }

//     // If no search term is provided, return all products
//     if (!searchTerm) {
//       res.status(200).json({
//         success: true,
//         message: 'Products fetched successfully!',
//         data: result,
//       });
//     } else {
//       // Otherwise, return the products matching the search term
//       res.status(200).json({
//         success: true,
//         message: `Products matching search term '${searchTerm}' fetched successfully!`,
//         data: result,
//       });
//     }
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Something went wrong!!!',
//       error,
//     });
//   }
// };

// // for get a single product, this control handle this
// const getSingleProduct = async (req: Request, res: Response) => {
//   try {
//     const { productId } = req.params;
//     const result = await ProductServices.getSingleProductFromDB(productId);

//     if (!result) {
//       // If the product is not found, return a 404 status code
//       return res
//         .status(404)
//         .json({ success: false, message: 'Product not found!' });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Product fetched successfully!',
//       data: result,
//     });
//   } catch (err: any) {
//     // If an error occurs, return a 500 status code
//     res.status(500).json({
//       success: false,
//       message: 'Product not found!',
//     });
//   }
// };

// // for delete a single product, this control work for it
// const deleteProduct = async (req: Request, res: Response) => {
//   try {
//     const { productId } = req.params;

//     // find the product based on id
//     const isExist = await ProductServices.getSingleProductFromDB(productId);

//     // if product is not found, throw an error
//     if (!isExist) {
//       throw new Error('Product is not found!');
//     }

//     await ProductServices.deleteProductFromDB(productId);

//     // if product find by id, send a response
//     res.status(200).json({
//       success: true,
//       message: 'Product deleted successfully!',
//       data: null,
//     });
//   } catch (err: any) {
//     res.status(500).json({
//       success: false,
//       message: 'Product not found!',
//     });
//   }
// };

// // for update the product, this control work for it
// const updateProduct = async (req: Request, res: Response) => {
//   try {
//     const { productId } = req.params;
//     const updateData = req.body;

//     // validate product data
//     const parsedProductData = partialProductValidationSchema.parse(updateData);

//     const result = await ProductServices.updateProductFromDB(
//       productId,
//       parsedProductData,
//     );

//     if (result) {
//       res
//         .status(200)
//         .json({ success: true, message: 'Product updated successfully!', product: result });
//     } else {
//       res.status(404).json({ message: 'Product not found!' });
//     }
//   } catch (err: any) {
//     if (err instanceof ZodError) {
//       // Handle validation errors
//       res.status(400).json({ message: 'Validation error', errors: err.errors });
//     } else {
//       res.status(500).json({
//         message: 'An error occurred while updating the product!',
//         error: err.message,
//       });
//     }
//   }
// };

// // we can export this main product controllers for using another file
// export const ProductControllers = {
//   createProduct,
//   getAllProducts,
//   getSingleProduct,
//   deleteProduct,
//   updateProduct,
// };


import { Request, Response } from 'express';
import { ProductServices } from './product.service';
import { ZodError } from 'zod';

const createProduct = async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    // const parsedProductData = productValidationSchema.parse(productData);

    const result = await ProductServices.createProductIntoDB(productData);

    res.status(200).json({
      success: true,
      message: 'Product created successfully!',
      data: result,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      res.status(400).json({ message: 'Validation error', errors: err.errors });
    } else {
      res.status(500).json({ success: false, message: err.message || 'Something went wrong!!!', err });
    }
  }
};

const getAllProducts = async (req: Request, res: Response) => {
  try {
    const filterQuery = req.filterQuery;
    const result = await ProductServices.getAllProductsFromDB(filterQuery);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Something went wrong!!!' });
  }
};

const getSingleProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const result = await ProductServices.getSingleProductFromDB(productId);
    if (!result) return res.status(404).json({ message: 'Product not found!' });
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Product not found!' });
  }
};

const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const isExist = await ProductServices.getSingleProductFromDB(productId);
    if (!isExist) throw new Error('Product not found!');
    await ProductServices.deleteProductFromDB(productId);
    res.status(200).json({ success: true, message: 'Product deleted successfully!' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Product not found!' });
  }
};

const updateProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;
    // const parsedProductData = partialProductValidationSchema.parse(updateData);

    const result = await ProductServices.updateProductFromDB(productId, updateData);
    if (result) {
      res.status(200).json({ success: true, message: 'Product updated successfully!', product: result });
    } else {
      res.status(404).json({ message: 'Product not found!' });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'An error occurred!', error: err.message });
  }
};

export const ProductControllers = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  deleteProduct,
  updateProduct,
};
