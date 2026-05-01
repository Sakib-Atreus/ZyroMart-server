/**
 * Run: ts-node -e "require('./src/modules/users/seeders/seedAll').seed()"
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

export const seed = async () => {
  await mongoose.connect(config.db_url as string);
  console.log('Connected to DB. Seeding…');

  // ---------- Users ----------
  const [adminUser, vendorUser1, vendorUser2, user1] = await Promise.all([
    User.findOneAndUpdate(
      { email: 'admin@zyromart.com' },
      {
        name: 'Admin',
        email: 'admin@zyromart.com',
        password: await hash('Admin@1234'),
        phone: '01700000001',
        address: 'Dhaka, Bangladesh',
        role: 'admin',
        isLoggedIn: false,
        isDeleted: false,
      },
      { upsert: true, new: true },
    ),
    User.findOneAndUpdate(
      { email: 'vendor1@zyromart.com' },
      {
        name: 'TechZone BD',
        email: 'vendor1@zyromart.com',
        password: await hash('Vendor@1234'),
        phone: '01700000002',
        address: 'Dhaka, Bangladesh',
        role: 'vendor',
        isLoggedIn: false,
        isDeleted: false,
      },
      { upsert: true, new: true },
    ),
    User.findOneAndUpdate(
      { email: 'vendor2@zyromart.com' },
      {
        name: 'GadgetHub',
        email: 'vendor2@zyromart.com',
        password: await hash('Vendor@1234'),
        phone: '01700000003',
        address: 'Chittagong, Bangladesh',
        role: 'vendor',
        isLoggedIn: false,
        isDeleted: false,
      },
      { upsert: true, new: true },
    ),
    User.findOneAndUpdate(
      { email: 'user1@zyromart.com' },
      {
        name: 'Sakib Hossain',
        email: 'user1@zyromart.com',
        password: await hash('User@1234'),
        phone: '01700000004',
        address: 'Dhaka, Bangladesh',
        role: 'user',
        isLoggedIn: false,
        isDeleted: false,
      },
      { upsert: true, new: true },
    ),
  ]);
  console.log('Users seeded.');

  // ---------- Vendors ----------
  const [vendor1, vendor2] = await Promise.all([
    VendorModel.findOneAndUpdate(
      { user: vendorUser1._id },
      {
        user: vendorUser1._id,
        shopName: 'TechZone BD',
        slug: 'techzone-bd',
        description: 'Best tech products at affordable prices.',
        address: { line1: 'Mirpur 10', city: 'Dhaka', country: 'Bangladesh' },
        contact: { email: 'vendor1@zyromart.com', phone: '01700000002' },
        status: 'approved',
        commissionRate: 0.08,
        rating: 4.5,
      },
      { upsert: true, new: true },
    ),
    VendorModel.findOneAndUpdate(
      { user: vendorUser2._id },
      {
        user: vendorUser2._id,
        shopName: 'GadgetHub',
        slug: 'gadgethub',
        description: 'Premium gadgets and accessories.',
        address: { line1: 'Agrabad', city: 'Chittagong', country: 'Bangladesh' },
        contact: { email: 'vendor2@zyromart.com', phone: '01700000003' },
        status: 'approved',
        commissionRate: 0.1,
        rating: 4.2,
      },
      { upsert: true, new: true },
    ),
  ]);
  console.log('Vendors seeded.');

  // ---------- Categories ----------
  const [mobileCat, laptopCat, accessoryCat] = await Promise.all([
    CategoryModel.findOneAndUpdate(
      { slug: 'smartphones' },
      {
        name: 'Smartphones',
        slug: 'smartphones',
        icon: '📱',
        isActive: true,
        attributeSchema: [
          { key: 'color', label: 'Color', group: 'appearance', type: 'enum', options: ['Black', 'White', 'Blue', 'Red', 'Gold'], isVariantOption: true, filterable: true },
          { key: 'storage', label: 'Storage', group: 'specs', type: 'enum', options: ['64GB', '128GB', '256GB', '512GB'], isVariantOption: true, filterable: true },
          { key: 'ram', label: 'RAM', group: 'specs', type: 'enum', options: ['4GB', '6GB', '8GB', '12GB', '16GB'], isVariantOption: true, filterable: true },
          { key: 'display', label: 'Display', group: 'specs', type: 'string', filterable: false },
          { key: 'battery', label: 'Battery', group: 'specs', type: 'string', filterable: false },
        ],
      },
      { upsert: true, new: true },
    ),
    CategoryModel.findOneAndUpdate(
      { slug: 'laptops' },
      {
        name: 'Laptops',
        slug: 'laptops',
        icon: '💻',
        isActive: true,
        attributeSchema: [
          { key: 'color', label: 'Color', group: 'appearance', type: 'enum', options: ['Silver', 'Space Gray', 'Black', 'White'], isVariantOption: true, filterable: true },
          { key: 'storage', label: 'Storage', group: 'specs', type: 'enum', options: ['256GB SSD', '512GB SSD', '1TB SSD'], isVariantOption: true, filterable: true },
          { key: 'ram', label: 'RAM', group: 'specs', type: 'enum', options: ['8GB', '16GB', '32GB'], isVariantOption: true, filterable: true },
        ],
      },
      { upsert: true, new: true },
    ),
    CategoryModel.findOneAndUpdate(
      { slug: 'accessories' },
      {
        name: 'Accessories',
        slug: 'accessories',
        icon: '🎧',
        isActive: true,
        attributeSchema: [
          { key: 'color', label: 'Color', group: 'appearance', type: 'enum', options: ['Black', 'White', 'Red', 'Blue'], isVariantOption: true, filterable: true },
        ],
      },
      { upsert: true, new: true },
    ),
  ]);
  console.log('Categories seeded.');

  // ---------- Products ----------
  const [p1, p2, p3] = await Promise.all([
    ProductModel.findOneAndUpdate(
      { slug: 'samsung-galaxy-s24-ultra' },
      {
        vendor: vendor1._id,
        category: mobileCat._id,
        name: 'Samsung Galaxy S24 Ultra',
        slug: 'samsung-galaxy-s24-ultra',
        brand: 'Samsung',
        description: 'The ultimate Galaxy experience with S Pen and AI features.',
        shortDescription: 'Flagship Samsung with S Pen',
        images: ['https://images.samsung.com/is/image/samsung/p6pim/uk/2401/gallery/uk-galaxy-s24-ultra-s928-sm-s928bzageub-thumb-539573029.jpg'],
        thumbnail: 'https://images.samsung.com/is/image/samsung/p6pim/uk/2401/gallery/uk-galaxy-s24-ultra-s928-sm-s928bzageub-thumb-539573029.jpg',
        basePrice: 145000,
        compareAtPrice: 160000,
        currency: 'BDT',
        hasVariants: true,
        variantOptions: [
          { key: 'color', label: 'Color', values: ['Black', 'White', 'Gold'] },
          { key: 'storage', label: 'Storage', values: ['256GB', '512GB'] },
        ],
        attributes: new Map([['display', '6.8" Dynamic AMOLED 2X'], ['battery', '5000mAh']]),
        tags: ['smartphone', 'flagship', 'samsung', '5g', 'spen'],
        status: 'approved',
        totalSold: 120,
        averageRating: 4.7,
        reviewCount: 45,
        isOnlineExclusive: true,
        emiOptions: [
          { months: 6, monthlyRate: 0.01, minAmount: 100000 },
          { months: 12, monthlyRate: 0.012, minAmount: 100000 },
        ],
      },
      { upsert: true, new: true },
    ),
    ProductModel.findOneAndUpdate(
      { slug: 'iphone-15-pro-max' },
      {
        vendor: vendor2._id,
        category: mobileCat._id,
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        brand: 'Apple',
        description: 'Apple iPhone 15 Pro Max with titanium design and A17 Pro chip.',
        shortDescription: 'Apple flagship with titanium frame',
        images: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium.jpg'],
        thumbnail: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium.jpg',
        basePrice: 180000,
        compareAtPrice: 195000,
        currency: 'BDT',
        hasVariants: true,
        variantOptions: [
          { key: 'color', label: 'Color', values: ['Black', 'White', 'Blue', 'Gold'] },
          { key: 'storage', label: 'Storage', values: ['256GB', '512GB', '1TB'] },
        ],
        attributes: new Map([['display', '6.7" Super Retina XDR OLED'], ['battery', '4422mAh']]),
        tags: ['iphone', 'apple', 'flagship', '5g', 'smartphone'],
        status: 'approved',
        totalSold: 200,
        averageRating: 4.9,
        reviewCount: 88,
        isOnlineExclusive: true,
        emiOptions: [
          { months: 12, monthlyRate: 0.011, minAmount: 100000 },
          { months: 24, monthlyRate: 0.013, minAmount: 100000 },
        ],
      },
      { upsert: true, new: true },
    ),
    ProductModel.findOneAndUpdate(
      { slug: 'macbook-pro-14-m3' },
      {
        vendor: vendor1._id,
        category: laptopCat._id,
        name: 'MacBook Pro 14" M3',
        slug: 'macbook-pro-14-m3',
        brand: 'Apple',
        description: 'MacBook Pro with M3 chip — fastest Mac laptop ever.',
        shortDescription: 'Apple M3 powered laptop',
        images: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-spacegray-select-202310.jpg'],
        thumbnail: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-spacegray-select-202310.jpg',
        basePrice: 250000,
        compareAtPrice: 270000,
        currency: 'BDT',
        hasVariants: true,
        variantOptions: [
          { key: 'color', label: 'Color', values: ['Space Gray', 'Silver'] },
          { key: 'ram', label: 'RAM', values: ['8GB', '16GB', '32GB'] },
          { key: 'storage', label: 'Storage', values: ['512GB SSD', '1TB SSD'] },
        ],
        attributes: new Map([['display', '14.2" Liquid Retina XDR'], ['battery', '70Wh']]),
        tags: ['macbook', 'apple', 'laptop', 'm3', 'pro'],
        status: 'approved',
        totalSold: 55,
        averageRating: 4.8,
        reviewCount: 30,
        emiOptions: [
          { months: 12, monthlyRate: 0.012, minAmount: 200000 },
          { months: 24, monthlyRate: 0.014, minAmount: 200000 },
        ],
      },
      { upsert: true, new: true },
    ),
  ]);
  console.log('Products seeded.');

  // ---------- Variants ----------
  await VariantModel.findOneAndUpdate(
    { sku: 'SGS24U-BLK-256' },
    {
      product: p1._id,
      sku: 'SGS24U-BLK-256',
      options: new Map([['color', 'Black'], ['storage', '256GB']]),
      price: 145000,
      compareAtPrice: 160000,
      stock: 50,
      reservedStock: 0,
      images: [],
      isActive: true,
    },
    { upsert: true, new: true },
  );

  await VariantModel.findOneAndUpdate(
    { sku: 'IP15PM-BLK-256' },
    {
      product: p2._id,
      sku: 'IP15PM-BLK-256',
      options: new Map([['color', 'Black'], ['storage', '256GB']]),
      price: 180000,
      compareAtPrice: 195000,
      stock: 30,
      reservedStock: 0,
      images: [],
      isActive: true,
    },
    { upsert: true, new: true },
  );

  await VariantModel.findOneAndUpdate(
    { sku: 'MBP14M3-SG-8GB-512' },
    {
      product: p3._id,
      sku: 'MBP14M3-SG-8GB-512',
      options: new Map([['color', 'Space Gray'], ['ram', '8GB'], ['storage', '512GB SSD']]),
      price: 250000,
      compareAtPrice: 270000,
      stock: 20,
      reservedStock: 0,
      images: [],
      isActive: true,
    },
    { upsert: true, new: true },
  );
  console.log('Variants seeded.');

  // ---------- Sample Order ----------
  const existingOrder = await OrderModel.findOne({ user: user1._id });
  if (!existingOrder) {
    await OrderModel.create({
      orderNumber: generateOrderNumber(),
      user: user1._id,
      items: [
        {
          product: p1._id,
          variant: (await VariantModel.findOne({ sku: 'SGS24U-BLK-256' }))!._id,
          vendor: vendor1._id,
          productSnapshot: { name: p1.name, brand: p1.brand, thumbnail: p1.thumbnail, slug: p1.slug },
          variantSnapshot: { sku: 'SGS24U-BLK-256', options: { color: 'Black', storage: '256GB' } },
          unitPrice: 145000,
          quantity: 1,
          subtotal: 145000,
        },
      ],
      shippingAddress: {
        fullName: 'Sakib Hossain',
        line1: 'House 12, Road 5',
        city: 'Dhaka',
        country: 'Bangladesh',
        phone: '01700000004',
      },
      subtotal: 145000,
      shippingFee: 60,
      tax: 7250,
      discount: 0,
      total: 152310,
      currency: 'BDT',
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'cod',
      statusHistory: [
        { status: 'pending', at: new Date(Date.now() - 7 * 86400000) },
        { status: 'paid', at: new Date(Date.now() - 6 * 86400000) },
        { status: 'processing', at: new Date(Date.now() - 5 * 86400000) },
        { status: 'shipped', at: new Date(Date.now() - 3 * 86400000) },
        { status: 'delivered', at: new Date(Date.now() - 1 * 86400000) },
      ],
      placedAt: new Date(Date.now() - 7 * 86400000),
      paidAt: new Date(Date.now() - 6 * 86400000),
      deliveredAt: new Date(Date.now() - 1 * 86400000),
    });
    console.log('Sample order seeded.');
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Test credentials:');
  console.log('  Admin:  admin@zyromart.com  / Admin@1234');
  console.log('  Vendor: vendor1@zyromart.com / Vendor@1234');
  console.log('  Vendor: vendor2@zyromart.com / Vendor@1234');
  console.log('  User:   user1@zyromart.com  / User@1234');

  await mongoose.disconnect();
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
