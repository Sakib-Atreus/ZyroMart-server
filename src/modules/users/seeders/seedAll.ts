/**
 * Full seed: users, vendors, categories (with attribute schemas), products, variants, order.
 * Run: npx ts-node src/modules/users/seeders/seedAll.ts
 * Or add "seed": "ts-node src/modules/users/seeders/seedAll.ts" to package.json scripts.
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

export const seed = async () => {
  await mongoose.connect(config.db_url as string);
  console.log('Connected to DB. Seeding…');

  // ─── Users ────────────────────────────────────────────────────────────────
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

  // ─── Vendors ──────────────────────────────────────────────────────────────
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

  // ─── Categories ───────────────────────────────────────────────────────────
  const [
    mobileCat, laptopCat, tabletCat,
    earphoneCat, watchCat, cameraCat,
    gamingCat, accessoryCat,
  ] = await Promise.all([
    // Smartphones
    CategoryModel.findOneAndUpdate({ slug: 'smartphones' }, {
      name: 'Smartphones', slug: 'smartphones', icon: '📱', isActive: true,
      attributeSchema: [
        { key: 'os', label: 'Operating System', group: 'General', type: 'enum', options: ['Android', 'iOS', 'HarmonyOS'], required: true, filterable: true },
        { key: 'color', label: 'Color', group: 'Design', type: 'enum', options: ['Black', 'White', 'Blue', 'Red', 'Gold', 'Green', 'Purple', 'Silver', 'Titanium', 'Lavender'], isVariantOption: true, filterable: true },
        { key: 'storage', label: 'Internal Storage', group: 'Performance', type: 'enum', options: ['64GB', '128GB', '256GB', '512GB', '1TB'], isVariantOption: true, filterable: true },
        { key: 'ram', label: 'RAM', group: 'Performance', type: 'enum', options: ['4GB', '6GB', '8GB', '12GB', '16GB'], isVariantOption: true, filterable: true },
        { key: 'processor', label: 'Processor', group: 'Performance', type: 'string' },
        { key: 'display', label: 'Display', group: 'Display', type: 'string' },
        { key: 'displaySize', label: 'Display Size', group: 'Display', type: 'string', unit: 'inches' },
        { key: 'displayResolution', label: 'Resolution', group: 'Display', type: 'string' },
        { key: 'refreshRate', label: 'Refresh Rate', group: 'Display', type: 'string', unit: 'Hz' },
        { key: 'rearCamera', label: 'Rear Camera', group: 'Camera', type: 'string' },
        { key: 'frontCamera', label: 'Front Camera', group: 'Camera', type: 'string' },
        { key: 'battery', label: 'Battery Capacity', group: 'Battery', type: 'string', unit: 'mAh' },
        { key: 'charging', label: 'Fast Charging', group: 'Battery', type: 'string' },
        { key: 'sim', label: 'SIM', group: 'Connectivity', type: 'string' },
        { key: 'network', label: 'Network', group: 'Connectivity', type: 'string' },
        { key: 'bluetooth', label: 'Bluetooth', group: 'Connectivity', type: 'string' },
        { key: 'wifi', label: 'Wi-Fi', group: 'Connectivity', type: 'string' },
        { key: 'nfc', label: 'NFC', group: 'Connectivity', type: 'enum', options: ['Yes', 'No'] },
        { key: 'weight', label: 'Weight', group: 'Design', type: 'string', unit: 'g' },
        { key: 'dimensions', label: 'Dimensions', group: 'Design', type: 'string' },
        { key: 'material', label: 'Body Material', group: 'Design', type: 'string' },
      ],
    }, { upsert: true, new: true }),

    // Laptops
    CategoryModel.findOneAndUpdate({ slug: 'laptops' }, {
      name: 'Laptops', slug: 'laptops', icon: '💻', isActive: true,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum', options: ['Silver', 'Space Gray', 'Black', 'White', 'Gold', 'Midnight'], isVariantOption: true, filterable: true },
        { key: 'ram', label: 'RAM', group: 'Performance', type: 'enum', options: ['8GB', '16GB', '32GB', '64GB'], isVariantOption: true, filterable: true },
        { key: 'storage', label: 'Storage', group: 'Performance', type: 'enum', options: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'], isVariantOption: true, filterable: true },
        { key: 'processor', label: 'Processor', group: 'Performance', type: 'string', required: true },
        { key: 'gpu', label: 'Graphics', group: 'Performance', type: 'string' },
        { key: 'display', label: 'Display', group: 'Display', type: 'string' },
        { key: 'displaySize', label: 'Display Size', group: 'Display', type: 'string', unit: 'inches' },
        { key: 'displayResolution', label: 'Resolution', group: 'Display', type: 'string' },
        { key: 'os', label: 'Operating System', group: 'General', type: 'string' },
        { key: 'battery', label: 'Battery', group: 'Battery', type: 'string' },
        { key: 'weight', label: 'Weight', group: 'Design', type: 'string', unit: 'kg' },
        { key: 'ports', label: 'Ports', group: 'Connectivity', type: 'string' },
        { key: 'wifi', label: 'Wi-Fi', group: 'Connectivity', type: 'string' },
        { key: 'bluetooth', label: 'Bluetooth', group: 'Connectivity', type: 'string' },
      ],
    }, { upsert: true, new: true }),

    // Tablets
    CategoryModel.findOneAndUpdate({ slug: 'tablets' }, {
      name: 'Tablets', slug: 'tablets', icon: '📟', isActive: true,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum', options: ['Black', 'Silver', 'Gold', 'Blue', 'Purple', 'Pink'], isVariantOption: true, filterable: true },
        { key: 'storage', label: 'Storage', group: 'Performance', type: 'enum', options: ['64GB', '128GB', '256GB', '512GB'], isVariantOption: true, filterable: true },
        { key: 'connectivity', label: 'Connectivity', group: 'Connectivity', type: 'enum', options: ['Wi-Fi', 'Wi-Fi + Cellular'], isVariantOption: true, filterable: true },
        { key: 'display', label: 'Display', group: 'Display', type: 'string' },
        { key: 'processor', label: 'Processor', group: 'Performance', type: 'string' },
        { key: 'ram', label: 'RAM', group: 'Performance', type: 'string' },
        { key: 'battery', label: 'Battery', group: 'Battery', type: 'string', unit: 'mAh' },
        { key: 'os', label: 'OS', group: 'General', type: 'string' },
      ],
    }, { upsert: true, new: true }),

    // Earphones & Headphones
    CategoryModel.findOneAndUpdate({ slug: 'earphones-headphones' }, {
      name: 'Earphones & Headphones', slug: 'earphones-headphones', icon: '🎧', isActive: true,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum', options: ['Black', 'White', 'Midnight', 'Starlight', 'Blue', 'Navy', 'Storm Gray'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'enum', options: ['In-Ear (TWS)', 'Over-Ear', 'On-Ear', 'Neckband'], required: true, filterable: true },
        { key: 'anc', label: 'Active Noise Cancellation', group: 'Features', type: 'enum', options: ['Yes', 'No'] },
        { key: 'connectivity', label: 'Connectivity', group: 'Connectivity', type: 'string' },
        { key: 'battery', label: 'Battery Life', group: 'Battery', type: 'string' },
        { key: 'driver', label: 'Driver Size', group: 'General', type: 'string', unit: 'mm' },
        { key: 'waterproof', label: 'Water Resistance', group: 'Features', type: 'string' },
        { key: 'microphone', label: 'Microphone', group: 'Features', type: 'enum', options: ['Yes', 'No'] },
        { key: 'multipoint', label: 'Multi-device Pairing', group: 'Features', type: 'enum', options: ['Yes', 'No'] },
      ],
    }, { upsert: true, new: true }),

    // Smart Watches
    CategoryModel.findOneAndUpdate({ slug: 'smart-watches' }, {
      name: 'Smart Watches', slug: 'smart-watches', icon: '⌚', isActive: true,
      attributeSchema: [
        { key: 'color', label: 'Case Color', group: 'Design', type: 'enum', options: ['Black', 'Silver', 'Gold', 'Midnight', 'Starlight', 'Red', 'Blue', 'Green'], isVariantOption: true, filterable: true },
        { key: 'size', label: 'Case Size', group: 'Design', type: 'enum', options: ['40mm', '41mm', '44mm', '45mm', '49mm'], isVariantOption: true, filterable: true },
        { key: 'os', label: 'OS', group: 'General', type: 'string' },
        { key: 'display', label: 'Display', group: 'Display', type: 'string' },
        { key: 'battery', label: 'Battery Life', group: 'Battery', type: 'string' },
        { key: 'sensors', label: 'Health Sensors', group: 'Health', type: 'string' },
        { key: 'waterproof', label: 'Water Resistance', group: 'Features', type: 'string' },
        { key: 'gps', label: 'GPS', group: 'Features', type: 'enum', options: ['Yes', 'No'] },
        { key: 'cellular', label: 'Cellular', group: 'Connectivity', type: 'enum', options: ['Yes', 'No'] },
        { key: 'compatibility', label: 'Compatible With', group: 'General', type: 'string' },
      ],
    }, { upsert: true, new: true }),

    // Cameras
    CategoryModel.findOneAndUpdate({ slug: 'cameras' }, {
      name: 'Cameras', slug: 'cameras', icon: '📷', isActive: true,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum', options: ['Black', 'Silver', 'White'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Camera Type', group: 'General', type: 'enum', options: ['DSLR', 'Mirrorless', 'Point & Shoot', 'Action'], required: true, filterable: true },
        { key: 'megapixel', label: 'Megapixels', group: 'General', type: 'string', unit: 'MP' },
        { key: 'sensor', label: 'Sensor', group: 'General', type: 'string' },
        { key: 'video', label: 'Video', group: 'General', type: 'string' },
        { key: 'battery', label: 'Battery', group: 'Battery', type: 'string' },
        { key: 'weight', label: 'Weight', group: 'Design', type: 'string', unit: 'g' },
      ],
    }, { upsert: true, new: true }),

    // Gaming
    CategoryModel.findOneAndUpdate({ slug: 'gaming' }, {
      name: 'Gaming', slug: 'gaming', icon: '🎮', isActive: true,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum', options: ['Black', 'White', 'Red', 'Blue'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'enum', options: ['Console', 'Gaming Phone', 'Controller', 'Headset', 'Mouse', 'Keyboard'], required: true, filterable: true },
        { key: 'storage', label: 'Storage', group: 'Performance', type: 'enum', options: ['825GB SSD', '1TB SSD', '2TB SSD'], isVariantOption: true, filterable: true },
        { key: 'processor', label: 'Processor', group: 'Performance', type: 'string' },
        { key: 'display', label: 'Display', group: 'Display', type: 'string' },
        { key: 'battery', label: 'Battery', group: 'Battery', type: 'string' },
      ],
    }, { upsert: true, new: true }),

    // Accessories
    CategoryModel.findOneAndUpdate({ slug: 'accessories' }, {
      name: 'Accessories', slug: 'accessories', icon: '🔌', isActive: true,
      attributeSchema: [
        { key: 'color', label: 'Color', group: 'Design', type: 'enum', options: ['Black', 'White', 'Red', 'Blue', 'Clear', 'Silver'], isVariantOption: true, filterable: true },
        { key: 'type', label: 'Type', group: 'General', type: 'enum', options: ['Case', 'Charger', 'Cable', 'Screen Protector', 'Power Bank', 'Stand', 'Hub'], required: true, filterable: true },
        { key: 'compatibility', label: 'Compatible With', group: 'General', type: 'string' },
      ],
    }, { upsert: true, new: true }),
  ]);
  console.log('✓ Categories (8)');

  // ─── Helper: upsert all variants for a product ─────────────────────────────
  const upsertVariants = async (
    productId: mongoose.Types.ObjectId,
    productSlug: string,
    options: { key: string; values: string[] }[],
    basePrice: number,
    baseCompare: number,
    stock: number,
    priceOverrides: Record<string, { price: number; stock?: number }> = {},
  ) => {
    const combinations = cartesian(options);
    for (const combo of combinations) {
      const sku = mkSku(productSlug.toUpperCase().slice(0, 8), combo);
      const hashKey = JSON.stringify(combo);
      const override = priceOverrides[hashKey];
      await VariantModel.findOneAndUpdate(
        { sku },
        {
          product: productId,
          sku,
          options: new Map(Object.entries(combo)),
          optionsHash: require('crypto').createHash('sha1').update(
            Object.keys(combo).sort().map(k => `${k}=${combo[k]}`).join('|')
          ).digest('hex'),
          price: override?.price ?? basePrice,
          compareAtPrice: baseCompare,
          stock: override?.stock ?? stock,
          reservedStock: 0,
          images: [],
          isActive: true,
        },
        { upsert: true, new: true },
      );
    }
    console.log(`  ↳ ${combinations.length} variants for ${productSlug}`);
  };

  // ─── Products ─────────────────────────────────────────────────────────────
  const [
    pSamsungS24Ultra, pIphone15ProMax, pPixel8Pro,
    pGalaxyTab, pMacBookPro, pDellXPS,
    pAirPodsPro, pGalaxyBuds, pAppleWatch, pGalaxyWatch,
  ] = await Promise.all([

    // ── Samsung Galaxy S24 Ultra ──
    ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-s24-ultra' }, {
      vendor: vendor1._id, category: mobileCat._id,
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      brand: 'Samsung',
      description: `The Samsung Galaxy S24 Ultra is the ultimate Galaxy experience, combining the power of Galaxy AI with the precision of the built-in S Pen. With a 6.8-inch Dynamic AMOLED 2X display, 200MP ProVisual Engine camera, and Snapdragon 8 Gen 3 processor, it is designed for those who demand the absolute best.

The titanium frame is both incredibly strong and lightweight, while the flat Corning Gorilla Glass Armor reduces glare by up to 75%. Galaxy AI features make your daily tasks smarter and more seamless, from Circle to Search to Live Translate during phone calls.`,
      shortDescription: 'Flagship Samsung Galaxy with S Pen and Galaxy AI',
      images: [
        'https://images.samsung.com/is/image/samsung/p6pim/uk/2401/gallery/uk-galaxy-s24-ultra-s928-sm-s928bzageub-thumb-539573029.jpg',
        'https://images.samsung.com/is/image/samsung/p6pim/uk/2401/gallery/uk-galaxy-s24-ultra-s928-sm-s928bzkgeub-thumb-539573032.jpg',
        'https://images.samsung.com/is/image/samsung/p6pim/uk/2401/gallery/uk-galaxy-s24-ultra-s928-sm-s928bzpgeub-thumb-539573035.jpg',
      ],
      thumbnail: 'https://images.samsung.com/is/image/samsung/p6pim/uk/2401/gallery/uk-galaxy-s24-ultra-s928-sm-s928bzageub-thumb-539573029.jpg',
      basePrice: 145000, compareAtPrice: 165000, currency: 'BDT',
      hasVariants: true,
      variantOptions: [
        { key: 'color', label: 'Color', values: ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'] },
        { key: 'storage', label: 'Storage', values: ['256GB', '512GB', '1TB'] },
      ],
      attributes: new Map([
        ['os', 'Android 14 (One UI 6.1)'],
        ['processor', 'Snapdragon 8 Gen 3 (4nm)'],
        ['display', '6.8" Dynamic AMOLED 2X, 120Hz'],
        ['displaySize', '6.8'],
        ['displayResolution', '3088 × 1440 (QHD+)'],
        ['refreshRate', '1-120'],
        ['rearCamera', '200MP + 12MP + 10MP + 50MP'],
        ['frontCamera', '12MP'],
        ['battery', '5000'],
        ['charging', '45W Super Fast Charging + 15W Wireless'],
        ['sim', 'Dual SIM (Nano + eSIM)'],
        ['network', '5G / 4G LTE'],
        ['bluetooth', '5.3'],
        ['wifi', 'Wi-Fi 7'],
        ['nfc', 'Yes'],
        ['weight', '232'],
        ['dimensions', '162.3 × 79.0 × 8.6 mm'],
        ['material', 'Titanium Frame, Corning Gorilla Glass Armor'],
      ]),
      tags: ['samsung', 'galaxy', 's24-ultra', 'flagship', '5g', 's-pen', 'ai', 'android'],
      warranty: '1 Year Samsung Official Warranty',
      status: 'approved', totalSold: 145, averageRating: 4.7, reviewCount: 52,
      isOnlineExclusive: true,
      emiOptions: [
        { months: 6, monthlyRate: 0.01, minAmount: 100000 },
        { months: 12, monthlyRate: 0.012, minAmount: 100000 },
        { months: 24, monthlyRate: 0.015, minAmount: 100000 },
      ],
    }, { upsert: true, new: true }),

    // ── iPhone 15 Pro Max ──
    ProductModel.findOneAndUpdate({ slug: 'apple-iphone-15-pro-max' }, {
      vendor: vendor2._id, category: mobileCat._id,
      name: 'Apple iPhone 15 Pro Max',
      slug: 'apple-iphone-15-pro-max',
      brand: 'Apple',
      description: `iPhone 15 Pro Max. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action Button, and the most powerful iPhone camera system ever. The aerospace-grade titanium design makes iPhone 15 Pro Max incredibly strong yet impressively light.

The A17 Pro chip is the first-ever 3nm chip in a smartphone, delivering extraordinary performance and efficiency. The 5× Telephoto camera lets you zoom in on distant subjects with remarkable detail, while ProRAW and ProRes video capture give you professional-grade creative control.`,
      shortDescription: 'Apple flagship with titanium design and A17 Pro chip',
      images: [
        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium.jpg',
        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-blacktitanium.jpg',
        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-bluetitanium.jpg',
        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-whitetitanium.jpg',
      ],
      thumbnail: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium.jpg',
      basePrice: 180000, compareAtPrice: 200000, currency: 'BDT',
      hasVariants: true,
      variantOptions: [
        { key: 'color', label: 'Color', values: ['Natural Titanium', 'Black Titanium', 'Blue Titanium', 'White Titanium'] },
        { key: 'storage', label: 'Storage', values: ['256GB', '512GB', '1TB'] },
      ],
      attributes: new Map([
        ['os', 'iOS 17'],
        ['processor', 'Apple A17 Pro (3nm)'],
        ['display', '6.7" Super Retina XDR OLED, ProMotion 120Hz'],
        ['displaySize', '6.7'],
        ['displayResolution', '2796 × 1290 (460 ppi)'],
        ['refreshRate', '1-120 (ProMotion)'],
        ['rearCamera', '48MP Main + 12MP Ultrawide + 12MP 5× Telephoto'],
        ['frontCamera', '12MP TrueDepth'],
        ['battery', '4422'],
        ['charging', '27W MagSafe + 15W Qi2'],
        ['sim', 'Dual eSIM (No physical SIM)'],
        ['network', '5G / 4G LTE'],
        ['bluetooth', '5.3'],
        ['wifi', 'Wi-Fi 6E'],
        ['nfc', 'Yes'],
        ['weight', '221'],
        ['dimensions', '159.9 × 76.7 × 8.25 mm'],
        ['material', 'Grade 5 Titanium Frame, Textured Matte Glass'],
      ]),
      tags: ['iphone', 'apple', 'ios', 'flagship', '5g', 'titanium', 'promax'],
      warranty: '1 Year Apple International Warranty',
      status: 'approved', totalSold: 230, averageRating: 4.9, reviewCount: 94,
      isOnlineExclusive: true,
      emiOptions: [
        { months: 6, monthlyRate: 0.01, minAmount: 100000 },
        { months: 12, monthlyRate: 0.012, minAmount: 100000 },
        { months: 24, monthlyRate: 0.015, minAmount: 100000 },
      ],
    }, { upsert: true, new: true }),

    // ── Google Pixel 8 Pro ──
    ProductModel.findOneAndUpdate({ slug: 'google-pixel-8-pro' }, {
      vendor: vendor1._id, category: mobileCat._id,
      name: 'Google Pixel 8 Pro',
      slug: 'google-pixel-8-pro',
      brand: 'Google',
      description: `Google Pixel 8 Pro is powered by the all-new Google Tensor G3 chip — built to make Google AI work faster, more efficiently and more securely. With the best photo editing tools, a 50MP camera system with pro-level controls, and 7 years of OS and security updates, it's designed for the long haul.`,
      shortDescription: 'Google AI phone with Tensor G3 and best-in-class camera',
      images: [
        'https://lh3.googleusercontent.com/3HZWi_-7-EGBOzJ5fFZN_Mj0BVbW1_uJnD30SV1LZQP16M5-gkq28bPwCyE_fN7mOtf=w800',
      ],
      thumbnail: 'https://lh3.googleusercontent.com/3HZWi_-7-EGBOzJ5fFZN_Mj0BVbW1_uJnD30SV1LZQP16M5-gkq28bPwCyE_fN7mOtf=w800',
      basePrice: 120000, compareAtPrice: 135000, currency: 'BDT',
      hasVariants: true,
      variantOptions: [
        { key: 'color', label: 'Color', values: ['Obsidian', 'Bay', 'Porcelain'] },
        { key: 'storage', label: 'Storage', values: ['128GB', '256GB', '512GB'] },
      ],
      attributes: new Map([
        ['os', 'Android 14 (7 years guaranteed updates)'],
        ['processor', 'Google Tensor G3 (4nm)'],
        ['display', '6.7" LTPO OLED, 1-120Hz'],
        ['displaySize', '6.7'],
        ['displayResolution', '2992 × 1344 (489 ppi)'],
        ['refreshRate', '1-120'],
        ['rearCamera', '50MP Main + 48MP Ultrawide + 48MP 5× Telephoto'],
        ['frontCamera', '10.5MP'],
        ['battery', '5050'],
        ['charging', '30W Wired + 23W Wireless'],
        ['sim', 'Dual SIM (Nano + eSIM)'],
        ['network', '5G / 4G LTE'],
        ['bluetooth', '5.3'],
        ['wifi', 'Wi-Fi 7'],
        ['nfc', 'Yes'],
        ['weight', '213'],
        ['dimensions', '162.6 × 76.5 × 8.8 mm'],
        ['material', 'Polished Aluminum Frame, Matte Glass Back'],
      ]),
      tags: ['google', 'pixel', 'android', '5g', 'ai-camera'],
      warranty: '1 Year Google Official Warranty',
      status: 'approved', totalSold: 78, averageRating: 4.6, reviewCount: 34,
    }, { upsert: true, new: true }),

    // ── Samsung Galaxy Tab S9+ ──
    ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-tab-s9-plus' }, {
      vendor: vendor1._id, category: tabletCat._id,
      name: 'Samsung Galaxy Tab S9+',
      slug: 'samsung-galaxy-tab-s9-plus',
      brand: 'Samsung',
      description: `The Galaxy Tab S9+ delivers a flagship tablet experience with its stunning 12.4" Dynamic AMOLED 2X display, Snapdragon 8 Gen 2 processor, and included S Pen. IP68 water and dust resistance means you can take it anywhere.`,
      shortDescription: 'Premium Android tablet with S Pen and 12.4" AMOLED display',
      images: ['https://images.samsung.com/is/image/samsung/p6pim/uk/sm-x810nzaaeub/gallery/uk-galaxy-tab-s9plus-sm-x810-sm-x810nzaaeub-thumb-536908006.jpg'],
      thumbnail: 'https://images.samsung.com/is/image/samsung/p6pim/uk/sm-x810nzaaeub/gallery/uk-galaxy-tab-s9plus-sm-x810-sm-x810nzaaeub-thumb-536908006.jpg',
      basePrice: 95000, compareAtPrice: 110000, currency: 'BDT',
      hasVariants: true,
      variantOptions: [
        { key: 'color', label: 'Color', values: ['Beige', 'Graphite'] },
        { key: 'storage', label: 'Storage', values: ['256GB', '512GB'] },
        { key: 'connectivity', label: 'Connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] },
      ],
      attributes: new Map([
        ['os', 'Android 13 (One UI 5.1)'],
        ['processor', 'Snapdragon 8 Gen 2'],
        ['display', '12.4" Dynamic AMOLED 2X, 120Hz'],
        ['ram', '12GB'],
        ['battery', '10090'],
        ['charging', '45W'],
        ['wifi', 'Wi-Fi 6E'],
        ['bluetooth', '5.3'],
        ['dimensions', '285.4 × 185.4 × 5.7 mm'],
        ['weight', '581'],
      ]),
      tags: ['samsung', 'tablet', 'galaxy-tab', 'android', 's-pen', 'amoled'],
      warranty: '1 Year Samsung Warranty',
      status: 'approved', totalSold: 62, averageRating: 4.5, reviewCount: 28,
      emiOptions: [{ months: 12, monthlyRate: 0.012, minAmount: 50000 }],
    }, { upsert: true, new: true }),

    // ── MacBook Pro 14 M3 Pro ──
    ProductModel.findOneAndUpdate({ slug: 'apple-macbook-pro-14-m3-pro' }, {
      vendor: vendor2._id, category: laptopCat._id,
      name: 'Apple MacBook Pro 14" (M3 Pro)',
      slug: 'apple-macbook-pro-14-m3-pro',
      brand: 'Apple',
      description: `MacBook Pro 14" with M3 Pro chip delivers phenomenal performance with up to 18-hour battery life. The Liquid Retina XDR display with ProMotion technology provides an immersive viewing experience. Perfect for developers, designers, and creative professionals.`,
      shortDescription: 'Apple MacBook Pro 14" with M3 Pro chip and Liquid Retina XDR display',
      images: [
        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-spacegray-select-202310.jpg',
        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-silver-select-202310.jpg',
      ],
      thumbnail: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-spacegray-select-202310.jpg',
      basePrice: 285000, compareAtPrice: 310000, currency: 'BDT',
      hasVariants: true,
      variantOptions: [
        { key: 'color', label: 'Color', values: ['Space Black', 'Silver'] },
        { key: 'ram', label: 'RAM', values: ['18GB', '36GB'] },
        { key: 'storage', label: 'Storage', values: ['512GB SSD', '1TB SSD'] },
      ],
      attributes: new Map([
        ['processor', 'Apple M3 Pro (11-core CPU, 14-core GPU)'],
        ['display', '14.2" Liquid Retina XDR, ProMotion 120Hz'],
        ['displaySize', '14.2'],
        ['displayResolution', '3024 × 1964 (254 ppi)'],
        ['os', 'macOS Sonoma'],
        ['battery', '70Wh (up to 18 hrs)'],
        ['ports', '3× Thunderbolt 4, HDMI, SD Card, MagSafe 3'],
        ['wifi', 'Wi-Fi 6E'],
        ['bluetooth', '5.3'],
        ['weight', '1.61'],
        ['gpu', 'Apple M3 Pro 14-core GPU'],
      ]),
      tags: ['macbook', 'apple', 'laptop', 'm3-pro', 'macos', 'retina'],
      warranty: '1 Year Apple Limited Warranty (AppleCare available)',
      status: 'approved', totalSold: 48, averageRating: 4.9, reviewCount: 31,
      emiOptions: [
        { months: 12, monthlyRate: 0.012, minAmount: 200000 },
        { months: 24, monthlyRate: 0.015, minAmount: 200000 },
      ],
    }, { upsert: true, new: true }),

    // ── Dell XPS 15 ──
    ProductModel.findOneAndUpdate({ slug: 'dell-xps-15-9530' }, {
      vendor: vendor1._id, category: laptopCat._id,
      name: 'Dell XPS 15 (9530) OLED',
      slug: 'dell-xps-15-9530',
      brand: 'Dell',
      description: `The Dell XPS 15 is the definitive Windows laptop. With a stunning 15.6" OLED touch display, 13th Gen Intel Core i9 processor, and NVIDIA RTX 4070, it handles everything from professional creative work to gaming with ease.`,
      shortDescription: 'Premium Windows laptop with OLED display and RTX 4070',
      images: ['https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/black/notebook-xps-15-9530-t-black-gallery-3.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=402&qlt=100,1&resMode=sharp2&size=402,402'],
      thumbnail: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/black/notebook-xps-15-9530-t-black-gallery-3.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=402&qlt=100,1&resMode=sharp2&size=402,402',
      basePrice: 220000, compareAtPrice: 245000, currency: 'BDT',
      hasVariants: true,
      variantOptions: [
        { key: 'ram', label: 'RAM', values: ['16GB', '32GB'] },
        { key: 'storage', label: 'Storage', values: ['512GB SSD', '1TB SSD'] },
      ],
      attributes: new Map([
        ['processor', 'Intel Core i9-13900H (13th Gen)'],
        ['gpu', 'NVIDIA GeForce RTX 4070 8GB GDDR6'],
        ['display', '15.6" OLED Touch, 3.5K, 60Hz'],
        ['displaySize', '15.6'],
        ['displayResolution', '3456 × 2160 (OLED)'],
        ['os', 'Windows 11 Home'],
        ['battery', '86Wh (up to 13 hrs)'],
        ['ports', '2× Thunderbolt 4, USB-A, SD Card, HDMI 2.1'],
        ['wifi', 'Wi-Fi 6E'],
        ['bluetooth', '5.2'],
        ['weight', '1.86'],
        ['color', 'Platinum Silver'],
      ]),
      tags: ['dell', 'xps', 'laptop', 'oled', 'windows', 'rtx4070', 'intel-i9'],
      warranty: '1 Year Dell On-Site Warranty',
      status: 'approved', totalSold: 35, averageRating: 4.6, reviewCount: 19,
      emiOptions: [{ months: 12, monthlyRate: 0.012, minAmount: 150000 }],
    }, { upsert: true, new: true }),

    // ── Apple AirPods Pro (2nd Gen) ──
    ProductModel.findOneAndUpdate({ slug: 'apple-airpods-pro-2nd-gen' }, {
      vendor: vendor2._id, category: earphoneCat._id,
      name: 'Apple AirPods Pro (2nd Generation)',
      slug: 'apple-airpods-pro-2nd-gen',
      brand: 'Apple',
      description: `AirPods Pro (2nd generation) with USB-C feature up to 2× more Active Noise Cancellation than before, plus Adaptive Audio and Conversation Awareness. The H2 chip enables the most sophisticated audio technology in earphones.`,
      shortDescription: 'Apple TWS with industry-leading ANC and Transparency Mode',
      images: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MQD83.jpg'],
      thumbnail: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MQD83.jpg',
      basePrice: 32000, compareAtPrice: 36000, currency: 'BDT',
      hasVariants: true,
      variantOptions: [
        { key: 'color', label: 'Color', values: ['White'] },
      ],
      attributes: new Map([
        ['type', 'In-Ear (TWS)'],
        ['anc', 'Yes (Adaptive ANC)'],
        ['connectivity', 'Bluetooth 5.3'],
        ['battery', '6 hrs (30 hrs with case)'],
        ['driver', '11'],
        ['waterproof', 'IPX4 (earbuds + case)'],
        ['microphone', 'Yes (4 mics)'],
        ['multipoint', 'No'],
      ]),
      tags: ['airpods', 'apple', 'tws', 'anc', 'earbuds', 'wireless'],
      warranty: '1 Year Apple Warranty',
      status: 'approved', totalSold: 180, averageRating: 4.8, reviewCount: 76,
    }, { upsert: true, new: true }),

    // ── Samsung Galaxy Buds3 Pro ──
    ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-buds3-pro' }, {
      vendor: vendor1._id, category: earphoneCat._id,
      name: 'Samsung Galaxy Buds3 Pro',
      slug: 'samsung-galaxy-buds3-pro',
      brand: 'Samsung',
      description: `Galaxy Buds3 Pro redefine what earbuds can do. With Blade Lights — customizable LED lighting on each earbud — Intelligent ANC, and Galaxy AI-powered conversation mode, they are unlike anything before.`,
      shortDescription: 'Premium TWS with LED accents and Galaxy AI',
      images: ['https://images.samsung.com/is/image/samsung/p6pim/uk/sm-r630nzaabtu/gallery/uk-galaxy-buds3-pro-sm-r630-sm-r630nzaabtu-thumb-545474538.jpg'],
      thumbnail: 'https://images.samsung.com/is/image/samsung/p6pim/uk/sm-r630nzaabtu/gallery/uk-galaxy-buds3-pro-sm-r630-sm-r630nzaabtu-thumb-545474538.jpg',
      basePrice: 22000, compareAtPrice: 25000, currency: 'BDT',
      hasVariants: true,
      variantOptions: [
        { key: 'color', label: 'Color', values: ['White', 'Silver', 'Twilight Blue'] },
      ],
      attributes: new Map([
        ['type', 'In-Ear (TWS)'],
        ['anc', 'Yes (Intelligent ANC)'],
        ['connectivity', 'Bluetooth 5.4'],
        ['battery', '7 hrs (30 hrs with case)'],
        ['driver', '11'],
        ['waterproof', 'IPX7'],
        ['microphone', 'Yes'],
        ['multipoint', 'Yes'],
      ]),
      tags: ['samsung', 'galaxy-buds', 'tws', 'anc', 'wireless', 'earbuds'],
      warranty: '1 Year Samsung Warranty',
      status: 'approved', totalSold: 95, averageRating: 4.5, reviewCount: 42,
    }, { upsert: true, new: true }),

    // ── Apple Watch Series 9 ──
    ProductModel.findOneAndUpdate({ slug: 'apple-watch-series-9' }, {
      vendor: vendor2._id, category: watchCat._id,
      name: 'Apple Watch Series 9',
      slug: 'apple-watch-series-9',
      brand: 'Apple',
      description: `Apple Watch Series 9. A magical new way to interact with Apple Watch. With the new S9 chip, a brighter display, and the groundbreaking Double Tap gesture, Series 9 is a remarkable tool for your health, fitness, and safety.`,
      shortDescription: 'Apple smartwatch with S9 chip, Double Tap gesture, and health sensors',
      images: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MR9K3ref_AV1_GEO_IN.jpg'],
      thumbnail: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MR9K3ref_AV1_GEO_IN.jpg',
      basePrice: 55000, compareAtPrice: 62000, currency: 'BDT',
      hasVariants: true,
      variantOptions: [
        { key: 'size', label: 'Case Size', values: ['41mm', '45mm'] },
        { key: 'color', label: 'Color', values: ['Midnight', 'Starlight', 'Pink', 'Silver', 'Red'] },
      ],
      attributes: new Map([
        ['os', 'watchOS 10'],
        ['display', 'LTPO OLED Retina (Up to 2000 nits)'],
        ['battery', 'Up to 18 hours'],
        ['sensors', 'Heart Rate, Blood Oxygen, ECG, Temperature, Crash Detection, Fall Detection'],
        ['waterproof', '50m Water Resistant (WR50)'],
        ['gps', 'Yes (Built-in GPS + GLONASS)'],
        ['cellular', 'Optional (GPS + Cellular model)'],
        ['compatibility', 'iPhone XS or later with iOS 17'],
        ['charging', 'Magnetic Fast Charging USB-C'],
      ]),
      tags: ['apple-watch', 'apple', 'smartwatch', 'fitness', 'health', 'wearable'],
      warranty: '1 Year Apple Warranty',
      status: 'approved', totalSold: 112, averageRating: 4.8, reviewCount: 58,
      emiOptions: [{ months: 6, monthlyRate: 0.01, minAmount: 30000 }],
    }, { upsert: true, new: true }),

    // ── Samsung Galaxy Watch 6 Classic ──
    ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-watch-6-classic' }, {
      vendor: vendor1._id, category: watchCat._id,
      name: 'Samsung Galaxy Watch 6 Classic',
      slug: 'samsung-galaxy-watch-6-classic',
      brand: 'Samsung',
      description: `The Galaxy Watch 6 Classic brings back the iconic rotating bezel, now reimagined with a premium design. Advanced health tracking, a powerful Exynos W930 processor, and Galaxy AI integration make it the smartest Samsung watch yet.`,
      shortDescription: 'Samsung smartwatch with iconic rotating bezel and Galaxy AI health tracking',
      images: ['https://images.samsung.com/is/image/samsung/p6pim/uk/sm-r960nzsabtu/gallery/uk-galaxy-watch6-classic-sm-r960-sm-r960nzsabtu-thumb-536859481.jpg'],
      thumbnail: 'https://images.samsung.com/is/image/samsung/p6pim/uk/sm-r960nzsabtu/gallery/uk-galaxy-watch6-classic-sm-r960-sm-r960nzsabtu-thumb-536859481.jpg',
      basePrice: 45000, compareAtPrice: 52000, currency: 'BDT',
      hasVariants: true,
      variantOptions: [
        { key: 'size', label: 'Case Size', values: ['43mm', '47mm'] },
        { key: 'color', label: 'Color', values: ['Black', 'Silver'] },
      ],
      attributes: new Map([
        ['os', 'Wear OS 4 (One UI Watch 5.0)'],
        ['display', 'Super AMOLED (2000 nits)'],
        ['battery', 'Up to 40 hours (47mm)'],
        ['sensors', 'BioActive Sensor (Heart Rate, SpO2, ECG, Body Fat, Skin Temp)'],
        ['waterproof', '5ATM + IP68 + MIL-STD-810H'],
        ['gps', 'Yes (GPS + Glonass + BDS)'],
        ['cellular', 'Optional'],
        ['compatibility', 'Android 10 or later (Galaxy recommended)'],
        ['charging', '10W Wireless Charging'],
      ]),
      tags: ['samsung', 'galaxy-watch', 'smartwatch', 'wearable', 'fitness'],
      warranty: '1 Year Samsung Warranty',
      status: 'approved', totalSold: 68, averageRating: 4.4, reviewCount: 33,
    }, { upsert: true, new: true }),
  ]);
  console.log('✓ Products (10)');

  // ─── Generate all variants ─────────────────────────────────────────────────
  await upsertVariants(pSamsungS24Ultra._id, 'SGS24U',
    [{ key: 'color', values: ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'] }, { key: 'storage', values: ['256GB', '512GB', '1TB'] }],
    145000, 165000, 40,
    { '{"color":"Titanium Black","storage":"1TB"}': { price: 165000, stock: 15 }, '{"color":"Titanium Gray","storage":"1TB"}': { price: 165000, stock: 10 } }
  );

  await upsertVariants(pIphone15ProMax._id, 'IP15PM',
    [{ key: 'color', values: ['Natural Titanium', 'Black Titanium', 'Blue Titanium', 'White Titanium'] }, { key: 'storage', values: ['256GB', '512GB', '1TB'] }],
    180000, 200000, 25,
    { '{"color":"Natural Titanium","storage":"1TB"}': { price: 225000, stock: 8 } }
  );

  await upsertVariants(pPixel8Pro._id, 'PIX8PRO',
    [{ key: 'color', values: ['Obsidian', 'Bay', 'Porcelain'] }, { key: 'storage', values: ['128GB', '256GB', '512GB'] }],
    120000, 135000, 30
  );

  await upsertVariants(pGalaxyTab._id, 'TABS9P',
    [{ key: 'color', values: ['Beige', 'Graphite'] }, { key: 'storage', values: ['256GB', '512GB'] }, { key: 'connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] }],
    95000, 110000, 20,
    { '{"color":"Graphite","storage":"512GB","connectivity":"Wi-Fi + Cellular"}': { price: 125000, stock: 8 } }
  );

  await upsertVariants(pMacBookPro._id, 'MBP14M3',
    [{ key: 'color', values: ['Space Black', 'Silver'] }, { key: 'ram', values: ['18GB', '36GB'] }, { key: 'storage', values: ['512GB SSD', '1TB SSD'] }],
    285000, 310000, 15,
    { '{"color":"Space Black","ram":"36GB","storage":"1TB SSD"}': { price: 380000, stock: 5 } }
  );

  await upsertVariants(pDellXPS._id, 'DELLXPS15',
    [{ key: 'ram', values: ['16GB', '32GB'] }, { key: 'storage', values: ['512GB SSD', '1TB SSD'] }],
    220000, 245000, 18
  );

  await upsertVariants(pAirPodsPro._id, 'APPRO2',
    [{ key: 'color', values: ['White'] }],
    32000, 36000, 80
  );

  await upsertVariants(pGalaxyBuds._id, 'GBUDS3PRO',
    [{ key: 'color', values: ['White', 'Silver', 'Twilight Blue'] }],
    22000, 25000, 60
  );

  await upsertVariants(pAppleWatch._id, 'AW9',
    [{ key: 'size', values: ['41mm', '45mm'] }, { key: 'color', values: ['Midnight', 'Starlight', 'Pink', 'Silver', 'Red'] }],
    55000, 62000, 35,
    { '{"size":"45mm","color":"Red"}': { price: 65000, stock: 10 } }
  );

  await upsertVariants(pGalaxyWatch._id, 'GW6CL',
    [{ key: 'size', values: ['43mm', '47mm'] }, { key: 'color', values: ['Black', 'Silver'] }],
    45000, 52000, 30
  );

  console.log('✓ All variants generated');

  // ─── Sample Order ──────────────────────────────────────────────────────────
  const firstVariant = await VariantModel.findOne({ product: pIphone15ProMax._id, isActive: true });
  if (firstVariant) {
    const existingOrder = await OrderModel.findOne({ user: user1._id });
    if (!existingOrder) {
      await OrderModel.create({
        orderNumber: generateOrderNumber(),
        user: user1._id,
        items: [{
          product: pIphone15ProMax._id,
          variant: firstVariant._id,
          vendor: vendor2._id,
          productSnapshot: { name: pIphone15ProMax.name, brand: pIphone15ProMax.brand, thumbnail: pIphone15ProMax.thumbnail, slug: pIphone15ProMax.slug },
          variantSnapshot: { sku: firstVariant.sku, options: Object.fromEntries(firstVariant.options) },
          unitPrice: 180000,
          quantity: 1,
          subtotal: 180000,
        }],
        shippingAddress: { fullName: 'Sakib Hossain', line1: 'House 12, Road 5', city: 'Dhaka', country: 'Bangladesh', phone: '01700000004' },
        subtotal: 180000,
        shippingFee: 0,
        tax: 9000,
        discount: 0,
        total: 189000,
        currency: 'BDT',
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'cod',
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
  console.log('Vendor: vendor1@zyromart.com / Vendor@1234');
  console.log('Vendor: vendor2@zyromart.com / Vendor@1234');
  console.log('User:   user1@zyromart.com   / User@1234');
  console.log('───────────────────────────');

  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
