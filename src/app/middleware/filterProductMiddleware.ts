import { Request, Response, NextFunction } from 'express';
import { buildFilterQuery } from '../utility/productFilter';

// Middleware to handle search and filter query parameters
export const filterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Build the filter query based on the request's query parameters
    const filterQuery = buildFilterQuery(req.query);

    // Attach the filter query to the request object so it can be used later
    req.filterQuery = filterQuery;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing filter query' });
  }
};
