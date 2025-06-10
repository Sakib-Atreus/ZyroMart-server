// import { CategoryType } from "../../constants";
// import { Variant } from "../variants/variant.interface";

// // export type Variant = {
// //   type: string; // "Color", "RAM", "Storage"
// //   value: string; // "Black", "6GB", "128GB"
// //   price: number;
// //   sku: string;
// //   image: string[];
// //   inStock: boolean;
// //   quantity: number;
// // };

// // export type Inventory = {
// //   quantity: number;
// //   inStock: boolean;
// // };

// export type Product = {
//   name: string;
//   description: string;
//   images: string[];
//   category: CategoryType;
//   brand: string;
//   tags: string[];
//   variants: Variant[];
//   // inventory: Inventory;
// };

import { CategoryType } from "../../constants";
import { Variant } from "../variants/variant.interface";

// Product interface, using the Variant interface
export type Product = {
  name: string;
  description: string;
  images: string[];
  category: CategoryType;
  brand: string;
  tags: string[];
  variants: Variant[];
};
