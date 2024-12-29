import { ReviewModel } from './review.model';
import { Review } from './review.interface';

// Service to create a new review
const createReviewIntoDB = async (review: Review) => {
  const result = await ReviewModel.create(review);
  return result;
};

// Service to find all reviews with an optional search term
const getAllReviewsFromDB = async (searchTerm: object): Promise<Review[] | null> => {
  const result = await ReviewModel.find(searchTerm);
  return result;
};

// Service to find a single review by ID
const getSingleReviewFromDB = async (_id: string) => {
  const result = await ReviewModel.findOne({ _id });
  return result;
};

// Service to delete a review by ID
const deleteReviewFromDB = async (_id: string) => {
  const result = await ReviewModel.deleteOne({ _id });
  return result;
};

// Service to update an existing review
const updateReviewFromDB = async (_id: string, updateData: Partial<Review>) => {
  try {
    const result = await ReviewModel.findByIdAndUpdate(_id, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validations are applied
    }).exec();
    return result;
  } catch (error) {
    console.error(`Failed to update review with id ${_id}:`, error);
    throw error; // Propagate the error for higher-level handling
  }
};

// Export services for use in controllers or other files
export const ReviewServices = {
  createReviewIntoDB,
  getAllReviewsFromDB,
  getSingleReviewFromDB,
  deleteReviewFromDB,
  updateReviewFromDB,
};
