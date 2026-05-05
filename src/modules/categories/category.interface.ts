import { Types } from 'mongoose';

export type TAttributeType = 'string' | 'number' | 'boolean' | 'enum' | 'multiselect';

export interface IAttributeDef {
  key: string;
  label: string;
  group: string;
  type: TAttributeType;
  unit?: string;
  options?: string[];
  required?: boolean;
  isVariantOption?: boolean;
  filterable?: boolean;
  searchable?: boolean;
}

export interface ICategory {
  name: string;
  slug: string;
  parent?: Types.ObjectId | null;
  icon?: string;
  attributeSchema: IAttributeDef[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}
