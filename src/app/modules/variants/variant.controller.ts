import { Request, Response } from 'express';
import { VariantServices } from './variant.service';
import { Variant } from './variant.interface';
import { ZodError } from 'zod';
import { ProductModel } from '../products/product.model';

// Create a new variant
const createVariant = async (req: Request, res: Response) => {
  try {
    const variantData = req.body;

    // Optional: Validate the variant data
    // const parsedVariantData = variantValidationSchema.parse(variantData);

    // Step 1: Create the variant
    const createdVariant = await VariantServices.createVariantIntoDB(variantData);

    // Step 2: Push variant _id into product's variants array
    // await ProductModel.findByIdAndUpdate(
    //   variantData.productId,
    //   { $push: { variants: createdVariant._id } },
    //   { new: true }
    // );
    await ProductModel.findByIdAndUpdate(
      variantData.productId,
      { $push: { variants: variantData } }, // ✅ Push full object here
      { new: true }
    );

    // Send response
    res.status(200).json({
      success: true,
      message: 'Variant created successfully!',
      data: createdVariant,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong!!!',
        err,
      });
    }
  }
};

// Get all variants
const getAllVariants = async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.searchTerm;
    const query: any = {};

    if (searchTerm) {
      query.$or = [
        { sku: { $regex: searchTerm, $options: 'i' } },
        { 'options.color': { $regex: searchTerm, $options: 'i' } },
        { 'options.ram': { $regex: searchTerm, $options: 'i' } },
        { 'options.storage': { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const result = await VariantServices.getAllVariantsFromDB(query);

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: 'Variants not found!' });
    }

    res.status(200).json({
      success: true,
      message: 'Variants fetched successfully!',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong!!!',
      error,
    });
  }
};

// Get a single variant
const getSingleVariant = async (req: Request, res: Response) => {
  try {
    const { variantId } = req.params;
    const result = await VariantServices.getSingleVariantFromDB(variantId);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Variant not found!' });
    }

    res.status(200).json({
      success: true,
      message: 'Variant fetched successfully!',
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Variant not found!',
    });
  }
};

// Delete a single variant
const deleteVariant = async (req: Request, res: Response) => {
  try {
    const { variantId } = req.params;
    const isExist = await VariantServices.getSingleVariantFromDB(variantId);

    if (!isExist) {
      throw new Error('Variant not found!');
    }

    await VariantServices.deleteVariantFromDB(variantId);

    res.status(200).json({
      success: true,
      message: 'Variant deleted successfully!',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Something went wrong!',
    });
  }
};

// Update a single variant
const updateVariant = async (req: Request, res: Response) => {
  try {
    const { variantId } = req.params;
    // const updateData: VariantOptions = req.body;
    const updateData: Partial<Variant> = req.body;

    const result = await VariantServices.updateVariantFromDB(variantId, updateData);

    if (result) {
      res.status(200).json({
        success: true,
        message: 'Variant updated successfully!',
        data: result,
      });
    } else {
      res.status(404).json({ message: 'Variant not found!' });
    }
  } catch (err: any) {
    if (err instanceof ZodError) {
      res.status(400).json({ message: 'Validation error', errors: err.errors });
    } else {
      res.status(500).json({
        message: 'An error occurred while updating the variant!',
        error: err.message,
      });
    }
  }
};

export const VariantControllers = {
  createVariant,
  getAllVariants,
  getSingleVariant,
  deleteVariant,
  updateVariant,
};
