import { CategoryType } from "../../constants";

export type Variant = {
  type: string; // "Color", "RAM", "Storage"
  value: string; // "Black", "6GB", "128GB"
  price: number;
  sku: string;
  image: string[];
  stock: number;
};

export type Inventory = {
  quantity: number;
  inStock: boolean;
};

export type Product = {
  name: string;
  description: string;
  category: CategoryType;
  brand: string;
  tags: string[];
  variants: Variant[];
  inventory: Inventory;
};
