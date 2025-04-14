export type Variant = {
  type: string;
  value: string;
  price: number;
  sku: string;
  image: string;
  stock: number;
};

export type Inventory = {
  quantity: number;
  inStock: boolean;
};

export type Product = {
  name: string;
  description: string;
  category: string;
  tags: string[];
  variants: Variant[];
  inventory: Inventory;
};
