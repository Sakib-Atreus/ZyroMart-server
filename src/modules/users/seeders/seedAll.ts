/**
 * Full seed: users, vendors, categories (with attribute schemas + isFeatured/sortOrder),
 * products (matching new category structure), variants, sample order.
 * Run: npm run seed
 */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../../../config';
import User from '../user.model';
import { VendorModel } from '../../vendors/vendor.model';
import { CategoryModel } from '../../categories/category.model';
import { ProductModel } from '../../products/product.model';
import { VariantModel } from '../../variants/variant.model';
import { OrderModel } from '../../orders/order.model';
import { generateOrderNumber } from '../../../utility/generateOrderNumber';

const hash = (p: string) => bcrypt.hash(p, 10);

const cartesian = (opts: { key: string; values: string[] }[]) =>
  opts.reduce<Record<string, string>[]>(
    (acc, opt) => acc.flatMap(c => opt.values.map(v => ({ ...c, [opt.key]: v }))),
    [{}],
  );

const mkSku = (prefix: string, combo: Record<string, string>) =>
  `${prefix}-${Object.values(combo).map(v => v.replace(/\s+/g, '').toUpperCase().slice(0, 4)).join('-')}`;

const upsertVariants = async (
  productId: mongoose.Types.ObjectId,
  sku: string,
  variantOptions: { key: string; values: string[] }[],
  basePrice: number,
  priceOverrides: Record<string, number> = {},
  baseStock = 30,
) => {
  const combos = cartesian(variantOptions);
  const ops = combos.map(combo => {
    const skuFull = mkSku(sku, combo);
    const price = priceOverrides[Object.values(combo).join('+')] ?? basePrice;
    return {
      updateOne: {
        filter: { product: productId, sku: skuFull },
        update: {
          product: productId,
          sku: skuFull,
          options: new Map(Object.entries(combo)),
          optionsHash: Object.entries(combo).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|'),
          price,
          compareAtPrice: Math.round(price * 1.15),
          stock: baseStock,
          reservedStock: 0,
          isActive: true,
        },
        upsert: true,
      },
    };
  });
  if (ops.length) await VariantModel.bulkWrite(ops);
};

// ─── Shared Attribute Schemas ──────────────────────────────────────────────
const PHONE_ATTRS = [
  { key: 'os', label: 'Operating System', group: 'General', type: 'enum' as const, options: ['Android', 'iOS', 'HarmonyOS'], required: true, filterable: true },
  { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Blue', 'Red', 'Gold', 'Green', 'Purple', 'Silver', 'Titanium', 'Lavender', 'Natural'], isVariantOption: true, filterable: true },
  { key: 'storage', label: 'Internal Storage', group: 'Performance', type: 'enum' as const, options: ['64GB', '128GB', '256GB', '512GB', '1TB'], isVariantOption: true, filterable: true },
  { key: 'ram', label: 'RAM', group: 'Performance', type: 'enum' as const, options: ['4GB', '6GB', '8GB', '12GB', '16GB'], isVariantOption: true, filterable: true },
  { key: 'processor', label: 'Processor', group: 'Performance', type: 'string' as const },
  { key: 'display', label: 'Display', group: 'Display', type: 'string' as const },
  { key: 'displaySize', label: 'Display Size', group: 'Display', type: 'string' as const, unit: 'inches' },
  { key: 'displayResolution', label: 'Resolution', group: 'Display', type: 'string' as const },
  { key: 'refreshRate', label: 'Refresh Rate', group: 'Display', type: 'string' as const, unit: 'Hz' },
  { key: 'rearCamera', label: 'Rear Camera', group: 'Camera', type: 'string' as const },
  { key: 'frontCamera', label: 'Front Camera', group: 'Camera', type: 'string' as const },
  { key: 'battery', label: 'Battery Capacity', group: 'Battery', type: 'string' as const, unit: 'mAh' },
  { key: 'charging', label: 'Fast Charging', group: 'Battery', type: 'string' as const },
  { key: 'sim', label: 'SIM', group: 'Connectivity', type: 'string' as const },
  { key: 'network', label: 'Network', group: 'Connectivity', type: 'string' as const },
  { key: 'bluetooth', label: 'Bluetooth', group: 'Connectivity', type: 'string' as const },
  { key: 'wifi', label: 'Wi-Fi', group: 'Connectivity', type: 'string' as const },
  { key: 'nfc', label: 'NFC', group: 'Connectivity', type: 'enum' as const, options: ['Yes', 'No'] },
  { key: 'weight', label: 'Weight', group: 'Design', type: 'string' as const, unit: 'g' },
  { key: 'dimensions', label: 'Dimensions', group: 'Design', type: 'string' as const },
  { key: 'material', label: 'Body Material', group: 'Design', type: 'string' as const },
];

const MAC_ATTRS = [
  { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Space Black', 'Silver', 'Space Gray', 'Gold', 'Midnight', 'Starlight'], isVariantOption: true, filterable: true },
  { key: 'ram', label: 'Unified Memory', group: 'Performance', type: 'enum' as const, options: ['8GB', '16GB', '24GB', '36GB', '48GB'], isVariantOption: true, filterable: true },
  { key: 'storage', label: 'Storage', group: 'Performance', type: 'enum' as const, options: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD', '4TB SSD'], isVariantOption: true, filterable: true },
  { key: 'processor', label: 'Chip', group: 'Performance', type: 'string' as const },
  { key: 'gpu', label: 'GPU Cores', group: 'Performance', type: 'string' as const },
  { key: 'display', label: 'Display', group: 'Display', type: 'string' as const },
  { key: 'displaySize', label: 'Display Size', group: 'Display', type: 'string' as const, unit: 'inches' },
  { key: 'displayResolution', label: 'Resolution', group: 'Display', type: 'string' as const },
  { key: 'os', label: 'Operating System', group: 'General', type: 'string' as const },
  { key: 'battery', label: 'Battery', group: 'Battery', type: 'string' as const },
  { key: 'weight', label: 'Weight', group: 'Design', type: 'string' as const, unit: 'kg' },
  { key: 'ports', label: 'Ports', group: 'Connectivity', type: 'string' as const },
  { key: 'wifi', label: 'Wi-Fi', group: 'Connectivity', type: 'string' as const },
  { key: 'bluetooth', label: 'Bluetooth', group: 'Connectivity', type: 'string' as const },
];

const TABLET_ATTRS = [
  { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'Silver', 'Gold', 'Space Gray', 'Blue', 'Purple', 'Starlight'], isVariantOption: true, filterable: true },
  { key: 'storage', label: 'Storage', group: 'Performance', type: 'enum' as const, options: ['64GB', '128GB', '256GB', '512GB', '1TB'], isVariantOption: true, filterable: true },
  { key: 'connectivity', label: 'Connectivity', group: 'General', type: 'enum' as const, options: ['Wi-Fi', 'Wi-Fi + Cellular'], isVariantOption: true, filterable: true },
  { key: 'display', label: 'Display', group: 'Display', type: 'string' as const },
  { key: 'displaySize', label: 'Display Size', group: 'Display', type: 'string' as const, unit: 'inches' },
  { key: 'processor', label: 'Processor', group: 'Performance', type: 'string' as const },
  { key: 'ram', label: 'RAM', group: 'Performance', type: 'string' as const },
  { key: 'battery', label: 'Battery', group: 'Battery', type: 'string' as const, unit: 'mAh' },
  { key: 'os', label: 'OS', group: 'General', type: 'string' as const },
];

const AUDIO_ATTRS = [
  { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Beige', 'Silver', 'Midnight', 'Starlight'], isVariantOption: true, filterable: true },
  { key: 'type', label: 'Type', group: 'General', type: 'enum' as const, options: ['In-Ear', 'Over-Ear', 'On-Ear', 'Neckband'] },
  { key: 'anc', label: 'Active Noise Cancellation', group: 'Features', type: 'enum' as const, options: ['Yes', 'No'] },
  { key: 'connectivity', label: 'Connectivity', group: 'Connectivity', type: 'enum' as const, options: ['Bluetooth 5.0', 'Bluetooth 5.3', 'Bluetooth 5.4', 'Wired'] },
  { key: 'battery', label: 'Battery Life', group: 'Battery', type: 'string' as const },
  { key: 'driver', label: 'Driver Size', group: 'Audio', type: 'string' as const, unit: 'mm' },
  { key: 'waterproof', label: 'Water Resistance', group: 'Features', type: 'enum' as const, options: ['IPX4', 'IPX5', 'IP54', 'IP67', 'None'] },
];

const WATCH_ATTRS = [
  { key: 'color', label: 'Case Color', group: 'Design', type: 'enum' as const, options: ['Black', 'Silver', 'Gold', 'Titanium', 'Pink', 'Green', 'Blue'], isVariantOption: true, filterable: true },
  { key: 'size', label: 'Case Size', group: 'Design', type: 'enum' as const, options: ['41mm', '45mm', '46mm', '40mm', '44mm'], isVariantOption: true, filterable: true },
  { key: 'os', label: 'Platform', group: 'General', type: 'enum' as const, options: ['watchOS', 'Wear OS', 'Tizen', 'RTOS'] },
  { key: 'display', label: 'Display', group: 'Display', type: 'string' as const },
  { key: 'battery', label: 'Battery Life', group: 'Battery', type: 'string' as const },
  { key: 'waterproof', label: 'Water Resistance', group: 'Features', type: 'string' as const },
  { key: 'gps', label: 'GPS', group: 'Features', type: 'enum' as const, options: ['Yes', 'No'] },
  { key: 'compatibility', label: 'Compatibility', group: 'General', type: 'string' as const },
];

export const seed = async () => {
  await mongoose.connect(config.db_url as string);
  console.log('Connected to DB. Seeding…');

  // ─── Users ─────────────────────────────────────────────────────────────────
  const [adminUser, vendorUser1, vendorUser2, user1] = await Promise.all([
    User.findOneAndUpdate(
      { email: 'admin@zyromart.com' },
      { name: 'Admin', email: 'admin@zyromart.com', password: await hash('Admin@1234'), phone: '01700000001', address: 'Dhaka, Bangladesh', role: 'admin', isLoggedIn: false, isDeleted: false },
      { upsert: true, new: true },
    ),
    User.findOneAndUpdate(
      { email: 'vendor1@zyromart.com' },
      { name: 'TechZone BD', email: 'vendor1@zyromart.com', password: await hash('Vendor@1234'), phone: '01700000002', address: 'Dhaka, Bangladesh', role: 'vendor', isLoggedIn: false, isDeleted: false },
      { upsert: true, new: true },
    ),
    User.findOneAndUpdate(
      { email: 'vendor2@zyromart.com' },
      { name: 'GadgetHub', email: 'vendor2@zyromart.com', password: await hash('Vendor@1234'), phone: '01700000003', address: 'Chittagong, Bangladesh', role: 'vendor', isLoggedIn: false, isDeleted: false },
      { upsert: true, new: true },
    ),
    User.findOneAndUpdate(
      { email: 'user1@zyromart.com' },
      { name: 'Sakib Hossain', email: 'user1@zyromart.com', password: await hash('User@1234'), phone: '01700000004', address: 'Dhaka, Bangladesh', role: 'user', isLoggedIn: false, isDeleted: false },
      { upsert: true, new: true },
    ),
  ]);
  console.log('✓ Users');

  // ─── Vendors ───────────────────────────────────────────────────────────────
  const [vendor1, vendor2] = await Promise.all([
    VendorModel.findOneAndUpdate(
      { user: vendorUser1._id },
      { user: vendorUser1._id, shopName: 'TechZone BD', slug: 'techzone-bd', description: 'Best tech products at affordable prices.', address: { line1: 'Mirpur 10', city: 'Dhaka', country: 'Bangladesh' }, contact: { email: 'vendor1@zyromart.com', phone: '01700000002' }, status: 'approved', commissionRate: 0.08, rating: 4.5 },
      { upsert: true, new: true },
    ),
    VendorModel.findOneAndUpdate(
      { user: vendorUser2._id },
      { user: vendorUser2._id, shopName: 'GadgetHub', slug: 'gadgethub', description: 'Premium gadgets and accessories.', address: { line1: 'Agrabad', city: 'Chittagong', country: 'Bangladesh' }, contact: { email: 'vendor2@zyromart.com', phone: '01700000003' }, status: 'approved', commissionRate: 0.10, rating: 4.2 },
      { upsert: true, new: true },
    ),
  ]);
  console.log('✓ Vendors');

  // ─── Clean slate for categories / products / variants ─────────────────────
  await Promise.all([
    CategoryModel.deleteMany({}),
    ProductModel.deleteMany({}),
    VariantModel.deleteMany({}),
    OrderModel.deleteMany({}),
  ]);
  console.log('✓ Cleared old categories, products, variants, orders');

  // ─── Parent Categories ─────────────────────────────────────────────────────
  const [
    phonesCat, macCat, phoneAccCat, tabletsCat, casesCat,
    watchesCat, audiosCat, pcAccCat, cameraCat, gadgetCat,
    networkingCat, gamingCat, droneCat,
  ] = await Promise.all([
    CategoryModel.findOneAndUpdate({ slug: 'phones' }, {
      name: 'Phones', slug: 'phones', icon: '📱', isActive: true,
      isFeatured: true, sortOrder: 1, parent: null,
      attributeSchema: PHONE_ATTRS,
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'mac' }, {
      name: 'Mac', slug: 'mac', icon: '💻', isActive: true,
      isFeatured: false, sortOrder: 2, parent: null,
      attributeSchema: MAC_ATTRS,
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'phone-accessories' }, {
      name: 'Phone Accessories', slug: 'phone-accessories', icon: '🔌', isActive: true,
      isFeatured: false, sortOrder: 3, parent: null,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Blue', 'Red', 'Silver'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'string' as const },
        { key: 'compatibility', label: 'Compatibility', group: 'General', type: 'string' as const },
        { key: 'power', label: 'Power/Capacity', group: 'Specs', type: 'string' as const },
      ],
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'tablets' }, {
      name: 'Tablets', slug: 'tablets', icon: '📱', isActive: true,
      isFeatured: true, sortOrder: 4, parent: null,
      attributeSchema: TABLET_ATTRS,
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'cases-protectors' }, {
      name: 'Cases & Protectors', slug: 'cases-protectors', icon: '📱', isActive: true,
      isFeatured: true, sortOrder: 5, parent: null,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'Clear', 'Blue', 'Pink', 'Green', 'Red'], isVariantOption: true, filterable: true },
        { key: 'compatibility', label: 'Compatible With', group: 'General', type: 'string' as const },
        { key: 'material', label: 'Material', group: 'Design', type: 'string' as const },
        { key: 'type', label: 'Protection Type', group: 'General', type: 'string' as const },
      ],
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'watches' }, {
      name: 'Watches', slug: 'watches', icon: '⌚', isActive: true,
      isFeatured: true, sortOrder: 6, parent: null,
      attributeSchema: WATCH_ATTRS,
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'headphone-speaker' }, {
      name: 'Headphone & Speaker', slug: 'headphone-speaker', icon: '🎧', isActive: true,
      isFeatured: false, sortOrder: 7, parent: null,
      attributeSchema: AUDIO_ATTRS,
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'pc-accessories' }, {
      name: 'PC Accessories', slug: 'pc-accessories', icon: '🖥️', isActive: true,
      isFeatured: false, sortOrder: 8, parent: null,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Silver', 'Gray'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'string' as const },
        { key: 'connectivity', label: 'Connectivity', group: 'Connectivity', type: 'string' as const },
        { key: 'compatibility', label: 'Compatibility', group: 'General', type: 'string' as const },
      ],
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'camera' }, {
      name: 'Camera', slug: 'camera', icon: '📷', isActive: true,
      isFeatured: true, sortOrder: 9, parent: null,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'Silver', 'White', 'Gold'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'enum' as const, options: ['DSLR', 'Mirrorless', 'Action Camera', 'Compact', 'Bridge'] },
        { key: 'megapixel', label: 'Megapixels', group: 'Specs', type: 'string' as const, unit: 'MP' },
        { key: 'sensor', label: 'Sensor', group: 'Specs', type: 'string' as const },
        { key: 'video', label: 'Max Video', group: 'Specs', type: 'string' as const },
        { key: 'battery', label: 'Battery', group: 'Battery', type: 'string' as const },
        { key: 'weight', label: 'Weight', group: 'Design', type: 'string' as const, unit: 'g' },
      ],
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'gadget' }, {
      name: 'Gadget', slug: 'gadget', icon: '🔧', isActive: true,
      isFeatured: false, sortOrder: 10, parent: null,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Silver', 'Blue'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'string' as const },
      ],
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'networking' }, {
      name: 'Networking', slug: 'networking', icon: '📡', isActive: true,
      isFeatured: false, sortOrder: 11, parent: null,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Silver'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'string' as const },
        { key: 'speed', label: 'Speed', group: 'Specs', type: 'string' as const },
        { key: 'band', label: 'Band', group: 'Specs', type: 'string' as const },
      ],
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'gaming' }, {
      name: 'Gaming', slug: 'gaming', icon: '🎮', isActive: true,
      isFeatured: true, sortOrder: 12, parent: null,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Red', 'Blue'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'string' as const },
        { key: 'storage', label: 'Storage', group: 'Performance', type: 'string' as const },
        { key: 'processor', label: 'Processor', group: 'Performance', type: 'string' as const },
        { key: 'display', label: 'Display', group: 'Display', type: 'string' as const },
        { key: 'battery', label: 'Battery', group: 'Battery', type: 'string' as const },
      ],
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'drone' }, {
      name: 'Drone', slug: 'drone', icon: '🚁', isActive: true,
      isFeatured: true, sortOrder: 13, parent: null,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Gray'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'string' as const },
        { key: 'camera', label: 'Camera', group: 'Specs', type: 'string' as const },
        { key: 'flightTime', label: 'Flight Time', group: 'Specs', type: 'string' as const, unit: 'min' },
        { key: 'range', label: 'Range', group: 'Specs', type: 'string' as const, unit: 'km' },
      ],
    }, { upsert: true, new: true }),
  ]);
  console.log('✓ Parent categories (13)');

  // ─── Sub-Categories (featured) ─────────────────────────────────────────────
  const [
    macbookCat, ipadCat, earbudsCat, cableAdapterCat,
    speakerCat, routerCat, powerBankCat, carAccCat,
  ] = await Promise.all([
    CategoryModel.findOneAndUpdate({ slug: 'macbook' }, {
      name: 'MacBook', slug: 'macbook', icon: '💻', isActive: true,
      isFeatured: true, sortOrder: 2, parent: macCat._id,
      attributeSchema: MAC_ATTRS,
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'ipad' }, {
      name: 'iPad', slug: 'ipad', icon: '📱', isActive: true,
      isFeatured: true, sortOrder: 4, parent: tabletsCat._id,
      attributeSchema: TABLET_ATTRS,
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'earbuds' }, {
      name: 'Earbuds', slug: 'earbuds', icon: '🎧', isActive: true,
      isFeatured: true, sortOrder: 7, parent: audiosCat._id,
      attributeSchema: AUDIO_ATTRS,
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'cable-adapter' }, {
      name: 'Cable & Adapter', slug: 'cable-adapter', icon: '🔌', isActive: true,
      isFeatured: true, sortOrder: 9, parent: phoneAccCat._id,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Silver', 'Gray'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'string' as const },
        { key: 'length', label: 'Length', group: 'Specs', type: 'string' as const, unit: 'm' },
        { key: 'power', label: 'Power', group: 'Specs', type: 'string' as const, unit: 'W' },
      ],
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'speaker' }, {
      name: 'Speaker', slug: 'speaker', icon: '🔊', isActive: true,
      isFeatured: true, sortOrder: 10, parent: audiosCat._id,
      attributeSchema: AUDIO_ATTRS,
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'router' }, {
      name: 'Router', slug: 'router', icon: '📡', isActive: true,
      isFeatured: true, sortOrder: 12, parent: networkingCat._id,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White'], isVariantOption: true, filterable: true },
        { key: 'standard', label: 'Wi-Fi Standard', group: 'Specs', type: 'string' as const },
        { key: 'speed', label: 'Speed', group: 'Specs', type: 'string' as const },
        { key: 'band', label: 'Band', group: 'Specs', type: 'string' as const },
        { key: 'ports', label: 'Ports', group: 'Connectivity', type: 'string' as const },
      ],
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'power-bank' }, {
      name: 'Power Bank', slug: 'power-bank', icon: '🔋', isActive: true,
      isFeatured: true, sortOrder: 14, parent: phoneAccCat._id,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Blue', 'Red', 'Silver'], isVariantOption: true, filterable: true },
        { key: 'capacity', label: 'Capacity', group: 'Specs', type: 'enum' as const, options: ['5000mAh', '10000mAh', '20000mAh', '30000mAh'], isVariantOption: true, filterable: true },
        { key: 'charging', label: 'Fast Charging', group: 'Specs', type: 'string' as const },
        { key: 'ports', label: 'Ports', group: 'Connectivity', type: 'string' as const },
        { key: 'weight', label: 'Weight', group: 'Design', type: 'string' as const, unit: 'g' },
      ],
    }, { upsert: true, new: true }),

    CategoryModel.findOneAndUpdate({ slug: 'car-accessories' }, {
      name: 'Car Accessories', slug: 'car-accessories', icon: '🚗', isActive: true,
      isFeatured: true, sortOrder: 15, parent: phoneAccCat._id,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'Silver', 'White'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'string' as const },
        { key: 'compatibility', label: 'Compatibility', group: 'General', type: 'string' as const },
      ],
    }, { upsert: true, new: true }),
  ]);
  console.log('✓ Sub-categories (8 featured)');

  // ─── Products ──────────────────────────────────────────────────────────────

  // 1. Samsung Galaxy S24 Ultra
  const s24ultra = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-s24-ultra' }, {
    vendor: vendor1._id, category: phonesCat._id,
    name: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra',
    brand: 'Samsung',
    description: 'The Samsung Galaxy S24 Ultra is the ultimate flagship with a built-in S Pen, 200MP camera system, and Snapdragon 8 Gen 3.',
    shortDescription: 'Samsung\'s most powerful smartphone with S Pen and 200MP camera.',
    images: [
      'https://images.samsung.com/is/image/samsung/p6pim/levant/2401/gallery/levant-galaxy-s24-ultra-s928-sm-s928bzaceub-thumb-539573424',
      'https://images.samsung.com/is/image/samsung/p6pim/levant/2401/gallery/levant-galaxy-s24-ultra-s928-sm-s928bzaceub-539573425',
    ],
    thumbnail: 'https://images.samsung.com/is/image/samsung/p6pim/levant/2401/gallery/levant-galaxy-s24-ultra-s928-sm-s928bzaceub-thumb-539573424',
    basePrice: 155000,
    compareAtPrice: 175000,
    currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'] },
      { key: 'storage', label: 'Storage', values: ['256GB', '512GB', '1TB'] },
    ],
    attributes: new Map([
      ['os', 'Android 14'], ['processor', 'Snapdragon 8 Gen 3'], ['ram', '12GB'],
      ['display', 'Dynamic AMOLED 2X'], ['displaySize', '6.8'], ['displayResolution', '3088x1440'],
      ['refreshRate', '120'], ['rearCamera', '200MP + 50MP + 10MP + 10MP'],
      ['frontCamera', '12MP'], ['battery', '5000'], ['charging', '45W Wired + 15W Wireless'],
      ['sim', 'Dual SIM (Nano + eSIM)'], ['network', '5G'], ['bluetooth', '5.3'],
      ['wifi', 'Wi-Fi 7'], ['nfc', 'Yes'], ['weight', '232'], ['dimensions', '162.3 x 79.0 x 8.6 mm'],
      ['material', 'Titanium frame + Armour Aluminium back'],
    ]),
    tags: ['samsung', 's24', 'ultra', 'flagship', '5g', 'android'],
    warranty: '1 Year Official Warranty',
    status: 'approved',
    isOnlineExclusive: true,
    totalSold: 245,
    averageRating: 4.8,
    reviewCount: 89,
    emiOptions: [{ months: 6, interestRate: 0 }, { months: 12, interestRate: 9 }, { months: 18, interestRate: 12 }],
  }, { upsert: true, new: true });

  await upsertVariants(
    s24ultra._id, 'S24U',
    [{ key: 'color', values: ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'] },
     { key: 'storage', values: ['256GB', '512GB', '1TB'] }],
    155000,
    { 'Titanium Black+512GB': 175000, 'Titanium Gray+512GB': 175000, 'Titanium Violet+512GB': 175000, 'Titanium Yellow+512GB': 175000,
      'Titanium Black+1TB': 195000, 'Titanium Gray+1TB': 195000, 'Titanium Violet+1TB': 195000, 'Titanium Yellow+1TB': 195000 },
  );

  // 2. Apple iPhone 15 Pro Max
  const iphone15pm = await ProductModel.findOneAndUpdate({ slug: 'apple-iphone-15-pro-max' }, {
    vendor: vendor2._id, category: phonesCat._id,
    name: 'Apple iPhone 15 Pro Max', slug: 'apple-iphone-15-pro-max',
    brand: 'Apple',
    description: 'iPhone 15 Pro Max features a titanium design, A17 Pro chip, 48MP main camera with 5x optical zoom, and USB-C.',
    shortDescription: 'Apple\'s most advanced iPhone with A17 Pro chip and titanium design.',
    images: [
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium',
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-blacktitanium',
    ],
    thumbnail: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium',
    basePrice: 175000,
    compareAtPrice: 195000,
    currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Natural Titanium', 'Black Titanium', 'White Titanium', 'Blue Titanium'] },
      { key: 'storage', label: 'Storage', values: ['256GB', '512GB', '1TB'] },
    ],
    attributes: new Map([
      ['os', 'iOS 17'], ['processor', 'Apple A17 Pro'], ['ram', '8GB'],
      ['display', 'Super Retina XDR OLED ProMotion'], ['displaySize', '6.7'], ['displayResolution', '2796x1290'],
      ['refreshRate', '120'], ['rearCamera', '48MP Main + 12MP Ultra Wide + 12MP 5x Telephoto'],
      ['frontCamera', '12MP TrueDepth'], ['battery', '4422'], ['charging', '27W USB-C + 15W MagSafe'],
      ['sim', 'Dual SIM (Nano + eSIM)'], ['network', '5G'], ['bluetooth', '5.3'],
      ['wifi', 'Wi-Fi 6E'], ['nfc', 'Yes'], ['weight', '221'], ['dimensions', '159.9 x 76.7 x 8.25 mm'],
      ['material', 'Grade 5 Titanium frame + Ceramic Shield'],
    ]),
    tags: ['iphone', 'apple', '15', 'pro', 'max', '5g', 'ios'],
    warranty: '1 Year Apple Warranty',
    status: 'approved',
    isOnlineExclusive: true,
    totalSold: 312,
    averageRating: 4.9,
    reviewCount: 134,
    emiOptions: [{ months: 6, interestRate: 0 }, { months: 12, interestRate: 9 }, { months: 18, interestRate: 12 }],
  }, { upsert: true, new: true });

  await upsertVariants(
    iphone15pm._id, 'IP15PM',
    [{ key: 'color', values: ['Natural Titanium', 'Black Titanium', 'White Titanium', 'Blue Titanium'] },
     { key: 'storage', values: ['256GB', '512GB', '1TB'] }],
    175000,
    { 'Natural Titanium+512GB': 195000, 'Black Titanium+512GB': 195000, 'White Titanium+512GB': 195000, 'Blue Titanium+512GB': 195000,
      'Natural Titanium+1TB': 215000, 'Black Titanium+1TB': 215000, 'White Titanium+1TB': 215000, 'Blue Titanium+1TB': 215000 },
  );

  // 3. Google Pixel 8 Pro
  const pixel8pro = await ProductModel.findOneAndUpdate({ slug: 'google-pixel-8-pro' }, {
    vendor: vendor1._id, category: phonesCat._id,
    name: 'Google Pixel 8 Pro', slug: 'google-pixel-8-pro',
    brand: 'Google',
    description: 'Google Pixel 8 Pro features Tensor G3 chip, 50MP triple camera, 7 years of OS updates, and AI-powered features.',
    shortDescription: 'Google\'s flagship with Tensor G3 and 7 years of software updates.',
    images: [
      'https://lh3.googleusercontent.com/e5b3u3-qMqzomFl9AXHNNa0h0iFOyAiMGf0R0jV_q1nRUF6v38pCdA3u5VNz_rB7KSHdxPqLYr6xOUSXd0u8vYRxMX8K0WY',
    ],
    thumbnail: 'https://lh3.googleusercontent.com/e5b3u3-qMqzomFl9AXHNNa0h0iFOyAiMGf0R0jV_q1nRUF6v38pCdA3u5VNz_rB7KSHdxPqLYr6xOUSXd0u8vYRxMX8K0WY',
    basePrice: 105000,
    compareAtPrice: 120000,
    currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Obsidian', 'Porcelain', 'Bay'] },
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB', '1TB'] },
    ],
    attributes: new Map([
      ['os', 'Android 14'], ['processor', 'Google Tensor G3'], ['ram', '12GB'],
      ['display', 'LTPO OLED LPDDR5'], ['displaySize', '6.7'], ['displayResolution', '2992x1344'],
      ['refreshRate', '120'], ['rearCamera', '50MP + 48MP Ultra-wide + 48MP 5x Telephoto'],
      ['frontCamera', '10.5MP'], ['battery', '5050'], ['charging', '30W USB-C + 23W Wireless'],
      ['sim', 'Dual SIM (eSIM + eSIM)'], ['network', '5G'], ['bluetooth', '5.3'],
      ['wifi', 'Wi-Fi 7'], ['nfc', 'Yes'], ['weight', '213'], ['dimensions', '162.6 x 76.5 x 8.8 mm'],
      ['material', 'Polished aluminum + Corning Gorilla Glass'],
    ]),
    tags: ['google', 'pixel', '8', 'pro', '5g', 'android', 'ai'],
    warranty: '1 Year Official Warranty',
    status: 'approved',
    totalSold: 98,
    averageRating: 4.7,
    reviewCount: 42,
    emiOptions: [{ months: 6, interestRate: 0 }, { months: 12, interestRate: 9 }],
  }, { upsert: true, new: true });

  await upsertVariants(
    pixel8pro._id, 'PX8P',
    [{ key: 'color', values: ['Obsidian', 'Porcelain', 'Bay'] },
     { key: 'storage', values: ['128GB', '256GB', '1TB'] }],
    105000,
    { 'Obsidian+256GB': 115000, 'Porcelain+256GB': 115000, 'Bay+256GB': 115000,
      'Obsidian+1TB': 135000, 'Porcelain+1TB': 135000, 'Bay+1TB': 135000 },
  );

  // 4. Samsung Galaxy Tab S9+
  const tabS9plus = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-tab-s9-plus' }, {
    vendor: vendor1._id, category: tabletsCat._id,
    name: 'Samsung Galaxy Tab S9+', slug: 'samsung-galaxy-tab-s9-plus',
    brand: 'Samsung',
    description: 'Galaxy Tab S9+ features a stunning 12.4" Dynamic AMOLED display, Snapdragon 8 Gen 2, and S Pen included.',
    shortDescription: 'Samsung premium tablet with AMOLED display and included S Pen.',
    images: [
      'https://images.samsung.com/is/image/samsung/p6pim/levant/2308/gallery/levant-galaxy-tab-s9-plus-x810-sm-x810nzeamea-thumb-537418064',
    ],
    thumbnail: 'https://images.samsung.com/is/image/samsung/p6pim/levant/2308/gallery/levant-galaxy-tab-s9-plus-x810-sm-x810nzeamea-thumb-537418064',
    basePrice: 110000,
    compareAtPrice: 125000,
    currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Beige', 'Graphite'] },
      { key: 'storage', label: 'Storage', values: ['256GB', '512GB'] },
      { key: 'connectivity', label: 'Connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] },
    ],
    attributes: new Map([
      ['os', 'Android 13, One UI 5.1'], ['processor', 'Snapdragon 8 Gen 2'], ['ram', '12GB'],
      ['display', 'Dynamic AMOLED 2X'], ['displaySize', '12.4'], ['displayResolution', '2800x1752'],
      ['battery', '10090'], ['connectivity', 'Wi-Fi 6E + Bluetooth 5.3'],
    ]),
    tags: ['samsung', 'tab', 's9', 'tablet', 'android', 'spen'],
    warranty: '1 Year Official Warranty',
    status: 'approved',
    totalSold: 56,
    averageRating: 4.6,
    reviewCount: 28,
    emiOptions: [{ months: 6, interestRate: 0 }, { months: 12, interestRate: 9 }],
  }, { upsert: true, new: true });

  await upsertVariants(
    tabS9plus._id, 'TABS9P',
    [{ key: 'color', values: ['Beige', 'Graphite'] },
     { key: 'storage', values: ['256GB', '512GB'] },
     { key: 'connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] }],
    110000,
    { 'Beige+512GB+Wi-Fi': 130000, 'Graphite+512GB+Wi-Fi': 130000,
      'Beige+256GB+Wi-Fi + Cellular': 125000, 'Graphite+256GB+Wi-Fi + Cellular': 125000,
      'Beige+512GB+Wi-Fi + Cellular': 145000, 'Graphite+512GB+Wi-Fi + Cellular': 145000 },
    15,
  );

  // 5. Apple iPad Pro 12.9"
  const ipadPro = await ProductModel.findOneAndUpdate({ slug: 'apple-ipad-pro-12-9' }, {
    vendor: vendor2._id, category: ipadCat._id,
    name: 'Apple iPad Pro 12.9" (M2)', slug: 'apple-ipad-pro-12-9',
    brand: 'Apple',
    description: 'iPad Pro with M2 chip delivers superfast performance with the stunning Liquid Retina XDR display.',
    shortDescription: 'Apple\'s most powerful iPad with M2 chip and XDR display.',
    images: [
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-12-select-202210',
    ],
    thumbnail: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-12-select-202210',
    basePrice: 145000,
    compareAtPrice: 160000,
    currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Space Gray', 'Silver'] },
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
      { key: 'connectivity', label: 'Connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] },
    ],
    attributes: new Map([
      ['os', 'iPadOS 16'], ['processor', 'Apple M2'], ['ram', '8GB'],
      ['display', 'Liquid Retina XDR'], ['displaySize', '12.9'], ['displayResolution', '2732x2048'],
      ['battery', '10758'], ['connectivity', 'Wi-Fi 6E + Bluetooth 5.3'],
    ]),
    tags: ['apple', 'ipad', 'pro', 'tablet', 'm2', 'ios'],
    warranty: '1 Year Apple Warranty',
    status: 'approved',
    totalSold: 87,
    averageRating: 4.8,
    reviewCount: 45,
    emiOptions: [{ months: 6, interestRate: 0 }, { months: 12, interestRate: 9 }, { months: 18, interestRate: 12 }],
  }, { upsert: true, new: true });

  await upsertVariants(
    ipadPro._id, 'IPADPRO129',
    [{ key: 'color', values: ['Space Gray', 'Silver'] },
     { key: 'storage', values: ['128GB', '256GB', '512GB'] },
     { key: 'connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] }],
    145000, {}, 20,
  );

  // 6. Apple MacBook Pro 14" M3 Pro
  const macbookPro = await ProductModel.findOneAndUpdate({ slug: 'apple-macbook-pro-14-m3-pro' }, {
    vendor: vendor2._id, category: macbookCat._id,
    name: 'Apple MacBook Pro 14" (M3 Pro)', slug: 'apple-macbook-pro-14-m3-pro',
    brand: 'Apple',
    description: 'MacBook Pro with M3 Pro chip, stunning Liquid Retina XDR display, up to 18 hours of battery life.',
    shortDescription: 'Apple MacBook Pro with M3 Pro chip for professionals.',
    images: [
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310',
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-silver-select-202310',
    ],
    thumbnail: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310',
    basePrice: 295000,
    compareAtPrice: 325000,
    currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Space Black', 'Silver'] },
      { key: 'ram', label: 'Memory', values: ['18GB', '36GB'] },
      { key: 'storage', label: 'Storage', values: ['512GB SSD', '1TB SSD'] },
    ],
    attributes: new Map([
      ['os', 'macOS Sonoma'], ['processor', 'Apple M3 Pro (11-core CPU)'],
      ['gpu', '14-core GPU'], ['display', 'Liquid Retina XDR'], ['displaySize', '14.2'],
      ['displayResolution', '3024x1964'], ['battery', 'Up to 18 hours'],
      ['weight', '1.61'], ['ports', '3x Thunderbolt 4, HDMI, SDXC, MagSafe 3'],
      ['wifi', 'Wi-Fi 6E'], ['bluetooth', 'Bluetooth 5.3'],
    ]),
    tags: ['apple', 'macbook', 'pro', 'm3', 'laptop', 'mac'],
    warranty: '1 Year Apple Warranty',
    status: 'approved',
    isOnlineExclusive: true,
    totalSold: 43,
    averageRating: 4.9,
    reviewCount: 31,
    emiOptions: [{ months: 6, interestRate: 0 }, { months: 12, interestRate: 9 }, { months: 24, interestRate: 12 }],
  }, { upsert: true, new: true });

  await upsertVariants(
    macbookPro._id, 'MBP14M3P',
    [{ key: 'color', values: ['Space Black', 'Silver'] },
     { key: 'ram', values: ['18GB', '36GB'] },
     { key: 'storage', values: ['512GB SSD', '1TB SSD'] }],
    295000,
    { 'Space Black+36GB+512GB SSD': 340000, 'Silver+36GB+512GB SSD': 340000,
      'Space Black+18GB+1TB SSD': 325000, 'Silver+18GB+1TB SSD': 325000,
      'Space Black+36GB+1TB SSD': 365000, 'Silver+36GB+1TB SSD': 365000 },
    10,
  );

  // 7. Apple AirPods Pro 2nd Gen
  const airpodsPro = await ProductModel.findOneAndUpdate({ slug: 'apple-airpods-pro-2nd-gen' }, {
    vendor: vendor2._id, category: earbudsCat._id,
    name: 'Apple AirPods Pro (2nd Generation)', slug: 'apple-airpods-pro-2nd-gen',
    brand: 'Apple',
    description: 'AirPods Pro 2 with H2 chip, Adaptive Audio, USB-C charging, up to 30 hours total with case.',
    shortDescription: 'Apple\'s best earbuds with H2 chip and Adaptive Audio.',
    images: [
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83',
    ],
    thumbnail: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83',
    basePrice: 38000,
    compareAtPrice: 45000,
    currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['White'] },
    ],
    attributes: new Map([
      ['type', 'In-Ear'], ['anc', 'Yes'], ['connectivity', 'Bluetooth 5.3'],
      ['battery', '6 hrs + 24 hrs with case = 30 hrs total'],
      ['driver', '11'], ['waterproof', 'IPX4'],
    ]),
    tags: ['apple', 'airpods', 'pro', 'earbuds', 'wireless', 'anc'],
    warranty: '1 Year Apple Warranty',
    status: 'approved',
    isOnlineExclusive: true,
    totalSold: 187,
    averageRating: 4.8,
    reviewCount: 92,
    emiOptions: [{ months: 3, interestRate: 0 }, { months: 6, interestRate: 9 }],
  }, { upsert: true, new: true });

  await upsertVariants(
    airpodsPro._id, 'APP2G',
    [{ key: 'color', values: ['White'] }],
    38000, {}, 50,
  );

  // 8. Samsung Galaxy Buds3 Pro
  const buds3pro = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-buds3-pro' }, {
    vendor: vendor1._id, category: earbudsCat._id,
    name: 'Samsung Galaxy Buds3 Pro', slug: 'samsung-galaxy-buds3-pro',
    brand: 'Samsung',
    description: 'Galaxy Buds3 Pro features a blade design, hi-fi audio, ANC, and up to 30 hours battery with case.',
    shortDescription: 'Samsung\'s premium earbuds with hi-fi audio and ANC.',
    images: [
      'https://images.samsung.com/is/image/samsung/p6pim/levant/2407/gallery/levant-galaxy-buds3-pro-r630-sm-r630nzaaxfe-thumb-542230041',
    ],
    thumbnail: 'https://images.samsung.com/is/image/samsung/p6pim/levant/2407/gallery/levant-galaxy-buds3-pro-r630-sm-r630nzaaxfe-thumb-542230041',
    basePrice: 24000,
    compareAtPrice: 28000,
    currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Silver', 'White'] },
    ],
    attributes: new Map([
      ['type', 'In-Ear'], ['anc', 'Yes'], ['connectivity', 'Bluetooth 5.4'],
      ['battery', '6 hrs + 24 hrs with case = 30 hrs total'],
      ['driver', '10.5'], ['waterproof', 'IPX4'],
    ]),
    tags: ['samsung', 'galaxy', 'buds', 'earbuds', 'wireless', 'anc'],
    warranty: '1 Year Official Warranty',
    status: 'approved',
    totalSold: 134,
    averageRating: 4.6,
    reviewCount: 67,
    emiOptions: [{ months: 3, interestRate: 0 }, { months: 6, interestRate: 9 }],
  }, { upsert: true, new: true });

  await upsertVariants(
    buds3pro._id, 'GB3P',
    [{ key: 'color', values: ['Silver', 'White'] }],
    24000, {}, 40,
  );

  // 9. Apple Watch Series 9
  const appleWatch9 = await ProductModel.findOneAndUpdate({ slug: 'apple-watch-series-9' }, {
    vendor: vendor2._id, category: watchesCat._id,
    name: 'Apple Watch Series 9', slug: 'apple-watch-series-9',
    brand: 'Apple',
    description: 'Apple Watch Series 9 with S9 chip, double tap gesture, always-on Retina display, and carbon neutral.',
    shortDescription: 'Apple Watch with S9 chip and new double tap gesture.',
    images: [
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MR9A3ref_VW_34FR+watch-case-41-aluminum-midnight-nc-s9_VW_34FR+watch-face-41-aluminum-midnight-s9_VW_34FR',
    ],
    thumbnail: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MR9A3ref_VW_34FR+watch-case-41-aluminum-midnight-nc-s9_VW_34FR+watch-face-41-aluminum-midnight-s9_VW_34FR',
    basePrice: 52000,
    compareAtPrice: 60000,
    currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'size', label: 'Size', values: ['41mm', '45mm'] },
      { key: 'color', label: 'Color', values: ['Midnight', 'Starlight', 'Pink', 'Silver', 'Red'] },
    ],
    attributes: new Map([
      ['os', 'watchOS 10'], ['display', 'Always-On Retina LTPO OLED'],
      ['battery', 'Up to 18 hours'], ['waterproof', '50m Water Resistant'],
      ['gps', 'Yes'], ['compatibility', 'iPhone 10s or later with iOS 17'],
    ]),
    tags: ['apple', 'watch', 'series9', 'smartwatch', 'wearable'],
    warranty: '1 Year Apple Warranty',
    status: 'approved',
    totalSold: 156,
    averageRating: 4.8,
    reviewCount: 78,
    emiOptions: [{ months: 3, interestRate: 0 }, { months: 6, interestRate: 9 }, { months: 12, interestRate: 9 }],
  }, { upsert: true, new: true });

  await upsertVariants(
    appleWatch9._id, 'AW9',
    [{ key: 'size', values: ['41mm', '45mm'] },
     { key: 'color', values: ['Midnight', 'Starlight', 'Pink', 'Silver', 'Red'] }],
    52000,
    { '41mm+Midnight': 52000, '45mm+Midnight': 57000, '41mm+Starlight': 52000, '45mm+Starlight': 57000,
      '41mm+Pink': 52000, '45mm+Pink': 57000, '41mm+Silver': 52000, '45mm+Silver': 57000,
      '41mm+Red': 52000, '45mm+Red': 57000 },
  );

  // 10. Samsung Galaxy Watch 6 Classic
  const galaxyWatch6 = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-watch-6-classic' }, {
    vendor: vendor1._id, category: watchesCat._id,
    name: 'Samsung Galaxy Watch 6 Classic', slug: 'samsung-galaxy-watch-6-classic',
    brand: 'Samsung',
    description: 'Galaxy Watch 6 Classic features a premium rotating bezel, Exynos W930 chip, and comprehensive health tracking.',
    shortDescription: 'Samsung premium smartwatch with iconic rotating bezel.',
    images: [
      'https://images.samsung.com/is/image/samsung/p6pim/levant/2307/gallery/levant-galaxy-watch6-classic-43mm-sm-r950nzsaxfe-thumb-537117454',
    ],
    thumbnail: 'https://images.samsung.com/is/image/samsung/p6pim/levant/2307/gallery/levant-galaxy-watch6-classic-43mm-sm-r950nzsaxfe-thumb-537117454',
    basePrice: 45000,
    compareAtPrice: 52000,
    currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'size', label: 'Size', values: ['43mm', '47mm'] },
      { key: 'color', label: 'Color', values: ['Black', 'Silver'] },
    ],
    attributes: new Map([
      ['os', 'Wear OS 4 + One UI Watch 5'], ['display', 'Super AMOLED'],
      ['battery', 'Up to 40 hours (43mm) / 44 hours (47mm)'],
      ['waterproof', '5ATM + IP68'], ['gps', 'Yes'],
      ['compatibility', 'Android 10.0+ with 1.5GB RAM or above'],
    ]),
    tags: ['samsung', 'galaxy', 'watch6', 'classic', 'smartwatch', 'wearable'],
    warranty: '1 Year Official Warranty',
    status: 'approved',
    totalSold: 98,
    averageRating: 4.6,
    reviewCount: 45,
    emiOptions: [{ months: 3, interestRate: 0 }, { months: 6, interestRate: 9 }],
  }, { upsert: true, new: true });

  await upsertVariants(
    galaxyWatch6._id, 'GW6C',
    [{ key: 'size', values: ['43mm', '47mm'] },
     { key: 'color', values: ['Black', 'Silver'] }],
    45000,
    { '43mm+Black': 45000, '43mm+Silver': 45000, '47mm+Black': 50000, '47mm+Silver': 50000 },
  );

  console.log('✓ Products (10) + Variants');

  // ─── Sample Order ───────────────────────────────────────────────────────────
  const existingOrder = await OrderModel.findOne({ user: user1._id });
  if (!existingOrder) {
    const s24Variant = await VariantModel.findOne({ product: s24ultra._id });
    if (s24Variant) {
      const orderNumber = await generateOrderNumber();
      await OrderModel.create({
        orderNumber,
        user: user1._id,
        items: [{
          product: s24ultra._id,
          variant: s24Variant._id,
          vendor: vendor1._id,
          productSnapshot: { name: s24ultra.name, brand: s24ultra.brand, thumbnail: s24ultra.thumbnail, slug: s24ultra.slug },
          variantSnapshot: { sku: s24Variant.sku, options: s24Variant.options },
          unitPrice: s24Variant.price,
          quantity: 1,
          subtotal: s24Variant.price,
        }],
        shippingAddress: { fullName: 'Sakib Hossain', line1: 'House 12, Road 5', city: 'Dhaka', country: 'Bangladesh', phone: '01700000004' },
        subtotal: s24Variant.price,
        shippingFee: 0, tax: Math.round(s24Variant.price * 0.05), discount: 0,
        total: Math.round(s24Variant.price * 1.05),
        currency: 'BDT', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'cod',
        statusHistory: [{ status: 'pending', at: new Date(Date.now() - 7 * 86400000) }, { status: 'delivered', at: new Date(Date.now() - 2 * 86400000) }],
        placedAt: new Date(Date.now() - 7 * 86400000),
        deliveredAt: new Date(Date.now() - 2 * 86400000),
      });
      console.log('✓ Sample order');
    }
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('─────── Credentials ───────');
  console.log('Admin:  admin@zyromart.com   / Admin@1234');
  console.log('Vendor: vendor1@zyromart.com / Vendor@1234  (TechZone BD)');
  console.log('Vendor: vendor2@zyromart.com / Vendor@1234  (GadgetHub)');
  console.log('User:   user1@zyromart.com   / User@1234');
  console.log('───────────────────────────');
  console.log('\nCategories: 13 parent + 8 featured sub-categories');
  console.log('Products: 10 products with full variants');

  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
