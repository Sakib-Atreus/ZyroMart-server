/* eslint-disable @typescript-eslint/no-explicit-any */
import { FilterQuery, Query } from 'mongoose';

/**
 * Reusable query builder for list endpoints.
 * Supports: search (text-like OR), filtering, sorting, pagination, field selection.
 */
class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const term = this.query.searchTerm as string | undefined;
    if (term && term.trim()) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          field => ({ [field]: { $regex: term, $options: 'i' } } as FilterQuery<T>),
        ),
      });
    }
    return this;
  }

  filter() {
    const exclude = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
    const filters: Record<string, any> = { ...this.query };
    exclude.forEach(k => delete filters[k]);

    // support price range: minPrice / maxPrice
    if (filters.minPrice || filters.maxPrice) {
      filters.basePrice = {};
      if (filters.minPrice) filters.basePrice.$gte = Number(filters.minPrice);
      if (filters.maxPrice) filters.basePrice.$lte = Number(filters.maxPrice);
      delete filters.minPrice;
      delete filters.maxPrice;
    }

    this.modelQuery = this.modelQuery.find(filters as FilterQuery<T>);
    return this;
  }

  sort() {
    const sort = (this.query.sort as string) || '-createdAt';
    this.modelQuery = this.modelQuery.sort(sort);
    return this;
  }

  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Math.min(Number(this.query.limit) || 12, 100);
    const skip = (page - 1) * limit;
    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  fields() {
    const fields = (this.query.fields as string | undefined)?.split(',').join(' ') || '-__v';
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  async countTotal() {
    const totalQuery = this.modelQuery.model.find(this.modelQuery.getFilter());
    const total = await totalQuery.countDocuments();
    const page = Number(this.query.page) || 1;
    const limit = Math.min(Number(this.query.limit) || 12, 100);
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export default QueryBuilder;
