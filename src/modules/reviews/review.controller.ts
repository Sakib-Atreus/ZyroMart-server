import { Request, Response } from 'express';
import { ReviewServices } from './review.service';
import {
  reviewValidationSchema,
  partialReviewValidationSchema,
} from './review.validation';
import { ZodError } from 'zod';

// Create a new review
const createReview = async (req: Request, res: Response) => {
  try {
    const reviewData = req.body;
    const parsedReviewData = reviewValidationSchema.parse(reviewData);

    const result = await ReviewServices.createReviewIntoDB(parsedReviewData);

    res.status(201).json({
      success: true,
      message: 'Review created successfully!',
      data: result,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error!',
        errors: err.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong!',
        error: err,
      });
    }
  }
};

// Get all reviews
const getAllReviews = async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.searchTerm;
    const query: any = {};

    if (searchTerm) {
      query.$or = [
        { comment: { $regex: searchTerm, $options: 'i' } },
        { userId: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const result = await ReviewServices.getAllReviewsFromDB(query);

    res.status(200).json({
      success: true,
      message: searchTerm
        ? `Reviews matching search term '${searchTerm}' fetched successfully!`
        : 'All reviews fetched successfully!',
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews!',
      error: err.message,
    });
  }
};

// Get a single review
const getSingleReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    const result = await ReviewServices.getSingleReviewFromDB(reviewId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Review not found!',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review fetched successfully!',
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch the review!',
      error: err.message,
    });
  }
};

// Delete a review
const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    const isExist = await ReviewServices.getSingleReviewFromDB(reviewId);

    if (!isExist) {
      return res.status(404).json({
        success: false,
        message: 'Review not found!',
      });
    }

    await ReviewServices.deleteReviewFromDB(reviewId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully!',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete the review!',
      error: err.message,
    });
  }
};

// Update a review
const updateReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const updateData = req.body;

    const parsedReviewData = partialReviewValidationSchema.parse(updateData);

    const result = await ReviewServices.updateReviewFromDB(
      reviewId,
      parsedReviewData
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Review not found!',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review updated successfully!',
      data: result,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error!',
        errors: err.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update the review!',
        error: err.message,
      });
    }
  }
};

// Export ReviewControllers
export const ReviewControllers = {
  createReview,
  getAllReviews,
  getSingleReview,
  deleteReview,
  updateReview,
};
