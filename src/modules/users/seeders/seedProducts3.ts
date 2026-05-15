/**
 * Extra product seeds — adds 20 more products across all categories.
 * Requires seedAll.ts to have run first (vendors + categories must exist).
 * Run: npm run seed3
 */
import mongoose from 'mongoose';
import config from '../../../config';
import { VendorModel } from '../../vendors/vendor.model';
import { CategoryModel } from '../../categories/category.model';
import { ProductModel } from '../../products/product.model';
import { VariantModel } from '../../variants/variant.model';

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

// ─── CDN images (gadgetandgear.com — confirmed real product images) ───────────
const CDN = 'https://assets.gadgetandgear.com/upload/media/';
const I = {
  // Phones
  s26Plus:  CDN + 'Galaxy%20S26%20Plus/galaxy-s26-plus.jpeg',
  s26Std:   CDN + 'Samsung%20Galaxy%20S26%20(12/256GB)/samsung-galaxy-s26.jpeg-1.jpeg',
  s25Fe:    CDN + 'samsung-galaxy-s25-fe-black881.jpeg',
  s26U256:  CDN + 'Samsung%20Galaxy%20S26%20Ultra%20(12/256GB)/samsung-galaxy-s26-ultra-1772347558401.jpeg',
  ip17Pro:  CDN + 'Offer%20Gift/iphone-17-pro-deep-blue238-1771129631326.jpeg',
  ip17Max:  CDN + 'Offer%20Gift/iphone-17-pro-max-cosmic-orange565-1771129691561.jpeg',
  ip17:     CDN + 'Offer%20Gift/apple-iphone-17-mist-blue877-1771129124028.jpeg',
  ipAir:    CDN + 'iphone-air-space-black565.jpeg',
  ip16:     CDN + 'iphone-16-128gb-teal.jpeg',
  // MacBook
  mbAirStar: CDN + 'apple/macbook-air-m5-15-inch-starlight-1.jpeg',
  mbAirMid:  CDN + 'apple/macbook-air-m5-15-inch-midnight-1-1775365043486.jpeg',
  mbAirSky:  CDN + 'apple/macbook-air-m5-15-inch-sky-blue-1.jpeg',
  mbAirSlv:  CDN + 'apple/macbook-air-m5-15-inch-silver-1.jpeg',
  mbProBlk:  CDN + 'apple/macbook-pro-m5-pro-chip-14-inch.jpeg',
  // Watches
  gwUltra:  CDN + 'galaxy-watch-ultra-2025806.jpeg',
  gw7:      CDN + 'samsung-galaxy-watch-7-smart-watch695.jpeg',
  gw8:      CDN + 'samsung-galaxy-watch-8563.jpeg',
  gw8Blk:   CDN + 'galaxy-watch-8-classic-black650.jpeg',
  aw10Blk:  CDN + 'apple-watch-10-jet-black-46mm.jpeg',
  aw10Slv:  CDN + 'apple-watch-10--46mm-silver-aluminum.jpeg',
  aw10Rose: CDN + 'apple-watch-10-rose-gold-42mm.jpeg',
  awS11Rose: CDN + 'apple-watch-series-11-rose-gold-1520.jpeg',
  // Audio
  airMaxMid: CDN + 'apple-airpods/airpods-max-2-midnight.jpeg',
  airPro3:   CDN + 'airpods-pro-3-1411.jpeg',
  buds4Pro:  CDN + 'Samsung%20Galaxy%20Buds%204%20Pro/samsung-galaxy-buds-4-pro.jpeg',
  sonyUlt:   CDN + 'sony-srs-ult50-portable-wireless-speaker725.jpeg',
  jblBB4:    CDN + 'jbl-boombox-4-black3.jpeg',
  marshKil:  CDN + 'marshall-kilburn-iii-portable-speaker98.jpeg',
  boseSL:    CDN + 'bose-soundlink-home-bluetooth-speaker-warm-wood582.jpeg',
  boseQCU:   CDN + 'bose-quietcomfort-ultra-headphones-2nd-gen826.jpeg',
  // Camera & Drone
  djiMob7:  CDN + 'dji-osmo-mobile-7-gimbal-1768.jpeg',
  djiMob8:  CDN + 'dji-osmo-mobile-8328.jpeg',
  djiAct5:  CDN + 'dji-osmo-action-5-pro-adventure-combo.jpeg',
  djiAvata: CDN + 'dji/dji-avata-360-fly-more-combo-2.jpeg',
  djiNeo2:  CDN + 'dji-neo-2-fly-more-combo-drone-4793.jpeg',
  djiMini5: CDN + 'dji-mini-5-pro-fly-more-combo-plus-with-rc2110.jpeg',
  // Cases
  torOS:  CDN + 'TORRAS%20Ostand%20Slim%20Case%20for%20Galaxy%20S26%20Ultra/torras-ostand-slim-case-for-galaxy-s26-ultra.jpeg',
  uagP:   CDN + 'UAG%20Plyo%20MagSafe%20Case%20for%20Galaxy%20S26%20Ultra/uag-plyo-magsafe-case-for-galaxy-s26-ultra.jpeg',
  spUH:   CDN + 'Spigen%20Ultra%20Hybrid%20MagFit%20Case%20for%20Galaxy%20S26%20Ultra/spigen-ultra-hyrbird-magfit-case-for-galaxy-s26-ultra-1.jpeg',
  // Router & Power Banks
  tpS7:    CDN + 'tp-link-deco-s7-router-new.jpg-new658.jpeg',
  tpX50:   CDN + 'tp-link-deco-x50-router977.jpeg',
  tpX20:   CDN + 'tp-link/tp-link-deco-x20-ax1800-mesh-wi-fi-router-2.jpeg',
  blkQi:   CDN + 'belkin-qi2-10000mah-magnetic-power-bank-1.jpeg',
  blk20k:  CDN + 'belkin-20000mah-3-port-laptop-power-bank.jpeg',
  skross10: CDN + 'skross-reload-10-power-bank498.jpeg',
  skross20: CDN + 'skross-reload-20-pd-100w-power-bank247.jpeg',
  // Earbuds
  air4:    CDN + 'apple-airpods-4-anc-starlight.jpeg',
};

const EMI_MID     = [{ months: 6, monthlyRate: 0, minAmount: 5000 }, { months: 12, monthlyRate: 0.0075, minAmount: 10000 }];
const EMI_HIGH    = [{ months: 6, monthlyRate: 0, minAmount: 10000 }, { months: 12, monthlyRate: 0.0075, minAmount: 15000 }, { months: 18, monthlyRate: 0.01, minAmount: 20000 }];
const EMI_PREMIUM = [{ months: 6, monthlyRate: 0, minAmount: 20000 }, { months: 12, monthlyRate: 0.0075, minAmount: 20000 }, { months: 18, monthlyRate: 0.01, minAmount: 30000 }];

export const seed3 = async () => {
  await mongoose.connect(config.db_url as string);
  console.log('Connected. Seeding extra products (seed3)…');

  const [v1, v2] = await Promise.all([
    VendorModel.findOne({ slug: 'techzone-bd' }),
    VendorModel.findOne({ slug: 'gadgethub' }),
  ]);
  if (!v1 || !v2) throw new Error('Run seedAll.ts first — vendors not found.');

  const catList = await CategoryModel.find({
    slug: { $in: ['phones', 'macbook', 'watches', 'headphone-speaker', 'speaker', 'earbuds', 'camera', 'drone', 'cases-protectors', 'router', 'power-bank'] },
  });
  const C: Record<string, typeof catList[0]> = {};
  for (const c of catList) C[c.slug] = c;
  if (!catList.length) throw new Error('Run seedAll.ts first — categories not found.');

  // ══════════════════════════════════════════════════════════════════════════
  // PHONES (5)
  // ══════════════════════════════════════════════════════════════════════════

  // 1. Samsung Galaxy S26+
  const s26plus = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-s26-plus' }, {
    vendor: v1._id, category: C['phones']._id,
    name: 'Samsung Galaxy S26+', slug: 'samsung-galaxy-s26-plus', brand: 'Samsung',
    description: 'Samsung Galaxy S26+ with Snapdragon 8 Elite, 6.7" Dynamic AMOLED 2X 120Hz display, 50MP ProVisual triple camera system, 4900mAh battery, and IP68 rating.',
    shortDescription: 'Samsung\'s flagship+ with Snapdragon 8 Elite and 50MP ProVisual camera.',
    images: [I.s26Plus, I.s26Std, I.s26U256, I.s25Fe, I.s26Plus],
    thumbnail: I.s26Plus,
    basePrice: 149999, compareAtPrice: 159999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Black', 'White', 'Blue'] },
      { key: 'storage', label: 'Storage', values: ['256GB', '512GB'] },
    ],
    attributes: new Map([['os', 'Android'], ['processor', 'Snapdragon 8 Elite'], ['ram', '12GB'], ['display', 'Dynamic AMOLED 2X'], ['displaySize', '6.7'], ['rearCamera', '50MP + 12MP + 10MP'], ['battery', '4900'], ['network', '5G'], ['nfc', 'Yes']]),
    tags: ['samsung', 'galaxy', 's26', 's26plus', '5g', 'snapdragon', 'flagship'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 312, averageRating: 4.7, reviewCount: 145, emiOptions: EMI_PREMIUM, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(s26plus._id, 'S26P',
    [{ key: 'color', values: ['Black', 'White', 'Blue'] }, { key: 'storage', values: ['256GB', '512GB'] }],
    149999, { 'Black+512GB': 174999, 'White+512GB': 174999, 'Blue+512GB': 174999 });

  // 2. Samsung Galaxy S26
  const s26std = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-s26' }, {
    vendor: v1._id, category: C['phones']._id,
    name: 'Samsung Galaxy S26', slug: 'samsung-galaxy-s26', brand: 'Samsung',
    description: 'Samsung Galaxy S26 with Snapdragon 8 Elite, 6.2" Dynamic AMOLED 2X 120Hz display, 50MP ProVisual triple camera, 4000mAh battery, and IP68 rating.',
    shortDescription: 'Compact Samsung flagship with Snapdragon 8 Elite.',
    images: [I.s26Std, I.s26Plus, I.s26U256, I.s25Fe, I.s26Std],
    thumbnail: I.s26Std,
    basePrice: 119999, compareAtPrice: 129999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Black', 'White', 'Blue', 'Gold'] },
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB'] },
    ],
    attributes: new Map([['os', 'Android'], ['processor', 'Snapdragon 8 Elite'], ['ram', '8GB'], ['display', 'Dynamic AMOLED 2X'], ['displaySize', '6.2'], ['rearCamera', '50MP + 12MP + 10MP'], ['battery', '4000'], ['network', '5G'], ['nfc', 'Yes']]),
    tags: ['samsung', 'galaxy', 's26', '5g', 'snapdragon', 'flagship'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 428, averageRating: 4.6, reviewCount: 198, emiOptions: EMI_HIGH, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(s26std._id, 'S26',
    [{ key: 'color', values: ['Black', 'White', 'Blue', 'Gold'] }, { key: 'storage', values: ['128GB', '256GB'] }],
    119999, { 'Black+256GB': 134999, 'White+256GB': 134999, 'Blue+256GB': 134999, 'Gold+256GB': 134999 });

  // 3. Apple iPhone 17 Pro
  const ip17pro = await ProductModel.findOneAndUpdate({ slug: 'apple-iphone-17-pro' }, {
    vendor: v2._id, category: C['phones']._id,
    name: 'Apple iPhone 17 Pro', slug: 'apple-iphone-17-pro', brand: 'Apple',
    description: 'iPhone 17 Pro with A19 Pro chip, 6.3" Super Retina XDR OLED ProMotion display, 48MP triple camera with 5x optical zoom, titanium design, and Apple Intelligence.',
    shortDescription: 'Apple\'s A19 Pro flagship with titanium build and ProCamera system.',
    images: [I.ip17Pro, I.ip17Max, I.ip17, I.ipAir, I.ip16],
    thumbnail: I.ip17Pro,
    basePrice: 174999, compareAtPrice: 185000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Black', 'White', 'Silver', 'Gold'] },
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB', '512GB', '1TB'] },
    ],
    attributes: new Map([['os', 'iOS'], ['processor', 'Apple A19 Pro'], ['ram', '8GB'], ['display', 'Super Retina XDR OLED ProMotion'], ['displaySize', '6.3'], ['rearCamera', '48MP Fusion + 48MP Ultra Wide + 12MP 5x Telephoto'], ['battery', '3726'], ['network', '5G'], ['nfc', 'Yes']]),
    tags: ['apple', 'iphone', '17', 'pro', 'ios', '5g', 'a19', 'titanium'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 389, averageRating: 4.8, reviewCount: 231, emiOptions: EMI_PREMIUM, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(ip17pro._id, 'IP17P',
    [{ key: 'color', values: ['Black', 'White', 'Silver', 'Gold'] }, { key: 'storage', values: ['128GB', '256GB', '512GB', '1TB'] }],
    174999, { 'Black+256GB': 194999, 'Black+512GB': 224999, 'Black+1TB': 254999, 'White+256GB': 194999, 'White+512GB': 224999, 'White+1TB': 254999, 'Silver+256GB': 194999, 'Silver+512GB': 224999, 'Silver+1TB': 254999, 'Gold+256GB': 194999, 'Gold+512GB': 224999, 'Gold+1TB': 254999 });

  // 4. Apple iPhone 17
  const ip17std = await ProductModel.findOneAndUpdate({ slug: 'apple-iphone-17' }, {
    vendor: v2._id, category: C['phones']._id,
    name: 'Apple iPhone 17', slug: 'apple-iphone-17', brand: 'Apple',
    description: 'iPhone 17 with A19 chip, 6.1" Super Retina XDR OLED display, 48MP main + 12MP Ultra Wide cameras, Dynamic Island, and Apple Intelligence.',
    shortDescription: 'Apple iPhone 17 with A19 chip and Apple Intelligence.',
    images: [I.ip17, I.ip17Pro, I.ip17Max, I.ipAir, I.ip16],
    thumbnail: I.ip17,
    basePrice: 134999, compareAtPrice: 144999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Blue', 'Silver', 'Gold', 'Black', 'White'] },
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB', '512GB'] },
    ],
    attributes: new Map([['os', 'iOS'], ['processor', 'Apple A19'], ['ram', '8GB'], ['display', 'Super Retina XDR OLED'], ['displaySize', '6.1'], ['rearCamera', '48MP Fusion + 12MP Ultra Wide'], ['battery', '3577'], ['network', '5G'], ['nfc', 'Yes']]),
    tags: ['apple', 'iphone', '17', 'ios', '5g', 'a19'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 521, averageRating: 4.7, reviewCount: 289, emiOptions: EMI_HIGH, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(ip17std._id, 'IP17',
    [{ key: 'color', values: ['Blue', 'Silver', 'Gold', 'Black', 'White'] }, { key: 'storage', values: ['128GB', '256GB', '512GB'] }],
    134999, { 'Blue+256GB': 154999, 'Silver+256GB': 154999, 'Gold+256GB': 154999, 'Black+256GB': 154999, 'White+256GB': 154999, 'Blue+512GB': 184999, 'Silver+512GB': 184999, 'Gold+512GB': 184999, 'Black+512GB': 184999, 'White+512GB': 184999 });

  // 5. Samsung Galaxy S25 FE
  const s25fe = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-s25-fe' }, {
    vendor: v1._id, category: C['phones']._id,
    name: 'Samsung Galaxy S25 FE', slug: 'samsung-galaxy-s25-fe', brand: 'Samsung',
    description: 'Samsung Galaxy S25 Fan Edition with Exynos 2500, 6.7" Dynamic AMOLED 120Hz display, 50MP triple camera, 4900mAh battery, and Galaxy AI features.',
    shortDescription: 'Fan Edition Galaxy with Exynos 2500 and Galaxy AI.',
    images: [I.s25Fe, I.s26Std, I.s26Plus, I.s25Fe, I.s26Std],
    thumbnail: I.s25Fe,
    basePrice: 79999, compareAtPrice: 89999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Titanium', 'Blue', 'White', 'Green'] },
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB'] },
    ],
    attributes: new Map([['os', 'Android'], ['processor', 'Exynos 2500'], ['ram', '8GB'], ['display', 'Dynamic AMOLED 120Hz'], ['displaySize', '6.7'], ['rearCamera', '50MP OIS + 12MP + 10MP'], ['battery', '4900'], ['network', '5G'], ['nfc', 'Yes']]),
    tags: ['samsung', 'galaxy', 's25', 'fe', 'fan-edition', 'exynos', '5g'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 267, averageRating: 4.5, reviewCount: 134, emiOptions: EMI_HIGH, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(s25fe._id, 'S25FE',
    [{ key: 'color', values: ['Titanium', 'Blue', 'White', 'Green'] }, { key: 'storage', values: ['128GB', '256GB'] }],
    79999, { 'Titanium+256GB': 94999, 'Blue+256GB': 94999, 'White+256GB': 94999, 'Green+256GB': 94999 });

  // ══════════════════════════════════════════════════════════════════════════
  // MACBOOK (1)
  // ══════════════════════════════════════════════════════════════════════════

  // 6. Apple MacBook Air 15" M5
  const mba15 = await ProductModel.findOneAndUpdate({ slug: 'apple-macbook-air-15-m5' }, {
    vendor: v2._id, category: C['macbook']._id,
    name: 'Apple MacBook Air 15" (M5)', slug: 'apple-macbook-air-15-m5', brand: 'Apple',
    description: 'MacBook Air 15-inch with M5 chip, 15.3" Liquid Retina display, up to 32GB unified memory, up to 24-hour battery life, MagSafe charging, and two Thunderbolt ports.',
    shortDescription: 'The world\'s best 15-inch laptop, now with M5 chip.',
    images: [I.mbAirStar, I.mbAirMid, I.mbAirSky, I.mbAirSlv, I.mbProBlk],
    thumbnail: I.mbAirStar,
    basePrice: 189999, compareAtPrice: 199999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Starlight', 'Midnight', 'Sky Blue', 'Silver'] },
      { key: 'ram', label: 'Unified Memory', values: ['16GB', '24GB'] },
      { key: 'storage', label: 'Storage', values: ['512GB SSD', '1TB SSD'] },
    ],
    attributes: new Map([['processor', 'Apple M5 (10-core CPU)'], ['display', 'Liquid Retina'], ['displaySize', '15.3'], ['battery', 'Up to 24 hours'], ['os', 'macOS Sequoia']]),
    tags: ['apple', 'macbook', 'air', '15', 'm5', 'laptop'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 178, averageRating: 4.9, reviewCount: 87, emiOptions: EMI_PREMIUM, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(mba15._id, 'MBA15M5',
    [{ key: 'color', values: ['Starlight', 'Midnight', 'Sky Blue', 'Silver'] }, { key: 'ram', values: ['16GB', '24GB'] }, { key: 'storage', values: ['512GB SSD', '1TB SSD'] }],
    189999, { 'Starlight+16GB+1TB SSD': 214999, 'Midnight+16GB+1TB SSD': 214999, 'Sky Blue+16GB+1TB SSD': 214999, 'Silver+16GB+1TB SSD': 214999, 'Starlight+24GB+512GB SSD': 229999, 'Midnight+24GB+512GB SSD': 229999, 'Sky Blue+24GB+512GB SSD': 229999, 'Silver+24GB+512GB SSD': 229999, 'Starlight+24GB+1TB SSD': 254999, 'Midnight+24GB+1TB SSD': 254999, 'Sky Blue+24GB+1TB SSD': 254999, 'Silver+24GB+1TB SSD': 254999 });

  // ══════════════════════════════════════════════════════════════════════════
  // WATCHES (3)
  // ══════════════════════════════════════════════════════════════════════════

  // 7. Samsung Galaxy Watch Ultra 2025
  const gwUltraProd = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-watch-ultra-2025' }, {
    vendor: v1._id, category: C['watches']._id,
    name: 'Samsung Galaxy Watch Ultra 2025', slug: 'samsung-galaxy-watch-ultra-2025', brand: 'Samsung',
    description: 'Galaxy Watch Ultra 2025 with titanium case, 1.5" Super AMOLED display, 10ATM + MIL-STD-810H durability, Wear OS 5, 60-hour battery, and advanced health monitoring.',
    shortDescription: 'Samsung\'s most rugged smartwatch with titanium build and 60-hour battery.',
    images: [I.gwUltra, I.gw7, I.gw8, I.gw8Blk, I.gwUltra],
    thumbnail: I.gwUltra,
    basePrice: 89999, compareAtPrice: 99999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Case Color', values: ['Black', 'Silver', 'Titanium'] },
      { key: 'size', label: 'Case Size', values: ['47mm'] },
    ],
    attributes: new Map([['os', 'Wear OS'], ['display', 'Super AMOLED'], ['battery', 'Up to 60 hours'], ['waterproof', '10ATM + MIL-STD-810H'], ['gps', 'Yes']]),
    tags: ['samsung', 'galaxy', 'watch', 'ultra', 'wear-os', 'titanium', 'rugged'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 134, averageRating: 4.6, reviewCount: 67, emiOptions: EMI_HIGH, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(gwUltraProd._id, 'GWULTRA25',
    [{ key: 'color', values: ['Black', 'Silver', 'Titanium'] }, { key: 'size', values: ['47mm'] }],
    89999);

  // 8. Samsung Galaxy Watch 7
  const gw7Prod = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-watch-7' }, {
    vendor: v1._id, category: C['watches']._id,
    name: 'Samsung Galaxy Watch 7', slug: 'samsung-galaxy-watch-7', brand: 'Samsung',
    description: 'Galaxy Watch 7 with Exynos W1000 chip, advanced BioActive Sensor, 40-hour battery, Wear OS 5 + One UI Watch 6, and comprehensive health tracking.',
    shortDescription: 'Samsung Galaxy Watch 7 with Exynos W1000 and advanced health sensors.',
    images: [I.gw7, I.gwUltra, I.gw8, I.gw8Blk, I.gw7],
    thumbnail: I.gw7,
    basePrice: 54999, compareAtPrice: 59999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Case Color', values: ['Silver', 'Gold', 'Black'] },
      { key: 'size', label: 'Case Size', values: ['40mm', '44mm'] },
    ],
    attributes: new Map([['os', 'Wear OS'], ['display', 'Super AMOLED'], ['battery', 'Up to 40 hours (44mm)'], ['waterproof', '5ATM + IP68'], ['gps', 'Yes']]),
    tags: ['samsung', 'galaxy', 'watch', 'wear-os', 'smartwatch'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 223, averageRating: 4.5, reviewCount: 118, emiOptions: EMI_HIGH, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(gw7Prod._id, 'GW7',
    [{ key: 'color', values: ['Silver', 'Gold', 'Black'] }, { key: 'size', values: ['40mm', '44mm'] }],
    54999, { 'Silver+44mm': 59999, 'Gold+44mm': 59999, 'Black+44mm': 59999 });

  // 9. Apple Watch Series 10
  const aw10Prod = await ProductModel.findOneAndUpdate({ slug: 'apple-watch-series-10' }, {
    vendor: v2._id, category: C['watches']._id,
    name: 'Apple Watch Series 10', slug: 'apple-watch-series-10', brand: 'Apple',
    description: 'Apple Watch Series 10 with largest and thinnest Apple Watch display yet, fast charging, sleep apnea detection, water depth app, and Double Tap gesture.',
    shortDescription: 'Apple Watch Series 10 — thinnest ever with sleep apnea detection.',
    images: [I.aw10Blk, I.aw10Slv, I.aw10Rose, I.awS11Rose, I.aw10Blk],
    thumbnail: I.aw10Blk,
    basePrice: 64999, compareAtPrice: 69999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Case Color', values: ['Black', 'Silver', 'Rose Gold'] },
      { key: 'size', label: 'Case Size', values: ['42mm', '46mm'] },
    ],
    attributes: new Map([['os', 'watchOS'], ['display', 'Always-On Retina LTPO OLED'], ['battery', 'Up to 18 hours'], ['waterproof', '50m Water Resistant'], ['gps', 'Yes']]),
    tags: ['apple', 'watch', 'series10', 'watchos', 'smartwatch', 'health'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 198, averageRating: 4.7, reviewCount: 143, emiOptions: EMI_HIGH, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(aw10Prod._id, 'AW10',
    [{ key: 'color', values: ['Black', 'Silver', 'Rose Gold'] }, { key: 'size', values: ['42mm', '46mm'] }],
    64999, { 'Black+46mm': 69999, 'Silver+46mm': 69999, 'Rose Gold+46mm': 69999 });

  // ══════════════════════════════════════════════════════════════════════════
  // AUDIO (3)
  // ══════════════════════════════════════════════════════════════════════════

  // 10. Apple AirPods Max 2
  const airMax2 = await ProductModel.findOneAndUpdate({ slug: 'apple-airpods-max-2' }, {
    vendor: v2._id, category: C['headphone-speaker']._id,
    name: 'Apple AirPods Max 2', slug: 'apple-airpods-max-2', brand: 'Apple',
    description: 'AirPods Max 2 with Apple H2 chip, next-generation Active Noise Cancellation, Transparency mode, Personalized Spatial Audio, USB-C charging, and 30-hour battery life.',
    shortDescription: 'Apple AirPods Max 2 with H2 chip and next-gen ANC.',
    images: [I.airMaxMid, I.airPro3, I.boseQCU, I.airMaxMid, I.airPro3],
    thumbnail: I.airMaxMid,
    basePrice: 69999, compareAtPrice: 75000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Midnight', 'Silver', 'White', 'Black', 'Beige'] },
    ],
    attributes: new Map([['anc', 'Yes'], ['connectivity', 'Bluetooth 5.3'], ['battery', '30 hours'], ['waterproof', 'IPX4']]),
    tags: ['apple', 'airpods', 'max', 'headphone', 'anc', 'spatial-audio'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 156, averageRating: 4.8, reviewCount: 89, emiOptions: EMI_HIGH, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(airMax2._id, 'APMX2',
    [{ key: 'color', values: ['Midnight', 'Silver', 'White', 'Black', 'Beige'] }],
    69999);

  // 11. Sony SRS-ULT50 Portable Speaker
  const sonyUlt50 = await ProductModel.findOneAndUpdate({ slug: 'sony-srs-ult50' }, {
    vendor: v1._id, category: C['speaker']._id,
    name: 'Sony SRS-ULT50 Portable Speaker', slug: 'sony-srs-ult50', brand: 'Sony',
    description: 'Sony SRS-ULT50 with Ultimate MEGA BASS, 30-hour battery life, IP67 waterproof rating, Bluetooth 5.3, and multi-speaker pairing support.',
    shortDescription: 'Sony SRS-ULT50 with Ultimate MEGA BASS and 30-hour battery.',
    images: [I.sonyUlt, I.boseSL, I.jblBB4, I.marshKil, I.sonyUlt],
    thumbnail: I.sonyUlt,
    basePrice: 34999, compareAtPrice: 38999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Black', 'Beige'] },
    ],
    attributes: new Map([['anc', 'No'], ['connectivity', 'Bluetooth 5.3'], ['battery', '30 hours'], ['waterproof', 'IP67']]),
    tags: ['sony', 'speaker', 'portable', 'bass', 'waterproof', 'bluetooth'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 187, averageRating: 4.6, reviewCount: 92, emiOptions: EMI_MID, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(sonyUlt50._id, 'SRSULT50',
    [{ key: 'color', values: ['Black', 'Beige'] }],
    34999);

  // 12. JBL Boombox 4
  const jblBoombox = await ProductModel.findOneAndUpdate({ slug: 'jbl-boombox-4' }, {
    vendor: v1._id, category: C['speaker']._id,
    name: 'JBL Boombox 4', slug: 'jbl-boombox-4', brand: 'JBL',
    description: 'JBL Boombox 4 with massive JBL Pro Sound, IP67 waterproof + dustproof rating, 24-hour playtime, Bluetooth 5.4, and detachable power bank function.',
    shortDescription: 'JBL Boombox 4 — massive sound with 24-hour battery and IP67.',
    images: [I.jblBB4, I.sonyUlt, I.boseSL, I.marshKil, I.jblBB4],
    thumbnail: I.jblBB4,
    basePrice: 59999, compareAtPrice: 65000, currency: 'BDT',
    hasVariants: false,
    variantOptions: [],
    attributes: new Map([['anc', 'No'], ['connectivity', 'Bluetooth 5.4'], ['battery', '24 hours'], ['waterproof', 'IP67']]),
    tags: ['jbl', 'boombox', 'speaker', 'portable', 'party', 'waterproof'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 143, averageRating: 4.7, reviewCount: 76, emiOptions: EMI_MID, isOnlineExclusive: false,
  }, { upsert: true, new: true });

  // ══════════════════════════════════════════════════════════════════════════
  // CAMERA (1)
  // ══════════════════════════════════════════════════════════════════════════

  // 13. DJI Osmo Mobile 7 Gimbal
  const djiMob7Prod = await ProductModel.findOneAndUpdate({ slug: 'dji-osmo-mobile-7' }, {
    vendor: v1._id, category: C['camera']._id,
    name: 'DJI Osmo Mobile 7', slug: 'dji-osmo-mobile-7', brand: 'DJI',
    description: 'DJI Osmo Mobile 7 smartphone gimbal with 3-axis stabilization, ActiveTrack 7.0 subject tracking, auto portrait tracking, built-in extension rod, and 8-hour battery.',
    shortDescription: 'DJI Osmo Mobile 7 gimbal with ActiveTrack 7.0 and 8-hour battery.',
    images: [I.djiMob7, I.djiMob8, I.djiAct5, I.djiMob7, I.djiMob8],
    thumbnail: I.djiMob7,
    basePrice: 14999, compareAtPrice: 17499, currency: 'BDT',
    hasVariants: false,
    variantOptions: [],
    attributes: new Map([['color', 'Black'], ['type', 'Gimbal'], ['video', '4K (via phone)']]),
    tags: ['dji', 'gimbal', 'stabilizer', 'smartphone', 'osmo', 'videography'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 234, averageRating: 4.7, reviewCount: 128, emiOptions: EMI_MID, isOnlineExclusive: false,
  }, { upsert: true, new: true });

  // ══════════════════════════════════════════════════════════════════════════
  // DRONE (1)
  // ══════════════════════════════════════════════════════════════════════════

  // 14. DJI Avata 360 Fly More Combo
  const djiAvataProd = await ProductModel.findOneAndUpdate({ slug: 'dji-avata-360-fly-more-combo' }, {
    vendor: v1._id, category: C['drone']._id,
    name: 'DJI Avata 360 Fly More Combo', slug: 'dji-avata-360-fly-more-combo', brand: 'DJI',
    description: 'DJI Avata 360 FPV drone Fly More Combo with 360° obstacle avoidance, 4K/60fps video, O4 video transmission up to 20km, 23-min flight time, and RC Motion 3 controller included.',
    shortDescription: 'DJI Avata 360 FPV drone with 360° obstacle avoidance and 4K/60fps.',
    images: [I.djiAvata, I.djiNeo2, I.djiMini5, I.djiAct5, I.djiAvata],
    thumbnail: I.djiAvata,
    basePrice: 134999, compareAtPrice: 149999, currency: 'BDT',
    hasVariants: false,
    variantOptions: [],
    attributes: new Map([['color', 'Gray'], ['camera', '4K/60fps 155° FOV'], ['flightTime', '23']]),
    tags: ['dji', 'avata', 'fpv', 'drone', '4k', 'obstacle-avoidance'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 89, averageRating: 4.8, reviewCount: 54, emiOptions: EMI_HIGH, isOnlineExclusive: false,
  }, { upsert: true, new: true });

  // ══════════════════════════════════════════════════════════════════════════
  // CASES (2)
  // ══════════════════════════════════════════════════════════════════════════

  // 15. TORRAS Ostand Slim Case for Galaxy S26 Ultra
  const torrasCase = await ProductModel.findOneAndUpdate({ slug: 'torras-ostand-slim-s26-ultra' }, {
    vendor: v1._id, category: C['cases-protectors']._id,
    name: 'TORRAS Ostand Slim Case for Galaxy S26 Ultra', slug: 'torras-ostand-slim-s26-ultra', brand: 'TORRAS',
    description: 'TORRAS Ostand Slim case for Galaxy S26 Ultra with 360° rotatable ring stand, MagSafe compatible magnetic ring, military-grade drop protection, and ultra-slim 1.5mm design.',
    shortDescription: 'TORRAS Ostand Slim with 360° ring stand and MagSafe compatibility.',
    images: [I.torOS, I.uagP, I.spUH, I.torOS, I.uagP],
    thumbnail: I.torOS,
    basePrice: 3499, compareAtPrice: 3999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Black', 'Clear', 'Blue'] },
    ],
    attributes: new Map([['compatibility', 'Samsung Galaxy S26 Ultra']]),
    tags: ['torras', 'case', 'galaxy', 's26-ultra', 'magsafe', 'ring-stand'],
    warranty: '6 Months Warranty', status: 'approved',
    totalSold: 145, averageRating: 4.5, reviewCount: 67, emiOptions: [], isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(torrasCase._id, 'TORRAS-OS-S26U',
    [{ key: 'color', values: ['Black', 'Clear', 'Blue'] }],
    3499);

  // 16. UAG Plyo MagSafe Case for Galaxy S26 Ultra
  const uagCase = await ProductModel.findOneAndUpdate({ slug: 'uag-plyo-magsafe-s26-ultra' }, {
    vendor: v2._id, category: C['cases-protectors']._id,
    name: 'UAG Plyo MagSafe Case for Galaxy S26 Ultra', slug: 'uag-plyo-magsafe-s26-ultra', brand: 'UAG',
    description: 'Urban Armor Gear Plyo MagSafe case for Galaxy S26 Ultra with military-grade drop protection, built-in MagSafe magnet array, translucent back, and raised screen bumpers.',
    shortDescription: 'UAG Plyo with military-grade protection and MagSafe for S26 Ultra.',
    images: [I.uagP, I.torOS, I.spUH, I.uagP, I.torOS],
    thumbnail: I.uagP,
    basePrice: 4999, compareAtPrice: 5999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Black', 'Clear', 'Blue'] },
    ],
    attributes: new Map([['compatibility', 'Samsung Galaxy S26 Ultra']]),
    tags: ['uag', 'case', 'galaxy', 's26-ultra', 'magsafe', 'military-grade'],
    warranty: '1 Year Warranty', status: 'approved',
    totalSold: 112, averageRating: 4.6, reviewCount: 58, emiOptions: [], isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(uagCase._id, 'UAG-PLYO-S26U',
    [{ key: 'color', values: ['Black', 'Clear', 'Blue'] }],
    4999);

  // ══════════════════════════════════════════════════════════════════════════
  // ROUTER (1)
  // ══════════════════════════════════════════════════════════════════════════

  // 17. TP-Link Deco S7
  const tpDecoS7 = await ProductModel.findOneAndUpdate({ slug: 'tp-link-deco-s7' }, {
    vendor: v1._id, category: C['router']._id,
    name: 'TP-Link Deco S7 (3-Pack)', slug: 'tp-link-deco-s7', brand: 'TP-Link',
    description: 'TP-Link Deco S7 Whole-Home Mesh Wi-Fi System (3-pack) with AX1800 dual-band Wi-Fi 6, covers up to 5,500 sq ft, AI-driven mesh, parental controls, and TP-Link HomeCare security.',
    shortDescription: 'TP-Link Deco S7 3-pack Mesh Wi-Fi 6 — covers 5,500 sq ft.',
    images: [I.tpS7, I.tpX50, I.tpX20, I.tpS7, I.tpX50],
    thumbnail: I.tpS7,
    basePrice: 19999, compareAtPrice: 23999, currency: 'BDT',
    hasVariants: false,
    variantOptions: [],
    attributes: new Map([['color', 'White'], ['standard', 'Wi-Fi 6 (802.11ax)'], ['speed', 'AX1800 1800Mbps']]),
    tags: ['tp-link', 'deco', 'mesh', 'wifi6', 'router', 'networking'],
    warranty: '2 Years Official Warranty', status: 'approved',
    totalSold: 167, averageRating: 4.5, reviewCount: 84, emiOptions: EMI_MID, isOnlineExclusive: false,
  }, { upsert: true, new: true });

  // ══════════════════════════════════════════════════════════════════════════
  // POWER BANKS (2)
  // ══════════════════════════════════════════════════════════════════════════

  // 18. Belkin Qi2 10000mAh Magnetic Power Bank
  const belkinQi = await ProductModel.findOneAndUpdate({ slug: 'belkin-qi2-10000-magnetic' }, {
    vendor: v2._id, category: C['power-bank']._id,
    name: 'Belkin Qi2 10000mAh Magnetic Power Bank', slug: 'belkin-qi2-10000-magnetic', brand: 'Belkin',
    description: 'Belkin BoostCharge Pro Qi2 10000mAh magnetic power bank with 15W Qi2 wireless charging, 20W USB-C PD fast charging, built-in kickstand, and compatible with MagSafe.',
    shortDescription: 'Belkin Qi2 magnetic power bank with 15W wireless and 20W USB-C.',
    images: [I.blkQi, I.blk20k, I.skross20, I.skross10, I.blkQi],
    thumbnail: I.blkQi,
    basePrice: 12999, compareAtPrice: 15999, currency: 'BDT',
    hasVariants: false,
    variantOptions: [],
    attributes: new Map([['color', 'Black'], ['capacity', '10000mAh'], ['charging', '15W Qi2 + 20W USB-C PD']]),
    tags: ['belkin', 'power-bank', 'qi2', 'magsafe', 'wireless', 'magnetic'],
    warranty: '2 Years Belkin Warranty', status: 'approved',
    totalSold: 189, averageRating: 4.6, reviewCount: 97, emiOptions: EMI_MID, isOnlineExclusive: false,
  }, { upsert: true, new: true });

  // 19. Skross Reload 10 PD Power Bank
  const skross10Prod = await ProductModel.findOneAndUpdate({ slug: 'skross-reload-10-pd' }, {
    vendor: v1._id, category: C['power-bank']._id,
    name: 'Skross Reload 10 PD Power Bank', slug: 'skross-reload-10-pd', brand: 'Skross',
    description: 'Skross Reload 10 PD power bank with 10000mAh capacity, 20W USB-C PD output, 22.5W USB-A fast charging, slim 14mm design, and simultaneous dual-device charging.',
    shortDescription: 'Skross Reload 10 — slim 14mm design with 20W USB-C PD.',
    images: [I.skross10, I.skross20, I.blkQi, I.blk20k, I.skross10],
    thumbnail: I.skross10,
    basePrice: 6999, compareAtPrice: 8499, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Black', 'White'] },
    ],
    attributes: new Map([['capacity', '10000mAh'], ['charging', '20W USB-C PD + 22.5W USB-A']]),
    tags: ['skross', 'power-bank', 'pd', 'fast-charge', 'slim', 'portable'],
    warranty: '2 Years Skross Warranty', status: 'approved',
    totalSold: 156, averageRating: 4.4, reviewCount: 73, emiOptions: [], isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(skross10Prod._id, 'SKROSS10PD',
    [{ key: 'color', values: ['Black', 'White'] }],
    6999);

  // ══════════════════════════════════════════════════════════════════════════
  // EARBUDS (1)
  // ══════════════════════════════════════════════════════════════════════════

  // 20. Samsung Galaxy Buds 3 Pro
  const buds3Pro = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-buds-3-pro' }, {
    vendor: v1._id, category: C['earbuds']._id,
    name: 'Samsung Galaxy Buds 3 Pro', slug: 'samsung-galaxy-buds-3-pro', brand: 'Samsung',
    description: 'Galaxy Buds 3 Pro with blade-style open-type design, Adaptive ANC, 360 Audio, 24-bit audio, AI-powered Live Translate, and up to 30 hours total battery with case.',
    shortDescription: 'Samsung Galaxy Buds 3 Pro with Adaptive ANC and 360 Audio.',
    images: [I.buds4Pro, I.airPro3, I.airMaxMid, I.buds4Pro, I.airPro3],
    thumbnail: I.buds4Pro,
    basePrice: 24999, compareAtPrice: 27999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Silver', 'Black'] },
    ],
    attributes: new Map([['anc', 'Yes'], ['connectivity', 'Bluetooth 5.4'], ['battery', '30 hours (with case)'], ['waterproof', 'IPX4']]),
    tags: ['samsung', 'galaxy', 'buds', 'earbuds', 'anc', 'bluetooth'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 213, averageRating: 4.6, reviewCount: 108, emiOptions: EMI_MID, isOnlineExclusive: false,
  }, { upsert: true, new: true });
  await upsertVariants(buds3Pro._id, 'GBD3PRO',
    [{ key: 'color', values: ['Silver', 'Black'] }],
    24999);

  console.log('seed3 complete — 20 products upserted.');
  await mongoose.disconnect();
};

seed3().catch(err => { console.error(err); process.exit(1); });
