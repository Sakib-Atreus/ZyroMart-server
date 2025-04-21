import { Types } from "mongoose";

export type VariantOptions = {
    color?: string;
    ram?: string;
    storage?: string;
    capacity?: string;
    connectivity?: string;
};

export type Variant = {
    productId: Types.ObjectId; // Reference to Product
    variantOptions: VariantOptions;
    price: number;
    quantity: number;
    inStock: boolean;
    sku: string;
};
