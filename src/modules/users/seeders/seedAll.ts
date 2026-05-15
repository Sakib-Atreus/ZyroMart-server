/**
 * Full seed — users, vendors, categories, products (all types/variants), orders.
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
          product: productId, sku: skuFull,
          options: new Map(Object.entries(combo)),
          optionsHash: Object.entries(combo).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|'),
          price, compareAtPrice: Math.round(price * 1.15),
          stock: baseStock, reservedStock: 0, isActive: true,
        },
        upsert: true,
      },
    };
  });
  if (ops.length) await VariantModel.bulkWrite(ops);
};

// ─── Attribute schemas ────────────────────────────────────────────────────────
const PHONE_ATTRS = [
  { key: 'os', label: 'OS', group: 'General', type: 'enum' as const, options: ['Android', 'iOS', 'HarmonyOS'], required: true, filterable: true },
  { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Blue', 'Gold', 'Green', 'Silver', 'Titanium'], isVariantOption: true, filterable: true },
  { key: 'storage', label: 'Storage', group: 'Performance', type: 'enum' as const, options: ['64GB', '128GB', '256GB', '512GB', '1TB'], isVariantOption: true, filterable: true },
  { key: 'ram', label: 'RAM', group: 'Performance', type: 'enum' as const, options: ['4GB', '6GB', '8GB', '12GB'], filterable: true },
  { key: 'processor', label: 'Processor', group: 'Performance', type: 'string' as const },
  { key: 'display', label: 'Display', group: 'Display', type: 'string' as const },
  { key: 'displaySize', label: 'Display Size', group: 'Display', type: 'string' as const, unit: 'inches' },
  { key: 'rearCamera', label: 'Rear Camera', group: 'Camera', type: 'string' as const },
  { key: 'battery', label: 'Battery', group: 'Battery', type: 'string' as const, unit: 'mAh' },
  { key: 'network', label: 'Network', group: 'Connectivity', type: 'enum' as const, options: ['4G', '5G'], filterable: true },
  { key: 'nfc', label: 'NFC', group: 'Connectivity', type: 'enum' as const, options: ['Yes', 'No'], filterable: true },
];
const MAC_ATTRS = [
  { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Space Black', 'Silver', 'Midnight', 'Starlight', 'Sky Blue'], isVariantOption: true, filterable: true },
  { key: 'ram', label: 'Unified Memory', group: 'Performance', type: 'enum' as const, options: ['8GB', '16GB', '24GB', '36GB'], isVariantOption: true, filterable: true },
  { key: 'storage', label: 'Storage', group: 'Performance', type: 'enum' as const, options: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'], isVariantOption: true, filterable: true },
  { key: 'processor', label: 'Chip', group: 'Performance', type: 'string' as const },
  { key: 'display', label: 'Display', group: 'Display', type: 'string' as const },
  { key: 'displaySize', label: 'Display Size', group: 'Display', type: 'string' as const, unit: 'inches' },
  { key: 'battery', label: 'Battery', group: 'Battery', type: 'string' as const },
  { key: 'os', label: 'OS', group: 'General', type: 'string' as const },
];
const TABLET_ATTRS = [
  { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'Silver', 'Gold', 'Space Gray', 'Blue', 'Purple', 'Starlight'], isVariantOption: true, filterable: true },
  { key: 'storage', label: 'Storage', group: 'Performance', type: 'enum' as const, options: ['64GB', '128GB', '256GB', '512GB', '1TB'], isVariantOption: true, filterable: true },
  { key: 'connectivity', label: 'Connectivity', group: 'General', type: 'enum' as const, options: ['Wi-Fi', 'Wi-Fi + Cellular'], isVariantOption: true, filterable: true },
  { key: 'processor', label: 'Processor', group: 'Performance', type: 'string' as const },
  { key: 'display', label: 'Display', group: 'Display', type: 'string' as const },
  { key: 'displaySize', label: 'Display Size', group: 'Display', type: 'string' as const, unit: 'inches' },
  { key: 'battery', label: 'Battery', group: 'Battery', type: 'string' as const, unit: 'mAh' },
];
const AUDIO_ATTRS = [
  { key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Silver', 'Midnight', 'Beige'], isVariantOption: true, filterable: true },
  { key: 'anc', label: 'ANC', group: 'Features', type: 'enum' as const, options: ['Yes', 'No'], filterable: true },
  { key: 'connectivity', label: 'Connectivity', group: 'Connectivity', type: 'enum' as const, options: ['Bluetooth 5.0', 'Bluetooth 5.3', 'Bluetooth 5.4', 'Wired'], filterable: true },
  { key: 'battery', label: 'Battery Life', group: 'Battery', type: 'string' as const },
  { key: 'waterproof', label: 'Water Resistance', group: 'Features', type: 'enum' as const, options: ['IPX4', 'IPX5', 'IP67', 'None'], filterable: true },
];
const WATCH_ATTRS = [
  { key: 'color', label: 'Case Color', group: 'Design', type: 'enum' as const, options: ['Black', 'Silver', 'Gold', 'Titanium', 'Pink', 'Rose Gold'], isVariantOption: true, filterable: true },
  { key: 'size', label: 'Case Size', group: 'Design', type: 'enum' as const, options: ['40mm', '41mm', '42mm', '44mm', '45mm', '46mm', '49mm'], isVariantOption: true, filterable: true },
  { key: 'os', label: 'Platform', group: 'General', type: 'enum' as const, options: ['watchOS', 'Wear OS', 'RTOS'], filterable: true },
  { key: 'battery', label: 'Battery Life', group: 'Battery', type: 'string' as const },
  { key: 'waterproof', label: 'Water Resistance', group: 'Features', type: 'string' as const },
  { key: 'gps', label: 'GPS', group: 'Features', type: 'enum' as const, options: ['Yes', 'No'], filterable: true },
];

// ─── CDN images (gadgetandgear.com — confirmed real product images) ───────────
const CDN = 'https://assets.gadgetandgear.com/upload/media/';
const I = {
  // Samsung phones
  s26U256:  CDN + 'Samsung%20Galaxy%20S26%20Ultra%20(12/256GB)/samsung-galaxy-s26-ultra-1772347558401.jpeg',
  s26U512:  CDN + 'Samsung%20Galaxy%20S26%20Ultra%20(12/512GB)/samsung-galaxy-s26-ultra-12gb-512gb.jpeg',
  s26Plus:  CDN + 'Galaxy%20S26%20Plus/galaxy-s26-plus.jpeg',
  s26Std:   CDN + 'Samsung%20Galaxy%20S26%20(12/256GB)/samsung-galaxy-s26.jpeg-1.jpeg',
  s25Fe:    CDN + 'samsung-galaxy-s25-fe-black881.jpeg',
  a56Olive: CDN + 'galaxy-a56-5g-12gb-256gb-olive181.jpeg',
  // Apple iPhone
  ip17Max:  CDN + 'Offer%20Gift/iphone-17-pro-max-cosmic-orange565-1771129691561.jpeg',
  ip17Pro:  CDN + 'Offer%20Gift/iphone-17-pro-deep-blue238-1771129631326.jpeg',
  ip17:     CDN + 'Offer%20Gift/apple-iphone-17-mist-blue877-1771129124028.jpeg',
  ipAir:    CDN + 'iphone-air-space-black565.jpeg',
  ip16:     CDN + 'iphone-16-128gb-teal.jpeg',
  ip16e:    CDN + 'iphone-16e-white803.jpeg',
  // MacBook
  mbProBlk: CDN + 'apple/macbook-pro-m5-pro-chip-14-inch.jpeg',
  mbProSlv: CDN + 'apple/macbook-pro-m5-pro-chip-14-inch-silver.jpeg',
  mbAirStar: CDN + 'apple/macbook-air-m5-15-inch-starlight-1.jpeg',
  mbAirMid: CDN + 'apple/macbook-air-m5-15-inch-midnight-1-1775365043486.jpeg',
  mbAirSky: CDN + 'apple/macbook-air-m5-15-inch-sky-blue-1.jpeg',
  mbAirSlv: CDN + 'apple/macbook-air-m5-15-inch-silver-1.jpeg',
  mbNeoInd: CDN + 'apple/macbook-neo-indigo.jpeg',
  // iPad
  ipadPro11Slv: CDN + 'Offer%20Gift/ipad-pro-11-inch-wifi-m5-chip-silver-1318-1771132991873.jpeg',
  ipadPro11Blk: CDN + 'Offer%20Gift/ipad-pro-11-inch-wifi-m5-chip-spece-black32-1771130457479.jpeg',
  ipadAirGrey:  CDN + 'apple/ipad-air-11-inch-wifi-m4-chip-space-grey.jpeg',
  ipadAirPurp:  CDN + 'apple/ipad-air-11-inch-wifi-m4-chip-purple.jpeg',
  ipadAirStar:  CDN + 'apple/ipad-air-11-inch-wifi-m4-chip-starlight.jpeg',
  ipadMini7:    CDN + 'ipad-mini-7-wifi-128gb-space-gray114.jpeg',
  ipad11Blue:   CDN + 'Offer%20Gift/ipad-11-inch-wifi-a16-11th-gen300-1774330981890.jpeg',
  ipad11Slv:    CDN + 'ipad-11-inch-wifi-a16-11th-gen-256gb-silver163.jpeg',
  // Apple Watch
  awS11Rose: CDN + 'apple-watch-series-11-rose-gold-1520.jpeg',
  aw10Blk:   CDN + 'apple-watch-10-jet-black-46mm.jpeg',
  aw10Slv:   CDN + 'apple-watch-10--46mm-silver-aluminum.jpeg',
  aw10Rose:  CDN + 'apple-watch-10-rose-gold-42mm.jpeg',
  awSE3:     CDN + 'apple-watch-se-3-starlight51.jpeg',
  awUltra3:  CDN + 'apple-watch-ultra-3-black-1966.jpeg',
  // Samsung Watch
  gw8Blk:   CDN + 'galaxy-watch-8-classic-black650.jpeg',
  gw8:      CDN + 'samsung-galaxy-watch-8563.jpeg',
  gw7:      CDN + 'samsung-galaxy-watch-7-smart-watch695.jpeg',
  gwUltra:  CDN + 'galaxy-watch-ultra-2025806.jpeg',
  // AirPods
  airPro3:  CDN + 'airpods-pro-3-1411.jpeg',
  air4Anc:  CDN + 'airpods-4-with-active-noise-cancellation-5.jpeg',
  air4:     CDN + 'airpods-4.jpeg',
  airMaxMid: CDN + 'apple-airpods/airpods-max-2-midnight.jpeg',
  buds4Pro: CDN + 'Samsung%20Galaxy%20Buds%204%20Pro/samsung-galaxy-buds-4-pro.jpeg',
  // Headphones & Speakers
  sonyXM6:  CDN + 'sony-wh-1000xm6-wirerless-headphones-blue-2893.jpeg',
  boseQCU:  CDN + 'bose-quietcomfort-ultra-headphones-2nd-gen826.jpeg',
  marshMon: CDN + 'marshall-monitor-iii-anc-headphone485.jpeg',
  jblOTG2:  CDN + 'JBL%20PartyBox%20On-the-Go%202%20Speaker/jbl-partybox-on-the-go-2-portable-speaker-4.jpeg',
  jblBB4:   CDN + 'jbl-boombox-4-black3.jpeg',
  marshKil: CDN + 'marshall-kilburn-iii-portable-speaker98.jpeg',
  boseSL:   CDN + 'bose-soundlink-home-bluetooth-speaker-warm-wood582.jpeg',
  sonyUlt:  CDN + 'sony-srs-ult50-portable-wireless-speaker725.jpeg',
  // PC & Gaming
  logM240:  CDN + 'logitech-m240-silent-bluetooth-mouse-graphite.jpeg',
  logErgo:  CDN + 'logitech/logitech-ergo-series-lift-vertical-ergonomic-mouse-2.jpeg',
  appleTP:  CDN + 'Apple%20Magic%20Multi-Touch%20Surface%20USB-C%20Trackpad/apple-magic-multi%E2%80%91touch-surface-usb%E2%80%91c-trackpad-2.jpeg',
  logG733:  CDN + 'Logitech%20G733%20LIGHTSPEED%20Wireless%20RGB%20Gaming%20Headset/logitech-g733-lightspeed-gaming-headset-1770713024484.jpeg',
  logG321:  CDN + 'Logitech%20G321%20LIGHTSPEED%20Wireless%20Gaming%20Headset/logitch-g321-lightspeed-gaming-headset.jpeg',
  razerBW:  CDN + 'razer/razer-blackwidow-x-tenkeyless-gaming-keyboard.jpeg',
  // Power Banks
  blk20k:   CDN + 'belkin-20000mah-3-port-laptop-power-bank.jpeg',
  blk10k:   CDN + 'belkin-power-bank-10k-with-integrated-cable383.jpeg',
  blkQi:    CDN + 'belkin-qi2-10000mah-magnetic-power-bank-1.jpeg',
  skross20: CDN + 'skross-reload-20-pd-100w-power-bank247.jpeg',
  skross10: CDN + 'skross-reload-10-power-bank498.jpeg',
  meko20:   CDN + 'meko-m20s-20000mah-power-bank928.jpeg',
  // Routers
  tpX50:    CDN + 'tp-link-deco-x50-router977.jpeg',
  tpX503p:  CDN + 'tp-link-deco-x50-router-3-pack739.jpeg',
  tpX20:    CDN + 'tp-link/tp-link-deco-x20-ax1800-mesh-wi-fi-router-2.jpeg',
  tpAX73:   CDN + 'tp-link-archer-ax73-dual-band-gigabit-router525.jpeg',
  tpS7:     CDN + 'tp-link-deco-s7-router-new.jpg-new658.jpeg',
  // Cases
  spUH:     CDN + 'Spigen%20Ultra%20Hybrid%20MagFit%20Case%20for%20Galaxy%20S26%20Ultra/spigen-ultra-hyrbird-magfit-case-for-galaxy-s26-ultra-1.jpeg',
  spTA:     CDN + 'Spigen%20Tough%20Armor%20(MagFit)%20Case%20for%20Galaxy%20S26%20Ultra/spigen-tough-armor-magfit-case-for-galaxy-s26-ultra.jpeg',
  torOS:    CDN + 'TORRAS%20Ostand%20Slim%20Case%20for%20Galaxy%20S26%20Ultra/torras-ostand-slim-case-for-galaxy-s26-ultra.jpeg',
  uagP:     CDN + 'UAG%20Plyo%20MagSafe%20Case%20for%20Galaxy%20S26%20Ultra/uag-plyo-magsafe-case-for-galaxy-s26-ultra.jpeg',
  pitRed:   CDN + 'pitaka-edge-ultra-slim-case-for-iphone-17-pro-red354.jpeg',
  pitGrn:   CDN + 'pitaka-edge-ultra-slim-case-for-iphone-17-pro-1766.jpeg',
  // Camera & Drone
  djiNano:  CDN + 'dji-osmo-nano-action-camera122.jpeg',
  djiAct5:  CDN + 'dji-osmo-action-5-pro-adventure-combo.jpeg',
  djiMob8:  CDN + 'dji-osmo-mobile-8328.jpeg',
  insta360: CDN + 'insta360-x5-essentials-bundle-action-camera673.jpeg',
  djiMini5: CDN + 'dji-mini-5-pro-fly-more-combo-plus-with-rc2110.jpeg',
  djiNeo2:  CDN + 'dji-neo-2-fly-more-combo-drone-4793.jpeg',
  djiAvata: CDN + 'dji/dji-avata-360-fly-more-combo-2.jpeg',
  djiFlip:  CDN + 'dji-flip-rc-n3-standard-drone442.jpeg',
  djiMini3: CDN + 'dji-mini-3-fly-more-combo-drone895.jpeg',
  // Gadget
  xiaomiCam: CDN + 'xiaomi-smart-camera-c301585.jpeg',
  djiMob7:  CDN + 'dji-osmo-mobile-7-gimbal-1768.jpeg',
};

// ─── EMI presets (monthlyRate = flat monthly rate, e.g. 0.0075 = 0.75%/mo) ───
const EMI_MID     = [{ months: 6, monthlyRate: 0, minAmount: 5000 }, { months: 12, monthlyRate: 0.0075, minAmount: 10000 }];
const EMI_HIGH    = [{ months: 6, monthlyRate: 0, minAmount: 10000 }, { months: 12, monthlyRate: 0.0075, minAmount: 15000 }, { months: 18, monthlyRate: 0.01, minAmount: 20000 }];
const EMI_PREMIUM = [{ months: 6, monthlyRate: 0, minAmount: 20000 }, { months: 12, monthlyRate: 0.0075, minAmount: 20000 }, { months: 18, monthlyRate: 0.01, minAmount: 30000 }];

export const seed = async () => {
  await mongoose.connect(config.db_url as string);
  console.log('Connected. Seeding…');

  // ─── Users ──────────────────────────────────────────────────────────────────
  const [adminUser, vendorUser1, vendorUser2, user1] = await Promise.all([
    User.findOneAndUpdate({ email: 'admin@zyromart.com' },
      { name: 'Admin', email: 'admin@zyromart.com', password: await hash('Admin@1234'), phone: '01700000001', address: 'Dhaka', role: 'admin', isLoggedIn: false, isDeleted: false },
      { upsert: true, new: true }),
    User.findOneAndUpdate({ email: 'vendor1@zyromart.com' },
      { name: 'TechZone BD', email: 'vendor1@zyromart.com', password: await hash('Vendor@1234'), phone: '01700000002', address: 'Dhaka', role: 'vendor', isLoggedIn: false, isDeleted: false },
      { upsert: true, new: true }),
    User.findOneAndUpdate({ email: 'vendor2@zyromart.com' },
      { name: 'GadgetHub', email: 'vendor2@zyromart.com', password: await hash('Vendor@1234'), phone: '01700000003', address: 'Chittagong', role: 'vendor', isLoggedIn: false, isDeleted: false },
      { upsert: true, new: true }),
    User.findOneAndUpdate({ email: 'user1@zyromart.com' },
      { name: 'Sakib Hossain', email: 'user1@zyromart.com', password: await hash('User@1234'), phone: '01700000004', address: 'Dhaka', role: 'user', isLoggedIn: false, isDeleted: false },
      { upsert: true, new: true }),
  ]);
  console.log('✓ Users');

  // ─── Vendors ────────────────────────────────────────────────────────────────
  const [vendor1, vendor2] = await Promise.all([
    VendorModel.findOneAndUpdate({ user: vendorUser1._id },
      { user: vendorUser1._id, shopName: 'TechZone BD', slug: 'techzone-bd', description: 'Best tech at affordable prices.', address: { line1: 'Mirpur 10', city: 'Dhaka', country: 'Bangladesh' }, contact: { email: 'vendor1@zyromart.com', phone: '01700000002' }, status: 'approved', commissionRate: 0.08, rating: 4.5 },
      { upsert: true, new: true }),
    VendorModel.findOneAndUpdate({ user: vendorUser2._id },
      { user: vendorUser2._id, shopName: 'GadgetHub', slug: 'gadgethub', description: 'Premium gadgets and accessories.', address: { line1: 'Agrabad', city: 'Chittagong', country: 'Bangladesh' }, contact: { email: 'vendor2@zyromart.com', phone: '01700000003' }, status: 'approved', commissionRate: 0.10, rating: 4.2 },
      { upsert: true, new: true }),
  ]);
  console.log('✓ Vendors');

  await Promise.all([CategoryModel.deleteMany({}), ProductModel.deleteMany({}), VariantModel.deleteMany({}), OrderModel.deleteMany({})]);
  console.log('✓ Cleared old data');

  // ─── Parent Categories ───────────────────────────────────────────────────────
  const [phonesCat, macCat, phoneAccCat, tabletsCat, casesCat, watchesCat, audiosCat, pcAccCat, cameraCat, gadgetCat, networkingCat, gamingCat, droneCat] = await Promise.all([
    CategoryModel.findOneAndUpdate({ slug: 'phones' }, { name: 'Phones', slug: 'phones', icon: '📱', isActive: true, isFeatured: true, sortOrder: 1, parent: null, attributeSchema: PHONE_ATTRS }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'mac' }, { name: 'Mac', slug: 'mac', icon: '💻', isActive: true, isFeatured: false, sortOrder: 2, parent: null, attributeSchema: MAC_ATTRS }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'phone-accessories' }, { name: 'Phone Accessories', slug: 'phone-accessories', icon: '🔌', isActive: true, isFeatured: false, sortOrder: 3, parent: null, attributeSchema: [{ key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Silver'], isVariantOption: true, filterable: true }, { key: 'type', label: 'Type', group: 'General', type: 'string' as const }] }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'tablets' }, { name: 'Tablets', slug: 'tablets', icon: '📱', isActive: true, isFeatured: true, sortOrder: 4, parent: null, attributeSchema: TABLET_ATTRS }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'cases-protectors' }, { name: 'Cases & Protectors', slug: 'cases-protectors', icon: '🛡️', isActive: true, isFeatured: true, sortOrder: 5, parent: null, attributeSchema: [{ key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'Clear', 'Blue', 'Pink'], isVariantOption: true, filterable: true }, { key: 'compatibility', label: 'Compatible With', group: 'General', type: 'string' as const }] }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'watches' }, { name: 'Watches', slug: 'watches', icon: '⌚', isActive: true, isFeatured: true, sortOrder: 6, parent: null, attributeSchema: WATCH_ATTRS }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'headphone-speaker' }, { name: 'Headphone & Speaker', slug: 'headphone-speaker', icon: '🎧', isActive: true, isFeatured: false, sortOrder: 7, parent: null, attributeSchema: AUDIO_ATTRS }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'pc-accessories' }, { name: 'PC Accessories', slug: 'pc-accessories', icon: '🖥️', isActive: true, isFeatured: false, sortOrder: 8, parent: null, attributeSchema: [{ key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Silver', 'Gray'], isVariantOption: true, filterable: true }, { key: 'connectivity', label: 'Connectivity', group: 'Connectivity', type: 'string' as const }] }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'camera' }, { name: 'Camera', slug: 'camera', icon: '📷', isActive: true, isFeatured: true, sortOrder: 9, parent: null, attributeSchema: [{ key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'Silver'], isVariantOption: true, filterable: true }, { key: 'type', label: 'Type', group: 'General', type: 'enum' as const, options: ['Action Camera', 'Gimbal', '360 Camera', 'Smart Camera'] }, { key: 'video', label: 'Max Video', group: 'Specs', type: 'string' as const }] }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'gadget' }, { name: 'Gadget', slug: 'gadget', icon: '🔧', isActive: true, isFeatured: false, sortOrder: 10, parent: null, attributeSchema: [{ key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Silver'], isVariantOption: true, filterable: true }, { key: 'type', label: 'Type', group: 'General', type: 'string' as const }] }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'networking' }, { name: 'Networking', slug: 'networking', icon: '📡', isActive: true, isFeatured: false, sortOrder: 11, parent: null, attributeSchema: [{ key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White'], isVariantOption: true, filterable: true }, { key: 'speed', label: 'Speed', group: 'Specs', type: 'string' as const }, { key: 'band', label: 'Band', group: 'Specs', type: 'string' as const }] }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'gaming' }, { name: 'Gaming', slug: 'gaming', icon: '🎮', isActive: true, isFeatured: true, sortOrder: 12, parent: null, attributeSchema: [{ key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Blue', 'Purple'], isVariantOption: true, filterable: true }, { key: 'connectivity', label: 'Connectivity', group: 'Connectivity', type: 'string' as const }] }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'drone' }, { name: 'Drone', slug: 'drone', icon: '🚁', isActive: true, isFeatured: true, sortOrder: 13, parent: null, attributeSchema: [{ key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Gray', 'Black', 'White'], isVariantOption: true, filterable: true }, { key: 'camera', label: 'Camera', group: 'Specs', type: 'string' as const }, { key: 'flightTime', label: 'Flight Time', group: 'Specs', type: 'string' as const, unit: 'min' }] }, { upsert: true, new: true }),
  ]);
  console.log('✓ Parent categories (13)');

  // ─── Sub-categories ──────────────────────────────────────────────────────────
  const [macbookCat, ipadCat, earbudsCat, speakerCat, routerCat, powerBankCat] = await Promise.all([
    CategoryModel.findOneAndUpdate({ slug: 'macbook' }, { name: 'MacBook', slug: 'macbook', icon: '💻', isActive: true, isFeatured: true, sortOrder: 1, parent: macCat._id, attributeSchema: MAC_ATTRS }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'ipad' }, { name: 'iPad', slug: 'ipad', icon: '📱', isActive: true, isFeatured: true, sortOrder: 1, parent: tabletsCat._id, attributeSchema: TABLET_ATTRS }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'earbuds' }, { name: 'Earbuds', slug: 'earbuds', icon: '🎧', isActive: true, isFeatured: true, sortOrder: 1, parent: audiosCat._id, attributeSchema: AUDIO_ATTRS }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'speaker' }, { name: 'Speaker', slug: 'speaker', icon: '🔊', isActive: true, isFeatured: true, sortOrder: 2, parent: audiosCat._id, attributeSchema: AUDIO_ATTRS }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'router' }, { name: 'Router', slug: 'router', icon: '📡', isActive: true, isFeatured: true, sortOrder: 1, parent: networkingCat._id, attributeSchema: [{ key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White'], isVariantOption: true, filterable: true }, { key: 'standard', label: 'Wi-Fi Standard', group: 'Specs', type: 'string' as const }, { key: 'speed', label: 'Speed', group: 'Specs', type: 'string' as const }] }, { upsert: true, new: true }),
    CategoryModel.findOneAndUpdate({ slug: 'power-bank' }, { name: 'Power Bank', slug: 'power-bank', icon: '🔋', isActive: true, isFeatured: true, sortOrder: 2, parent: phoneAccCat._id, attributeSchema: [{ key: 'color', label: 'Color', group: 'Design', type: 'enum' as const, options: ['Black', 'White', 'Silver', 'Blue'], isVariantOption: true, filterable: true }, { key: 'capacity', label: 'Capacity', group: 'Specs', type: 'enum' as const, options: ['5000mAh', '10000mAh', '20000mAh', '30000mAh'], isVariantOption: true, filterable: true }] }, { upsert: true, new: true }),
  ]);
  console.log('✓ Sub-categories (6)');

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCTS
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Samsung Galaxy S26 Ultra — phones | color × storage variants
  const s26ultra = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-s26-ultra' }, {
    vendor: vendor1._id, category: phonesCat._id,
    name: 'Samsung Galaxy S26 Ultra', slug: 'samsung-galaxy-s26-ultra', brand: 'Samsung',
    description: 'Samsung Galaxy S26 Ultra features Snapdragon 8 Elite, a 200MP quad camera, built-in S Pen, and a 6.9" Dynamic AMOLED 2X display with titanium frame.',
    shortDescription: 'Samsung flagship with S Pen, 200MP camera, and titanium design.',
    images: [I.s26U256, I.s26U512, I.s26Plus, I.s26Std, I.s25Fe],
    thumbnail: I.s26U256,
    basePrice: 199999, compareAtPrice: 220000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Black', 'Silver', 'White'] },
      { key: 'storage', label: 'Storage', values: ['256GB', '512GB'] },
    ],
    attributes: new Map([['os', 'Android'], ['processor', 'Snapdragon 8 Elite'], ['ram', '12GB'], ['display', 'Dynamic AMOLED 2X'], ['displaySize', '6.9'], ['rearCamera', '200MP + 50MP + 10MP + 10MP'], ['battery', '5000'], ['network', '5G'], ['nfc', 'Yes']]),
    tags: ['samsung', 's26', 'ultra', '5g', 'flagship', 'spen'],
    warranty: '1 Year Official Warranty', status: 'approved', isOnlineExclusive: true,
    totalSold: 210, averageRating: 4.8, reviewCount: 86, emiOptions: EMI_PREMIUM,
  }, { upsert: true, new: true });
  await upsertVariants(s26ultra._id, 'S26U',
    [{ key: 'color', values: ['Black', 'Silver', 'White'] }, { key: 'storage', values: ['256GB', '512GB'] }],
    199999, { 'Black+512GB': 224999, 'Silver+512GB': 224999, 'White+512GB': 224999 });

  // 2. Apple iPhone 17 Pro Max — phones | color × storage variants
  const ip17pm = await ProductModel.findOneAndUpdate({ slug: 'apple-iphone-17-pro-max' }, {
    vendor: vendor2._id, category: phonesCat._id,
    name: 'Apple iPhone 17 Pro Max', slug: 'apple-iphone-17-pro-max', brand: 'Apple',
    description: 'iPhone 17 Pro Max with A19 Pro chip, a breakthrough titanium design, 48MP Fusion camera with 5x optical zoom, and USB-C 3.2.',
    shortDescription: 'Apple\'s most powerful iPhone with A19 Pro and titanium build.',
    images: [I.ip17Max, I.ip17Pro, I.ip17, I.ipAir, I.ip16],
    thumbnail: I.ip17Max,
    basePrice: 217499, compareAtPrice: 249999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Gold', 'Black', 'White', 'Silver'] },
      { key: 'storage', label: 'Storage', values: ['256GB', '512GB', '1TB'] },
    ],
    attributes: new Map([['os', 'iOS'], ['processor', 'Apple A19 Pro'], ['ram', '8GB'], ['display', 'Super Retina XDR OLED ProMotion'], ['displaySize', '6.9'], ['rearCamera', '48MP + 48MP Ultra Wide + 12MP 5x Telephoto'], ['battery', '4685'], ['network', '5G'], ['nfc', 'Yes']]),
    tags: ['iphone', 'apple', '17', 'pro', 'max', '5g', 'ios'],
    warranty: '1 Year Apple Warranty', status: 'approved', isOnlineExclusive: true,
    totalSold: 334, averageRating: 4.9, reviewCount: 148, emiOptions: EMI_PREMIUM,
  }, { upsert: true, new: true });
  await upsertVariants(ip17pm._id, 'IP17PM',
    [{ key: 'color', values: ['Gold', 'Black', 'White', 'Silver'] }, { key: 'storage', values: ['256GB', '512GB', '1TB'] }],
    217499, {
      'Gold+512GB': 242499, 'Black+512GB': 242499, 'White+512GB': 242499, 'Silver+512GB': 242499,
      'Gold+1TB': 267499, 'Black+1TB': 267499, 'White+1TB': 267499, 'Silver+1TB': 267499,
    });

  // 3. Apple MacBook Air 13" M5 — macbook | color × RAM × storage variants
  const mba13 = await ProductModel.findOneAndUpdate({ slug: 'apple-macbook-air-13-m5' }, {
    vendor: vendor2._id, category: macbookCat._id,
    name: 'Apple MacBook Air 13" (M5)', slug: 'apple-macbook-air-13-m5', brand: 'Apple',
    description: 'MacBook Air 13" with M5 chip delivers incredible performance in an ultra-thin design with up to 18 hours of battery life.',
    shortDescription: 'Ultra-thin MacBook Air with Apple M5 chip.',
    images: [I.mbAirStar, I.mbAirMid, I.mbAirSky, I.mbAirSlv, I.mbNeoInd],
    thumbnail: I.mbAirStar,
    basePrice: 196999, compareAtPrice: 220000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Starlight', 'Midnight', 'Sky Blue', 'Silver'] },
      { key: 'ram', label: 'Memory', values: ['16GB', '24GB'] },
      { key: 'storage', label: 'Storage', values: ['512GB SSD', '1TB SSD'] },
    ],
    attributes: new Map([['os', 'macOS Sequoia'], ['processor', 'Apple M5 (10-core CPU)'], ['display', 'Liquid Retina'], ['displaySize', '13.6'], ['battery', 'Up to 18 hours'], ['wifi', 'Wi-Fi 6E'], ['bluetooth', 'Bluetooth 5.3']]),
    tags: ['apple', 'macbook', 'air', 'm5', 'laptop'],
    warranty: '1 Year Apple Warranty', status: 'approved', isOnlineExclusive: true,
    totalSold: 67, averageRating: 4.9, reviewCount: 38, emiOptions: EMI_PREMIUM,
  }, { upsert: true, new: true });
  await upsertVariants(mba13._id, 'MBA13M5',
    [{ key: 'color', values: ['Starlight', 'Midnight', 'Sky Blue', 'Silver'] }, { key: 'ram', values: ['16GB', '24GB'] }, { key: 'storage', values: ['512GB SSD', '1TB SSD'] }],
    196999, {
      'Starlight+24GB+512GB SSD': 224999, 'Midnight+24GB+512GB SSD': 224999, 'Sky Blue+24GB+512GB SSD': 224999, 'Silver+24GB+512GB SSD': 224999,
      'Starlight+16GB+1TB SSD': 224999, 'Midnight+16GB+1TB SSD': 224999,
      'Starlight+24GB+1TB SSD': 264999, 'Midnight+24GB+1TB SSD': 264999, 'Sky Blue+24GB+1TB SSD': 264999, 'Silver+24GB+1TB SSD': 264999,
    }, 15);

  // 4. Apple iPad Pro 11" M5 — ipad | storage × connectivity variants
  const ipadPro = await ProductModel.findOneAndUpdate({ slug: 'apple-ipad-pro-11-m5' }, {
    vendor: vendor2._id, category: ipadCat._id,
    name: 'Apple iPad Pro 11" (M5)', slug: 'apple-ipad-pro-11-m5', brand: 'Apple',
    description: 'iPad Pro with M5 chip, Ultra Retina XDR display, Apple Pencil Pro support, and all-day battery life.',
    shortDescription: 'Apple\'s most powerful iPad with M5 chip and XDR display.',
    images: [I.ipadPro11Slv, I.ipadPro11Blk, I.ipadAirGrey, I.ipadAirPurp, I.ipadAirStar],
    thumbnail: I.ipadPro11Slv,
    basePrice: 147999, compareAtPrice: 159999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'storage', label: 'Storage', values: ['256GB', '512GB', '1TB'] },
      { key: 'connectivity', label: 'Connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] },
    ],
    attributes: new Map([['os', 'iPadOS 18'], ['processor', 'Apple M5'], ['display', 'Ultra Retina XDR OLED'], ['displaySize', '11'], ['battery', '28.65Wh']]),
    tags: ['apple', 'ipad', 'pro', 'm5', 'tablet'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 93, averageRating: 4.8, reviewCount: 52, emiOptions: EMI_PREMIUM,
  }, { upsert: true, new: true });
  await upsertVariants(ipadPro._id, 'IPADPRO11M5',
    [{ key: 'storage', values: ['256GB', '512GB', '1TB'] }, { key: 'connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] }],
    147999, {
      '512GB+Wi-Fi': 177999, '512GB+Wi-Fi + Cellular': 197999,
      '1TB+Wi-Fi': 207999, '1TB+Wi-Fi + Cellular': 227999,
      '256GB+Wi-Fi + Cellular': 167999,
    }, 20);

  // 5. Apple Watch Series 11 — watches | size × color variants
  const aw11 = await ProductModel.findOneAndUpdate({ slug: 'apple-watch-series-11' }, {
    vendor: vendor2._id, category: watchesCat._id,
    name: 'Apple Watch Series 11', slug: 'apple-watch-series-11', brand: 'Apple',
    description: 'Apple Watch Series 11 with S11 chip, always-on Retina display, advanced health sensors, and carbon-neutral options.',
    shortDescription: 'Apple Watch Series 11 with next-gen health features.',
    images: [I.awS11Rose, I.aw10Blk, I.aw10Slv, I.aw10Rose, I.awSE3],
    thumbnail: I.awS11Rose,
    basePrice: 49999, compareAtPrice: 53999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'size', label: 'Size', values: ['42mm', '46mm'] },
      { key: 'color', label: 'Color', values: ['Rose Gold', 'Black', 'Silver', 'Gold'] },
    ],
    attributes: new Map([['os', 'watchOS'], ['display', 'Always-On Retina LTPO OLED'], ['battery', 'Up to 18 hours'], ['waterproof', '50m Water Resistant'], ['gps', 'Yes'], ['compatibility', 'iPhone XS or later with iOS 18']]),
    tags: ['apple', 'watch', 'series11', 'smartwatch', 'wearable'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 178, averageRating: 4.8, reviewCount: 91, emiOptions: EMI_HIGH,
  }, { upsert: true, new: true });
  await upsertVariants(aw11._id, 'AW11',
    [{ key: 'size', values: ['42mm', '46mm'] }, { key: 'color', values: ['Rose Gold', 'Black', 'Silver', 'Gold'] }],
    49999, { '46mm+Rose Gold': 54999, '46mm+Black': 54999, '46mm+Silver': 54999, '46mm+Gold': 54999 });

  // 6. Samsung Galaxy Watch 8 Classic — watches | size × color variants
  const gw8c = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-watch-8-classic' }, {
    vendor: vendor1._id, category: watchesCat._id,
    name: 'Samsung Galaxy Watch 8 Classic', slug: 'samsung-galaxy-watch-8-classic', brand: 'Samsung',
    description: 'Galaxy Watch 8 Classic with a signature rotating bezel, Wear OS 5, comprehensive health tracking, and 4 days battery life.',
    shortDescription: 'Samsung premium smartwatch with iconic rotating bezel.',
    images: [I.gw8Blk, I.gw8, I.gw7, I.gwUltra, I.gw8Blk],
    thumbnail: I.gw8Blk,
    basePrice: 31999, compareAtPrice: 36999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'size', label: 'Size', values: ['43mm', '47mm'] },
      { key: 'color', label: 'Color', values: ['Black', 'Silver', 'Gold'] },
    ],
    attributes: new Map([['os', 'Wear OS'], ['display', 'Super AMOLED'], ['battery', 'Up to 48 hours (43mm)'], ['waterproof', '5ATM + IP68'], ['gps', 'Yes'], ['compatibility', 'Android 11+ with 1.5GB RAM']]),
    tags: ['samsung', 'galaxy', 'watch8', 'classic', 'smartwatch'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 112, averageRating: 4.6, reviewCount: 54, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(gw8c._id, 'GW8C',
    [{ key: 'size', values: ['43mm', '47mm'] }, { key: 'color', values: ['Black', 'Silver', 'Gold'] }],
    31999, { '47mm+Black': 36999, '47mm+Silver': 36999, '47mm+Gold': 36999 });

  // 7. Apple AirPods Pro 3 — earbuds | color (single) variant
  const app3 = await ProductModel.findOneAndUpdate({ slug: 'apple-airpods-pro-3' }, {
    vendor: vendor2._id, category: earbudsCat._id,
    name: 'Apple AirPods Pro 3', slug: 'apple-airpods-pro-3', brand: 'Apple',
    description: 'AirPods Pro 3 with H3 chip, Adaptive Audio, Hearing Health features, 36 hours total battery, and USB-C charging case.',
    shortDescription: 'Apple\'s best earbuds with H3 chip and Hearing Health.',
    images: [I.airPro3, I.air4Anc, I.air4, I.airMaxMid, I.buds4Pro],
    thumbnail: I.airPro3,
    basePrice: 31999, compareAtPrice: 38000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['White'] }],
    attributes: new Map([['type', 'In-Ear'], ['anc', 'Yes'], ['connectivity', 'Bluetooth 5.4'], ['battery', '8 hrs + 28 hrs with case = 36 hrs'], ['waterproof', 'IPX4']]),
    tags: ['apple', 'airpods', 'pro', 'earbuds', 'anc', 'h3'],
    warranty: '1 Year Apple Warranty', status: 'approved', isOnlineExclusive: true,
    totalSold: 224, averageRating: 4.8, reviewCount: 108, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(app3._id, 'APP3', [{ key: 'color', values: ['White'] }], 31999, {}, 60);

  // 8. Samsung Galaxy Buds4 Pro — earbuds | color variants
  const buds4p = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-buds4-pro' }, {
    vendor: vendor1._id, category: earbudsCat._id,
    name: 'Samsung Galaxy Buds4 Pro', slug: 'samsung-galaxy-buds4-pro', brand: 'Samsung',
    description: 'Galaxy Buds4 Pro with Intelligent ANC, 360 Audio, 30 hours total battery, and seamless Galaxy ecosystem integration.',
    shortDescription: 'Samsung premium earbuds with Intelligent ANC.',
    images: [I.buds4Pro, I.airPro3, I.air4Anc, I.air4, I.airMaxMid],
    thumbnail: I.buds4Pro,
    basePrice: 25999, compareAtPrice: 26999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['White', 'Black', 'Silver'] }],
    attributes: new Map([['type', 'In-Ear'], ['anc', 'Yes'], ['connectivity', 'Bluetooth 5.4'], ['battery', '6 hrs + 24 hrs with case = 30 hrs'], ['waterproof', 'IPX7']]),
    tags: ['samsung', 'galaxy', 'buds', 'earbuds', 'anc'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 156, averageRating: 4.6, reviewCount: 78, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(buds4p._id, 'GB4P', [{ key: 'color', values: ['White', 'Black', 'Silver'] }], 25999, {}, 45);

  // 9. Sony WH-1000XM6 — audiosCat (headphones) | color variants
  const xm6 = await ProductModel.findOneAndUpdate({ slug: 'sony-wh-1000xm6' }, {
    vendor: vendor1._id, category: audiosCat._id,
    name: 'Sony WH-1000XM6 Wireless Headphones', slug: 'sony-wh-1000xm6', brand: 'Sony',
    description: 'Sony WH-1000XM6 flagship noise-cancelling headphones with Auto NC Optimizer, 30-hour battery, Multipoint connection, and Hi-Res Audio.',
    shortDescription: 'Sony flagship ANC headphones with 30-hour battery.',
    images: [I.sonyXM6, I.boseQCU, I.marshMon, I.sonyXM6, I.boseQCU],
    thumbnail: I.sonyXM6,
    basePrice: 44990, compareAtPrice: 50000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Midnight Blue', 'Black', 'Platinum Silver'] }],
    attributes: new Map([['type', 'Over-Ear'], ['anc', 'Yes'], ['connectivity', 'Bluetooth 5.3'], ['battery', '30 hours (ANC on)'], ['waterproof', 'None']]),
    tags: ['sony', 'headphones', 'anc', 'wireless', 'hi-res'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 143, averageRating: 4.7, reviewCount: 69, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(xm6._id, 'SNXM6', [{ key: 'color', values: ['Midnight Blue', 'Black', 'Platinum Silver'] }], 44990, {}, 35);

  // 10. JBL PartyBox On-the-Go 2 — speakerCat | color variants
  const jblOTG = await ProductModel.findOneAndUpdate({ slug: 'jbl-partybox-on-the-go-2' }, {
    vendor: vendor1._id, category: speakerCat._id,
    name: 'JBL PartyBox On-the-Go 2', slug: 'jbl-partybox-on-the-go-2', brand: 'JBL',
    description: 'JBL PartyBox On-the-Go 2 portable speaker with 100W sound, built-in light show, shoulder strap, wireless mic, and 6-hour playtime.',
    shortDescription: 'Portable 100W JBL party speaker with built-in microphone.',
    images: [I.jblOTG2, I.jblBB4, I.marshKil, I.boseSL, I.sonyUlt],
    thumbnail: I.jblOTG2,
    basePrice: 44999, compareAtPrice: 47999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black', 'Teal'] }],
    attributes: new Map([['type', 'Portable Bluetooth Speaker'], ['anc', 'No'], ['connectivity', 'Bluetooth 5.0'], ['battery', 'Up to 6 hours'], ['waterproof', 'IPX4']]),
    tags: ['jbl', 'speaker', 'party', 'portable', 'bluetooth'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 89, averageRating: 4.5, reviewCount: 43, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(jblOTG._id, 'JBLOTG2', [{ key: 'color', values: ['Black', 'Teal'] }], 44999, {}, 25);

  // 11. Logitech M240 Silent Mouse — pcAccCat | color variants
  const m240 = await ProductModel.findOneAndUpdate({ slug: 'logitech-m240-silent-mouse' }, {
    vendor: vendor1._id, category: pcAccCat._id,
    name: 'Logitech M240 Silent Bluetooth Mouse', slug: 'logitech-m240-silent-mouse', brand: 'Logitech',
    description: 'Logitech M240 silent Bluetooth mouse with 90% quieter clicks, 18-month battery, and ergonomic comfort for all-day use.',
    shortDescription: 'Quiet Bluetooth mouse with 18-month battery life.',
    images: [I.logM240, I.logErgo, I.appleTP, I.logM240, I.logErgo],
    thumbnail: I.logM240,
    basePrice: 1799, compareAtPrice: 2200, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Graphite', 'Pale Blue', 'Rose'] }],
    attributes: new Map([['connectivity', 'Bluetooth 5.2'], ['compatibility', 'Windows, macOS, iPadOS, ChromeOS'], ['battery', '18 months (AA)']]),
    tags: ['logitech', 'mouse', 'bluetooth', 'silent', 'pc'],
    warranty: '1 Year Warranty', status: 'approved',
    totalSold: 310, averageRating: 4.5, reviewCount: 145, emiOptions: [],
  }, { upsert: true, new: true });
  await upsertVariants(m240._id, 'LGM240', [{ key: 'color', values: ['Graphite', 'Pale Blue', 'Rose'] }], 1799, {}, 80);

  // 12. Logitech G733 Gaming Headset — gamingCat | color variants
  const g733 = await ProductModel.findOneAndUpdate({ slug: 'logitech-g733-gaming-headset' }, {
    vendor: vendor1._id, category: gamingCat._id,
    name: 'Logitech G733 LIGHTSPEED Wireless Gaming Headset', slug: 'logitech-g733-gaming-headset', brand: 'Logitech',
    description: 'Logitech G733 with LIGHTSPEED wireless, LIGHTSYNC RGB, Blue VO!CE mic, DTS Headphone:X 2.0, and up to 29-hour battery.',
    shortDescription: 'Wireless gaming headset with LIGHTSPEED and RGB lighting.',
    images: [I.logG733, I.logG321, I.razerBW, I.logG733, I.logG321],
    thumbnail: I.logG733,
    basePrice: 17500, compareAtPrice: 19999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black', 'Blue', 'White', 'Purple'] }],
    attributes: new Map([['connectivity', 'LIGHTSPEED Wireless 2.4GHz'], ['battery', 'Up to 29 hours'], ['type', 'Over-Ear Gaming Headset']]),
    tags: ['logitech', 'gaming', 'headset', 'wireless', 'rgb'],
    warranty: '2 Year Warranty', status: 'approved',
    totalSold: 76, averageRating: 4.6, reviewCount: 34, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(g733._id, 'LGG733', [{ key: 'color', values: ['Black', 'Blue', 'White', 'Purple'] }], 17500, {}, 30);

  // 13. Belkin 20000mAh Power Bank — powerBankCat | color × capacity variants
  const belkin = await ProductModel.findOneAndUpdate({ slug: 'belkin-20000mah-power-bank' }, {
    vendor: vendor1._id, category: powerBankCat._id,
    name: 'Belkin 20000mAh 3-Port Laptop Power Bank', slug: 'belkin-20000mah-power-bank', brand: 'Belkin',
    description: 'Belkin 20000mAh power bank with 3 USB ports (2 USB-C, 1 USB-A), 30W USB-C output, and pass-through charging for laptops and phones.',
    shortDescription: 'Belkin 20000mAh power bank with 30W USB-C for laptops.',
    images: [I.blk20k, I.blk10k, I.blkQi, I.skross20, I.meko20],
    thumbnail: I.blk20k,
    basePrice: 9999, compareAtPrice: 11999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Black', 'White'] },
      { key: 'capacity', label: 'Capacity', values: ['10000mAh', '20000mAh'] },
    ],
    attributes: new Map([['charging', '30W USB-C'], ['ports', '2× USB-C + 1× USB-A'], ['weight', '450g']]),
    tags: ['belkin', 'power-bank', 'charger', 'portable', 'usb-c'],
    warranty: '2 Year Warranty', status: 'approved',
    totalSold: 234, averageRating: 4.5, reviewCount: 112, emiOptions: [],
  }, { upsert: true, new: true });
  await upsertVariants(belkin._id, 'BLKPB',
    [{ key: 'color', values: ['Black', 'White'] }, { key: 'capacity', values: ['10000mAh', '20000mAh'] }],
    9999, { 'Black+10000mAh': 4999, 'White+10000mAh': 4999 }, 50);

  // 14. TP-Link Deco X50 AX3000 — routerCat | color variants
  const tpX50 = await ProductModel.findOneAndUpdate({ slug: 'tp-link-deco-x50-ax3000' }, {
    vendor: vendor1._id, category: routerCat._id,
    name: 'TP-Link Deco X50 AX3000 Mesh Wi-Fi 6 Router', slug: 'tp-link-deco-x50-ax3000', brand: 'TP-Link',
    description: 'TP-Link Deco X50 AX3000 Dual-Band Mesh Wi-Fi 6 system with OFDMA, 4× Gigabit ports, and coverage for up to 2,700 sq ft per unit.',
    shortDescription: 'AX3000 Wi-Fi 6 mesh router with OFDMA technology.',
    images: [I.tpX50, I.tpX503p, I.tpX20, I.tpAX73, I.tpS7],
    thumbnail: I.tpX50,
    basePrice: 5990, compareAtPrice: 6990, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['White'] }],
    attributes: new Map([['standard', 'Wi-Fi 6 (802.11ax)'], ['speed', 'AX3000 (2402 + 574 Mbps)'], ['band', 'Dual Band'], ['ports', '4× Gigabit LAN + 1× Gigabit WAN']]),
    tags: ['tp-link', 'deco', 'router', 'wifi6', 'mesh', 'networking'],
    warranty: '3 Year Warranty', status: 'approved',
    totalSold: 189, averageRating: 4.5, reviewCount: 87, emiOptions: [],
  }, { upsert: true, new: true });
  await upsertVariants(tpX50._id, 'TPX50', [{ key: 'color', values: ['White'] }], 5990, {}, 40);

  // 15. Spigen Ultra Hybrid Case Galaxy S26 Ultra — casesCat | color variants
  const spigenCase = await ProductModel.findOneAndUpdate({ slug: 'spigen-ultra-hybrid-s26-ultra' }, {
    vendor: vendor1._id, category: casesCat._id,
    name: 'Spigen Ultra Hybrid MagFit Case for Galaxy S26 Ultra', slug: 'spigen-ultra-hybrid-s26-ultra', brand: 'Spigen',
    description: 'Spigen Ultra Hybrid MagFit case for Galaxy S26 Ultra with crystal-clear back, reinforced corners, and built-in MagFit ring for wireless charging.',
    shortDescription: 'Clear MagFit protective case for Samsung Galaxy S26 Ultra.',
    images: [I.spUH, I.spTA, I.torOS, I.uagP, I.spUH],
    thumbnail: I.spUH,
    basePrice: 2999, compareAtPrice: 3999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Crystal Clear', 'Matte Black', 'Midnight Blue'] }],
    attributes: new Map([['compatibility', 'Samsung Galaxy S26 Ultra'], ['material', 'TPU + PC + ACS'], ['type', 'Bumper + Back Cover']]),
    tags: ['spigen', 'case', 'samsung', 's26', 'ultra', 'magfit'],
    warranty: '6 Month Warranty', status: 'approved',
    totalSold: 342, averageRating: 4.7, reviewCount: 168, emiOptions: [],
  }, { upsert: true, new: true });
  await upsertVariants(spigenCase._id, 'SPUH26U', [{ key: 'color', values: ['Crystal Clear', 'Matte Black', 'Midnight Blue'] }], 2999, {}, 100);

  // 16. DJI Osmo Nano Action Camera — cameraCat | color variants
  const djiNano = await ProductModel.findOneAndUpdate({ slug: 'dji-osmo-nano-action-camera' }, {
    vendor: vendor2._id, category: cameraCat._id,
    name: 'DJI Osmo Nano Action Camera', slug: 'dji-osmo-nano-action-camera', brand: 'DJI',
    description: 'DJI Osmo Nano compact action camera with 4K/60fps, 10-bit D-Log M, RockSteady 3.0 stabilization, and 2.5-hour battery life.',
    shortDescription: 'Compact DJI action camera with 4K/60fps and RockSteady 3.0.',
    images: [I.djiNano, I.djiAct5, I.djiMob8, I.insta360, I.djiNano],
    thumbnail: I.djiNano,
    basePrice: 33999, compareAtPrice: 37999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black', 'Gray'] }],
    attributes: new Map([['type', 'Action Camera'], ['video', '4K/60fps, 10-bit D-Log M'], ['stabilization', 'RockSteady 3.0'], ['battery', '2.5 hours'], ['waterproof', 'IPX8 (18m without housing)']]),
    tags: ['dji', 'osmo', 'nano', 'action', 'camera', '4k'],
    warranty: '1 Year DJI Warranty', status: 'approved',
    totalSold: 65, averageRating: 4.6, reviewCount: 31, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(djiNano._id, 'DJINANO', [{ key: 'color', values: ['Black', 'Gray'] }], 33999, {}, 20);

  // 17. Xiaomi Smart Camera C301 — gadgetCat | color variants
  const xiaomiCam = await ProductModel.findOneAndUpdate({ slug: 'xiaomi-smart-camera-c301' }, {
    vendor: vendor1._id, category: gadgetCat._id,
    name: 'Xiaomi Smart Camera C301 2K 360° Night Vision', slug: 'xiaomi-smart-camera-c301', brand: 'Xiaomi',
    description: 'Xiaomi Smart Camera C301 with 2K resolution, 360° pan & tilt, color night vision, AI motion detection, and 2-way audio.',
    shortDescription: '2K 360° smart home security camera with night vision.',
    images: [I.xiaomiCam, I.djiMob7, I.djiMob8, I.xiaomiCam, I.djiMob7],
    thumbnail: I.xiaomiCam,
    basePrice: 3999, compareAtPrice: 4999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['White', 'Black'] }],
    attributes: new Map([['type', '360° Smart Home Camera'], ['video', '2K (2304×1296)'], ['connectivity', 'Wi-Fi 2.4GHz + Bluetooth'], ['waterproof', 'Indoor only']]),
    tags: ['xiaomi', 'smart-camera', 'security', '2k', '360', 'gadget'],
    warranty: '1 Year Warranty', status: 'approved',
    totalSold: 287, averageRating: 4.3, reviewCount: 132, emiOptions: [],
  }, { upsert: true, new: true });
  await upsertVariants(xiaomiCam._id, 'XMCAM', [{ key: 'color', values: ['White', 'Black'] }], 3999, {}, 60);

  // 18. DJI Mini 5 Pro Fly More Combo — droneCat | combo variants
  const djiMini5 = await ProductModel.findOneAndUpdate({ slug: 'dji-mini-5-pro-fly-more-combo' }, {
    vendor: vendor2._id, category: droneCat._id,
    name: 'DJI Mini 5 Pro Fly More Combo Plus (RC 2)', slug: 'dji-mini-5-pro-fly-more-combo', brand: 'DJI',
    description: 'DJI Mini 5 Pro under 249g with 4K/60fps Hasselblad camera, 30-min flight time, 20km transmission, omnidirectional obstacle sensing, and ActiveTrack 360.',
    shortDescription: 'Sub-250g DJI drone with Hasselblad 4K camera and 30-min flight.',
    images: [I.djiMini5, I.djiNeo2, I.djiAvata, I.djiFlip, I.djiMini3],
    thumbnail: I.djiMini5,
    basePrice: 124999, compareAtPrice: 131999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Gray'] }],
    attributes: new Map([['camera', '4K/60fps Hasselblad (1/1.3" CMOS)'], ['flightTime', '30 min'], ['range', '20 km'], ['weight', '249g'], ['stabilization', '3-axis gimbal']]),
    tags: ['dji', 'mini5', 'pro', 'drone', '4k', 'hasselblad'],
    warranty: '1 Year DJI Warranty', status: 'approved', isOnlineExclusive: true,
    totalSold: 48, averageRating: 4.8, reviewCount: 22, emiOptions: EMI_PREMIUM,
  }, { upsert: true, new: true });
  await upsertVariants(djiMini5._id, 'DJIMINI5', [{ key: 'color', values: ['Gray'] }], 124999, {}, 10);

  console.log('✓ Products (18) + Variants');

  // ─── Sample Order ────────────────────────────────────────────────────────────
  const existingOrder = await OrderModel.findOne({ user: user1._id });
  if (!existingOrder) {
    const variant = await VariantModel.findOne({ product: s26ultra._id });
    if (variant) {
      const orderNumber = await generateOrderNumber();
      await OrderModel.create({
        orderNumber, user: user1._id,
        items: [{ product: s26ultra._id, variant: variant._id, vendor: vendor1._id, productSnapshot: { name: s26ultra.name, brand: s26ultra.brand, thumbnail: s26ultra.thumbnail, slug: s26ultra.slug }, variantSnapshot: { sku: variant.sku, options: variant.options }, unitPrice: variant.price, quantity: 1, subtotal: variant.price }],
        shippingAddress: { fullName: 'Sakib Hossain', line1: 'House 12, Road 5', city: 'Dhaka', country: 'Bangladesh', phone: '01700000004' },
        subtotal: variant.price, shippingFee: 0, tax: Math.round(variant.price * 0.05), discount: 0,
        total: Math.round(variant.price * 1.05), currency: 'BDT', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'cod',
        statusHistory: [{ status: 'pending', at: new Date(Date.now() - 7 * 86400000) }, { status: 'delivered', at: new Date(Date.now() - 2 * 86400000) }],
        placedAt: new Date(Date.now() - 7 * 86400000), deliveredAt: new Date(Date.now() - 2 * 86400000),
      });
      console.log('✓ Sample order');
    }
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('─── Credentials ───────────────────────────');
  console.log('Admin:  admin@zyromart.com   / Admin@1234');
  console.log('Vendor: vendor1@zyromart.com / Vendor@1234  (TechZone BD)');
  console.log('Vendor: vendor2@zyromart.com / Vendor@1234  (GadgetHub)');
  console.log('User:   user1@zyromart.com   / User@1234');
  console.log('───────────────────────────────────────────');
  console.log('Categories : 13 parent + 6 featured sub-categories');
  console.log('Products   : 18 products covering all categories + variant types');
  console.log('             phones · macbook · ipad · watches · earbuds · headphones');
  console.log('             speakers · pc-accessories · gaming · power-bank · router');
  console.log('             cases · camera · gadget · drone');

  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
