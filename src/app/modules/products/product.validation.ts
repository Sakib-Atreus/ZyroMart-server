// import { z } from 'zod';

// const variantValidationSchema = z.object({
//   type: z.string({
//     required_error: 'Variant type is required.',
//   }).min(3, { message: 'Variant type must be at least 3 characters.' })
//     .max(20, { message: 'Variant type must be at most 20 characters long.' }),

//   value: z.string({
//     required_error: 'Variant value is required.',
//   }).min(1, { message: 'Variant value must be at least 1 character.' })
//     .max(20, { message: 'Variant value must be at most 20 characters long.' }),

//   price: z.number({
//     required_error: 'Product price is required.',
//   }).min(1, { message: 'Price must be at least 1.' })
//     .max(999999, { message: 'Price must be at most 999999.' }),

//   sku: z.string({
//     required_error: 'Variant SKU is required.',
//   }).min(3, { message: 'SKU must be at least 3 characters long.' })
//     .max(30, { message: 'SKU must be at most 30 characters long.' }),

//   image: z.array(z.string({
//     required_error: 'Variant image is required.',
//   }).url({ message: 'Each image must be a valid URL.' }))
//     .min(1, { message: 'At least one image is required.' }),

//   stock: z.number({
//     required_error: 'Variant stock is required.',
//   }).min(0, { message: 'Variant stock cannot be less than 0.' }),
// });

// const inventoryValidationSchema = z.object({
//   quantity: z.number({
//     required_error: 'Inventory quantity is required.',
//   }).min(0, { message: 'Quantity cannot be less than 0.' })
//     .max(999, { message: 'Quantity cannot be more than 999.' }),

//   inStock: z.boolean({
//     required_error: 'In-stock status is required.',
//   }),
// });

// const productValidationSchema = z.object({
//   name: z.string({
//     required_error: 'Product name is required.',
//   }).min(3, { message: 'Product name must be at least 3 characters.' })
//     .max(100, { message: 'Product name must be at most 100 characters long.' }),

//   description: z.string({
//     required_error: 'Product description is required.',
//   }).min(10, { message: 'Product description must be at least 10 characters.' })
//     .max(500, { message: 'Product description must be at most 500 characters long.' }),

//   // category: z.string({
//   //   required_error: 'Product category is required.',
//   // }).min(3, { message: 'Category must be at least 3 characters long.' })
//   //   .max(20, { message: 'Category must be at most 20 characters long.' }),
  
//   category: z.enum(['Mobile', 'Laptop', 'Headphone', 'Power Bank'], {
//     required_error: 'Product category is required.',
//   }),

//   brand: z.string({
//     required_error: 'Product brand is required.',
//   }).min(2, { message: 'Brand must be at least 2 characters long.' })
//     .max(30, { message: 'Brand must be at most 30 characters long.' }),

//   tags: z.array(z.string({
//     required_error: 'Tag is required.',
//   }).min(2, { message: 'Each tag must be at least 2 characters long.' })
//     .max(20, { message: 'Each tag must be at most 20 characters long.' })),

//   variants: z.array(variantValidationSchema, {
//     required_error: 'At least one variant is required.',
//   }).nonempty({ message: 'At least one variant is required.' }),

//   inventory: inventoryValidationSchema,
// });

// const partialProductValidationSchema = productValidationSchema.partial();

// export { productValidationSchema, partialProductValidationSchema };



import { z } from 'zod';

export const variantValidationSchema = z.object({
  options: z.object({
    color: z.string().optional(),
    ram: z.string().optional(),
    storage: z.string().optional(),
    capacity: z.string().optional(),
    connectivity: z.string().optional(),
  }),
  price: z.number().min(0),
  quantity: z.number().min(0),
  inStock: z.boolean(),
  sku: z.string().min(1),
});

export const productValidationSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  images: z.array(z.string().url()),
  category: z.enum(['phone', 'laptop', 'headphone']),
  brand: z.string().min(1),
  tags: z.array(z.string().min(1)),
  variants: z.array(variantValidationSchema),
});

export const partialProductValidationSchema = productValidationSchema.partial();
