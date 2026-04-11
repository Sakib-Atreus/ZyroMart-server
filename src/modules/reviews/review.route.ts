import express from 'express';
import { ReviewControllers } from './review.controller';

const router = express.Router();

// this all routes call the controllers function to :
// create or post a new review
router.post('/', ReviewControllers.createReview);

// get all reviews
router.get('/', ReviewControllers.getAllReviews);

// get a single review
router.get('/:reviewId', ReviewControllers.getSingleReview);

// delete a single review
router.delete('/:reviewId', ReviewControllers.deleteReview);

// update a single review
router.put('/:reviewId', ReviewControllers.updateReview);

export const ReviewRoute = router;
