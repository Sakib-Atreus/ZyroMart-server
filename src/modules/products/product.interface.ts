import { Types } from 'mongoose';

export type TProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';

export interface IVariantOptionDeclaration {
  key: string;
  label: string;
  values: string[];
}

export interface IProduct {
  vendor: Types.ObjectId;
  category: Types.ObjectId;

  name: string;
  slug: string;
  brand: string;
  description: string;
  shortDescription?: string;

  images: string[];
  thumbnail: string;

  basePrice: number;
  compareAtPrice?: number;
  currency: string;

  hasVariants: boolean;
  variantOptions: IVariantOptionDeclaration[];

  attributes: Map<string, unknown>;

  tags: string[];
  warranty?: string;

  status: TProductStatus;
  rejectionReason?: string;

  averageRating: number;
  reviewCount: number;
  questionCount: number;
  totalSold: number;

  isDeleted: boolean;
}
