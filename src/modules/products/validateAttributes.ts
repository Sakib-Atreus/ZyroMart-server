import AppError from '../../Error/AppError';
import { IAttributeDef } from '../categories/category.interface';

/**
 * Validate a product's dynamic `attributes` object against the owning
 * category's `attributeSchema` blueprint.
 * Throws AppError on any mismatch (unknown key, wrong type, missing required, invalid enum).
 */
export const validateAttributes = (
  schema: IAttributeDef[],
  attributes: Record<string, unknown>,
): void => {
  const defByKey = new Map(schema.map(d => [d.key, d]));

  // 1. Reject unknown keys
  for (const key of Object.keys(attributes)) {
    if (!defByKey.has(key)) {
      throw new AppError(400, `Unknown attribute '${key}' for this category`);
    }
  }

  // 2. Check each defined attribute
  for (const def of schema) {
    const value = attributes[def.key];

    if (value === undefined || value === null) {
      if (def.required) {
        throw new AppError(400, `Attribute '${def.key}' is required`);
      }
      continue;
    }

    switch (def.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new AppError(400, `Attribute '${def.key}' must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number' || Number.isNaN(value)) {
          throw new AppError(400, `Attribute '${def.key}' must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new AppError(400, `Attribute '${def.key}' must be a boolean`);
        }
        break;
      case 'enum':
        if (typeof value !== 'string' || !def.options?.includes(value)) {
          throw new AppError(
            400,
            `Attribute '${def.key}' must be one of: ${def.options?.join(', ')}`,
          );
        }
        break;
      case 'multiselect':
        if (
          !Array.isArray(value) ||
          !value.every(v => typeof v === 'string' && def.options?.includes(v))
        ) {
          throw new AppError(
            400,
            `Attribute '${def.key}' must be a subset of: ${def.options?.join(', ')}`,
          );
        }
        break;
    }
  }
};

/**
 * Ensure all variantOption keys declared on the product are attributes
 * marked `isVariantOption: true` in the category blueprint.
 */
export const validateVariantOptionKeys = (
  schema: IAttributeDef[],
  variantOptionKeys: string[],
): void => {
  const allowed = new Set(
    schema.filter(a => a.isVariantOption).map(a => a.key),
  );
  for (const key of variantOptionKeys) {
    if (!allowed.has(key)) {
      throw new AppError(
        400,
        `'${key}' is not a variant-capable attribute for this category`,
      );
    }
  }
};
