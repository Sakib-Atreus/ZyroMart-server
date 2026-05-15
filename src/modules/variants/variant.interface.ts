import { Types } from 'mongoose';

export interface IVariant {
  product: Types.ObjectId;
  sku: string;
  options: Map<string, string>;
  optionsHash: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  reservedStock: number;
  images?: string[];
  isActive: boolean;
  weight?: number;
  dimensions?: { l: number; w: number; h: number };
}
