import { Model } from 'mongoose';

export const slugify = (text: string): string =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const generateUniqueSlug = async (
  text: string,
  model: Model<any>,
  field = 'slug',
): Promise<string> => {
  const base = slugify(text);
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await model.exists({ [field]: slug })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
};
