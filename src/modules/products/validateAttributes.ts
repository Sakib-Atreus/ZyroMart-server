import AppError from '../../Error/AppError';
import { IAttributeDef } from '../categories/category.interface';

/**
 * Validate a product's dynamic `attributes` object against its category blueprint.
 *
 * Key rule: attributes marked `isVariantOption: true` have per-variant values
 * (stored on each Variant.options), NOT on the product. They are intentionally
 * absent from the product-level attributes object and are skipped here.
 */
export const validateAttributes = (
  schema: IAttributeDef[],
  attributes: Record<string, unknown>,
): void => {
  const defByKey = new Map(schema.map(d => [d.key, d]));

  // 1. Reject unknown keys and variant-option keys
  for (const key of Object.keys(attributes)) {
    const def = defByKey.get(key);
    if (!def) {
      throw new AppError(400, `Unknown attribute '${key}' for this category`);
    }
    if (def.isVariantOption) {
      throw new AppError(
        400,
        `'${key}' is a variant-option — its value goes on each variant, not in product attributes`,
      );
    }
  }

  // 2. Type-check every non-variant def; enforce required only on non-variant defs
  for (const def of schema) {
    if (def.isVariantOption) continue;

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
 * Ensure every key declared in variantOptions matches an attribute in the
 * category schema that's flagged `isVariantOption: true`.
 */
export const validateVariantOptionKeys = (
  schema: IAttributeDef[],
  variantOptionKeys: string[],
): void => {
  const allowed = new Set(schema.filter(a => a.isVariantOption).map(a => a.key));
  if (allowed.size === 0) {
    throw new AppError(
      400,
      'This category has no variant-capable attributes. Ask an admin to mark at least one attribute (e.g. Color, RAM) as "variant-capable", or disable hasVariants.',
    );
  }
  for (const key of variantOptionKeys) {
    if (!allowed.has(key)) {
      throw new AppError(
        400,
        `'${key}' is not a variant-capable attribute for this category. Variant-capable keys: ${Array.from(allowed).join(', ')}`,
      );
    }
  }
};
