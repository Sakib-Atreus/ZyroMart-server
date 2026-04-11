import { Request } from 'express';

export type FilterParams = {
  brand?: string;
  category?: string;
  ram?: string;
  storage?: string;
  search?: string;
};

// Helper: Get string value or undefined
const getString = (val: unknown): string | undefined => {
  return typeof val === 'string' && val.trim().length >= 2 ? val.trim() : undefined;
};

export const buildFilterQuery = (query: Request['query']): Record<string, any> => {
  const filter: Record<string, any> = {};

  const brand = getString(query.brand);
  const category = getString(query.category);
  const ram = getString(query.ram);
  const storage = getString(query.storage);
  const search = getString(query.search);

  if (brand) {
    filter.brand = { $regex: brand, $options: 'i' };
  }

  if (category) {
    filter.category = { $regex: category, $options: 'i' };
  }

  if (ram) {
    filter['variants.options.ram'] = { $regex: ram, $options: 'i' };
  }

  if (storage) {
    filter['variants.options.storage'] = { $regex: storage, $options: 'i' };
  }

  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex },
    ];
  }

  return filter;
};
