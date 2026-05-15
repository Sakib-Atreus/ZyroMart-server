/**
 * Extra product seeds — adds 22 more products without clearing existing data.
 * Requires seedAll.ts to have run first (vendors + categories must exist).
 * Run: npm run seed2
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
  a56Olive: CDN + 'galaxy-a56-5g-12gb-256gb-olive181.jpeg',
  s25Fe:    CDN + 'samsung-galaxy-s25-fe-black881.jpeg',
  s26Std:   CDN + 'Samsung%20Galaxy%20S26%20(12/256GB)/samsung-galaxy-s26.jpeg-1.jpeg',
  ip16e:    CDN + 'iphone-16e-white803.jpeg',
  ip16:     CDN + 'iphone-16-128gb-teal.jpeg',
  ipAir:    CDN + 'iphone-air-space-black565.jpeg',
  ip17:     CDN + 'Offer%20Gift/apple-iphone-17-mist-blue877-1771129124028.jpeg',
  ip17Pro:  CDN + 'Offer%20Gift/iphone-17-pro-deep-blue238-1771129631326.jpeg',
  ip17Max:  CDN + 'Offer%20Gift/iphone-17-pro-max-cosmic-orange565-1771129691561.jpeg',
  // MacBook
  mbProBlk:  CDN + 'apple/macbook-pro-m5-pro-chip-14-inch.jpeg',
  mbProSlv:  CDN + 'apple/macbook-pro-m5-pro-chip-14-inch-silver.jpeg',
  mbAirStar: CDN + 'apple/macbook-air-m5-15-inch-starlight-1.jpeg',
  mbAirMid:  CDN + 'apple/macbook-air-m5-15-inch-midnight-1-1775365043486.jpeg',
  mbNeoInd:  CDN + 'apple/macbook-neo-indigo.jpeg',
  // iPad
  ipadAirGrey:  CDN + 'apple/ipad-air-11-inch-wifi-m4-chip-space-grey.jpeg',
  ipadAirPurp:  CDN + 'apple/ipad-air-11-inch-wifi-m4-chip-purple.jpeg',
  ipadAirStar:  CDN + 'apple/ipad-air-11-inch-wifi-m4-chip-starlight.jpeg',
  ipadMini7:    CDN + 'ipad-mini-7-wifi-128gb-space-gray114.jpeg',
  ipad11Blue:   CDN + 'Offer%20Gift/ipad-11-inch-wifi-a16-11th-gen300-1774330981890.jpeg',
  ipad11Slv:    CDN + 'ipad-11-inch-wifi-a16-11th-gen-256gb-silver163.jpeg',
  ipadPro11Slv: CDN + 'Offer%20Gift/ipad-pro-11-inch-wifi-m5-chip-silver-1318-1771132991873.jpeg',
  // Watches
  awUltra3:  CDN + 'apple-watch-ultra-3-black-1966.jpeg',
  awS11Rose: CDN + 'apple-watch-series-11-rose-gold-1520.jpeg',
  aw10Blk:   CDN + 'apple-watch-10-jet-black-46mm.jpeg',
  aw10Slv:   CDN + 'apple-watch-10--46mm-silver-aluminum.jpeg',
  aw10Rose:  CDN + 'apple-watch-10-rose-gold-42mm.jpeg',
  awSE3:     CDN + 'apple-watch-se-3-starlight51.jpeg',
  // Headphones & Speakers
  boseQCU:  CDN + 'bose-quietcomfort-ultra-headphones-2nd-gen826.jpeg',
  marshMon: CDN + 'marshall-monitor-iii-anc-headphone485.jpeg',
  sonyXM6:  CDN + 'sony-wh-1000xm6-wirerless-headphones-blue-2893.jpeg',
  marshKil: CDN + 'marshall-kilburn-iii-portable-speaker98.jpeg',
  boseSL:   CDN + 'bose-soundlink-home-bluetooth-speaker-warm-wood582.jpeg',
  sonyUlt:  CDN + 'sony-srs-ult50-portable-wireless-speaker725.jpeg',
  jblBB4:   CDN + 'jbl-boombox-4-black3.jpeg',
  jblOTG2:  CDN + 'JBL%20PartyBox%20On-the-Go%202%20Speaker/jbl-partybox-on-the-go-2-portable-speaker-4.jpeg',
  // PC & Gaming
  appleTP: CDN + 'Apple%20Magic%20Multi-Touch%20Surface%20USB-C%20Trackpad/apple-magic-multi%E2%80%91touch-surface-usb%E2%80%91c-trackpad-2.jpeg',
  logErgo: CDN + 'logitech/logitech-ergo-series-lift-vertical-ergonomic-mouse-2.jpeg',
  logM240: CDN + 'logitech-m240-silent-bluetooth-mouse-graphite.jpeg',
  razerBW: CDN + 'razer/razer-blackwidow-x-tenkeyless-gaming-keyboard.jpeg',
  logG321: CDN + 'Logitech%20G321%20LIGHTSPEED%20Wireless%20Gaming%20Headset/logitch-g321-lightspeed-gaming-headset.jpeg',
  logG733: CDN + 'Logitech%20G733%20LIGHTSPEED%20Wireless%20RGB%20Gaming%20Headset/logitech-g733-lightspeed-gaming-headset-1770713024484.jpeg',
  // Power Banks
  skross20: CDN + 'skross-reload-20-pd-100w-power-bank247.jpeg',
  skross10: CDN + 'skross-reload-10-power-bank498.jpeg',
  meko20:   CDN + 'meko-m20s-20000mah-power-bank928.jpeg',
  blk20k:   CDN + 'belkin-20000mah-3-port-laptop-power-bank.jpeg',
  blkQi:    CDN + 'belkin-qi2-10000mah-magnetic-power-bank-1.jpeg',
  // Camera & Gimbal
  djiAct5:  CDN + 'dji-osmo-action-5-pro-adventure-combo.jpeg',
  djiNano:  CDN + 'dji-osmo-nano-action-camera122.jpeg',
  insta360: CDN + 'insta360-x5-essentials-bundle-action-camera673.jpeg',
  djiMob8:  CDN + 'dji-osmo-mobile-8328.jpeg',
  djiMob7:  CDN + 'dji-osmo-mobile-7-gimbal-1768.jpeg',
  // Drones
  djiNeo2:  CDN + 'dji-neo-2-fly-more-combo-drone-4793.jpeg',
  djiFlip:  CDN + 'dji-flip-rc-n3-standard-drone442.jpeg',
  djiMini5: CDN + 'dji-mini-5-pro-fly-more-combo-plus-with-rc2110.jpeg',
  djiMini3: CDN + 'dji-mini-3-fly-more-combo-drone895.jpeg',
  djiAvata: CDN + 'dji/dji-avata-360-fly-more-combo-2.jpeg',
  // Cases
  pitRed: CDN + 'pitaka-edge-ultra-slim-case-for-iphone-17-pro-red354.jpeg',
  pitGrn: CDN + 'pitaka-edge-ultra-slim-case-for-iphone-17-pro-1766.jpeg',
  spUH:   CDN + 'Spigen%20Ultra%20Hybrid%20MagFit%20Case%20for%20Galaxy%20S26%20Ultra/spigen-ultra-hyrbird-magfit-case-for-galaxy-s26-ultra-1.jpeg',
  spTA:   CDN + 'Spigen%20Tough%20Armor%20(MagFit)%20Case%20for%20Galaxy%20S26%20Ultra/spigen-tough-armor-magfit-case-for-galaxy-s26-ultra.jpeg',
  torOS:  CDN + 'TORRAS%20Ostand%20Slim%20Case%20for%20Galaxy%20S26%20Ultra/torras-ostand-slim-case-for-galaxy-s26-ultra.jpeg',
  uagP:   CDN + 'UAG%20Plyo%20MagSafe%20Case%20for%20Galaxy%20S26%20Ultra/uag-plyo-magsafe-case-for-galaxy-s26-ultra.jpeg',
  // Router
  tpX50:   CDN + 'tp-link-deco-x50-router977.jpeg',
  tpAX73:  CDN + 'tp-link-archer-ax73-dual-band-gigabit-router525.jpeg',
  tpX503p: CDN + 'tp-link-deco-x50-router-3-pack739.jpeg',
  tpX20:   CDN + 'tp-link/tp-link-deco-x20-ax1800-mesh-wi-fi-router-2.jpeg',
  tpS7:    CDN + 'tp-link-deco-s7-router-new.jpg-new658.jpeg',
  // Gadget
  xiaomiCam: CDN + 'xiaomi-smart-camera-c301585.jpeg',
};

const EMI_MID     = [{ months: 6, monthlyRate: 0, minAmount: 5000 }, { months: 12, monthlyRate: 0.0075, minAmount: 10000 }];
const EMI_HIGH    = [{ months: 6, monthlyRate: 0, minAmount: 10000 }, { months: 12, monthlyRate: 0.0075, minAmount: 15000 }, { months: 18, monthlyRate: 0.01, minAmount: 20000 }];
const EMI_PREMIUM = [{ months: 6, monthlyRate: 0, minAmount: 20000 }, { months: 12, monthlyRate: 0.0075, minAmount: 20000 }, { months: 18, monthlyRate: 0.01, minAmount: 30000 }];

export const seed2 = async () => {
  await mongoose.connect(config.db_url as string);
  console.log('Connected. Seeding extra products…');

  const [v1, v2] = await Promise.all([
    VendorModel.findOne({ slug: 'techzone-bd' }),
    VendorModel.findOne({ slug: 'gadgethub' }),
  ]);
  if (!v1 || !v2) throw new Error('Run seedAll.ts first — vendors not found.');

  const catList = await CategoryModel.find({
    slug: { $in: ['phones', 'macbook', 'ipad', 'watches', 'headphone-speaker', 'speaker', 'earbuds', 'pc-accessories', 'gaming', 'power-bank', 'router', 'cases-protectors', 'camera', 'gadget', 'drone'] },
  });
  const C: Record<string, typeof catList[0]> = {};
  for (const c of catList) C[c.slug] = c;
  if (!catList.length) throw new Error('Run seedAll.ts first — categories not found.');

  // ══════════════════════════════════════════════════════════════════════════
  // PHONES (3)
  // ══════════════════════════════════════════════════════════════════════════

  // 1. Samsung Galaxy A56 5G — color × storage
  const a56 = await ProductModel.findOneAndUpdate({ slug: 'samsung-galaxy-a56-5g' }, {
    vendor: v1._id, category: C['phones']._id,
    name: 'Samsung Galaxy A56 5G', slug: 'samsung-galaxy-a56-5g', brand: 'Samsung',
    description: 'Samsung Galaxy A56 5G with Exynos 1580, 6.7" Super AMOLED 120Hz display, 50MP OIS triple camera, 5000mAh battery, and IP67 rating.',
    shortDescription: 'Mid-range Samsung 5G with 50MP OIS camera and IP67.',
    images: [I.a56Olive, I.s25Fe, I.s26Std, I.a56Olive, I.s25Fe],
    thumbnail: I.a56Olive,
    basePrice: 44999, compareAtPrice: 49999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Green', 'Blue', 'White', 'Black'] },
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB'] },
    ],
    attributes: new Map([['os', 'Android'], ['processor', 'Exynos 1580'], ['ram', '8GB'], ['display', 'Super AMOLED 120Hz'], ['displaySize', '6.7'], ['rearCamera', '50MP OIS + 12MP + 5MP'], ['battery', '5000'], ['network', '5G'], ['nfc', 'Yes']]),
    tags: ['samsung', 'galaxy', 'a56', '5g', 'mid-range', 'exynos'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 189, averageRating: 4.4, reviewCount: 76, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(a56._id, 'A565G',
    [{ key: 'color', values: ['Green', 'Blue', 'White', 'Black'] }, { key: 'storage', values: ['128GB', '256GB'] }],
    44999, { 'Green+256GB': 49999, 'Blue+256GB': 49999, 'White+256GB': 49999, 'Black+256GB': 49999 });

  // 2. Apple iPhone 16e — color × storage
  const ip16eProd = await ProductModel.findOneAndUpdate({ slug: 'apple-iphone-16e' }, {
    vendor: v2._id, category: C['phones']._id,
    name: 'Apple iPhone 16e', slug: 'apple-iphone-16e', brand: 'Apple',
    description: 'iPhone 16e with A16 Bionic chip, 6.1" Super Retina XDR OLED, 48MP Fusion camera, Apple Intelligence support, and USB-C charging.',
    shortDescription: 'Affordable iPhone with A16 Bionic and Apple Intelligence.',
    images: [I.ip16e, I.ip16, I.ip17, I.ipAir, I.ip17Pro],
    thumbnail: I.ip16e,
    basePrice: 89999, compareAtPrice: 96000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Black', 'White'] },
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB', '512GB'] },
    ],
    attributes: new Map([['os', 'iOS'], ['processor', 'Apple A16 Bionic'], ['ram', '8GB'], ['display', 'Super Retina XDR OLED'], ['displaySize', '6.1'], ['rearCamera', '48MP Fusion'], ['battery', '3279'], ['network', '5G'], ['nfc', 'Yes']]),
    tags: ['apple', 'iphone', '16e', 'ios', '5g', 'a16'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 245, averageRating: 4.6, reviewCount: 112, emiOptions: EMI_HIGH,
  }, { upsert: true, new: true });
  await upsertVariants(ip16eProd._id, 'IP16E',
    [{ key: 'color', values: ['Black', 'White'] }, { key: 'storage', values: ['128GB', '256GB', '512GB'] }],
    89999, { 'Black+256GB': 104999, 'White+256GB': 104999, 'Black+512GB': 129999, 'White+512GB': 129999 });

  // 3. Apple iPhone Air — color × storage
  const ipAirProd = await ProductModel.findOneAndUpdate({ slug: 'apple-iphone-air' }, {
    vendor: v2._id, category: C['phones']._id,
    name: 'Apple iPhone Air', slug: 'apple-iphone-air', brand: 'Apple',
    description: 'Apple iPhone Air — the thinnest iPhone at 5.65mm with A18 chip, 6.6" Super Retina XDR OLED, 48MP Fusion + 12MP Ultra Wide, and all-day battery.',
    shortDescription: 'Apple\'s thinnest iPhone with A18 chip and 6.6" display.',
    images: [I.ipAir, I.ip16e, I.ip16, I.ip17, I.ip17Max],
    thumbnail: I.ipAir,
    basePrice: 144999, compareAtPrice: 156000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Black', 'White', 'Blue', 'Green'] },
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB', '512GB'] },
    ],
    attributes: new Map([['os', 'iOS'], ['processor', 'Apple A18'], ['ram', '8GB'], ['display', 'Super Retina XDR OLED'], ['displaySize', '6.6'], ['rearCamera', '48MP Fusion + 12MP Ultra Wide'], ['battery', '3000'], ['network', '5G'], ['nfc', 'Yes']]),
    tags: ['apple', 'iphone', 'air', 'thin', 'a18', 'ios'],
    warranty: '1 Year Apple Warranty', status: 'approved', isOnlineExclusive: true,
    totalSold: 178, averageRating: 4.7, reviewCount: 89, emiOptions: EMI_HIGH,
  }, { upsert: true, new: true });
  await upsertVariants(ipAirProd._id, 'IPAIR',
    [{ key: 'color', values: ['Black', 'White', 'Blue', 'Green'] }, { key: 'storage', values: ['128GB', '256GB', '512GB'] }],
    144999, {
      'Black+256GB': 164999, 'White+256GB': 164999, 'Blue+256GB': 164999, 'Green+256GB': 164999,
      'Black+512GB': 194999, 'White+512GB': 194999, 'Blue+512GB': 194999, 'Green+512GB': 194999,
    });

  // ══════════════════════════════════════════════════════════════════════════
  // MACBOOK (1)
  // ══════════════════════════════════════════════════════════════════════════

  // 4. MacBook Pro 14" M5 Pro — color × RAM × storage
  const mbpro = await ProductModel.findOneAndUpdate({ slug: 'apple-macbook-pro-14-m5-pro' }, {
    vendor: v2._id, category: C['macbook']._id,
    name: 'Apple MacBook Pro 14" (M5 Pro)', slug: 'apple-macbook-pro-14-m5-pro', brand: 'Apple',
    description: 'MacBook Pro 14" with M5 Pro chip, Liquid Retina XDR display, three Thunderbolt 5 ports, and up to 24 hours battery life.',
    shortDescription: 'Pro MacBook with M5 Pro, Liquid Retina XDR and Thunderbolt 5.',
    images: [I.mbProBlk, I.mbProSlv, I.mbAirStar, I.mbAirMid, I.mbNeoInd],
    thumbnail: I.mbProBlk,
    basePrice: 299999, compareAtPrice: 332000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Space Black', 'Silver'] },
      { key: 'ram', label: 'Memory', values: ['24GB', '48GB'] },
      { key: 'storage', label: 'Storage', values: ['512GB SSD', '1TB SSD', '2TB SSD'] },
    ],
    attributes: new Map([['os', 'macOS Sequoia'], ['processor', 'Apple M5 Pro (14-core CPU)'], ['display', 'Liquid Retina XDR'], ['displaySize', '14.2'], ['battery', 'Up to 24 hours'], ['wifi', 'Wi-Fi 6E'], ['bluetooth', 'Bluetooth 5.3']]),
    tags: ['apple', 'macbook', 'pro', 'm5', 'laptop', '14inch'],
    warranty: '1 Year Apple Warranty', status: 'approved', isOnlineExclusive: true,
    totalSold: 45, averageRating: 4.9, reviewCount: 28, emiOptions: EMI_PREMIUM,
  }, { upsert: true, new: true });
  await upsertVariants(mbpro._id, 'MBP14M5',
    [{ key: 'color', values: ['Space Black', 'Silver'] }, { key: 'ram', values: ['24GB', '48GB'] }, { key: 'storage', values: ['512GB SSD', '1TB SSD', '2TB SSD'] }],
    299999, {
      'Space Black+48GB+512GB SSD': 359999, 'Silver+48GB+512GB SSD': 359999,
      'Space Black+24GB+1TB SSD': 339999, 'Silver+24GB+1TB SSD': 339999,
      'Space Black+48GB+1TB SSD': 399999, 'Silver+48GB+1TB SSD': 399999,
      'Space Black+24GB+2TB SSD': 379999, 'Silver+24GB+2TB SSD': 379999,
      'Space Black+48GB+2TB SSD': 449999, 'Silver+48GB+2TB SSD': 449999,
    }, 10);

  // ══════════════════════════════════════════════════════════════════════════
  // iPAD (3)
  // ══════════════════════════════════════════════════════════════════════════

  // 5. iPad Air 11" M4 — color × storage × connectivity
  const ipadAirProd = await ProductModel.findOneAndUpdate({ slug: 'apple-ipad-air-11-m4' }, {
    vendor: v2._id, category: C['ipad']._id,
    name: 'Apple iPad Air 11" (M4)', slug: 'apple-ipad-air-11-m4', brand: 'Apple',
    description: 'iPad Air 11" with M4 chip, Liquid Retina display, Apple Pencil Pro and Magic Keyboard Folio support, and all-day battery life.',
    shortDescription: 'Versatile iPad Air with M4 chip and all-day battery.',
    images: [I.ipadAirGrey, I.ipadAirPurp, I.ipadAirStar, I.ipadMini7, I.ipad11Blue],
    thumbnail: I.ipadAirGrey,
    basePrice: 87999, compareAtPrice: 96000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Space Gray', 'Purple', 'Starlight', 'Blue'] },
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB', '512GB'] },
      { key: 'connectivity', label: 'Connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] },
    ],
    attributes: new Map([['os', 'iPadOS 17'], ['processor', 'Apple M4'], ['display', 'Liquid Retina (60Hz)'], ['displaySize', '11'], ['battery', '28.93Wh']]),
    tags: ['apple', 'ipad', 'air', 'm4', 'tablet'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 142, averageRating: 4.7, reviewCount: 68, emiOptions: EMI_HIGH,
  }, { upsert: true, new: true });
  await upsertVariants(ipadAirProd._id, 'IPADAIRM4',
    [{ key: 'color', values: ['Space Gray', 'Purple', 'Starlight', 'Blue'] }, { key: 'storage', values: ['128GB', '256GB', '512GB'] }, { key: 'connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] }],
    87999, {
      'Space Gray+256GB+Wi-Fi': 107999, 'Purple+256GB+Wi-Fi': 107999, 'Starlight+256GB+Wi-Fi': 107999, 'Blue+256GB+Wi-Fi': 107999,
      'Space Gray+512GB+Wi-Fi': 137999, 'Purple+512GB+Wi-Fi': 137999, 'Starlight+512GB+Wi-Fi': 137999, 'Blue+512GB+Wi-Fi': 137999,
      'Space Gray+128GB+Wi-Fi + Cellular': 107999, 'Purple+128GB+Wi-Fi + Cellular': 107999,
      'Space Gray+256GB+Wi-Fi + Cellular': 127999, 'Blue+256GB+Wi-Fi + Cellular': 127999,
    }, 20);

  // 6. Apple iPad mini 7 — color × storage
  const ipadMini = await ProductModel.findOneAndUpdate({ slug: 'apple-ipad-mini-7' }, {
    vendor: v2._id, category: C['ipad']._id,
    name: 'Apple iPad mini 7', slug: 'apple-ipad-mini-7', brand: 'Apple',
    description: 'iPad mini 7 with A17 Pro chip, 8.3" Liquid Retina display, Apple Intelligence, Apple Pencil Pro support, and USB-C.',
    shortDescription: 'Compact iPad mini with A17 Pro and Apple Intelligence.',
    images: [I.ipadMini7, I.ipad11Blue, I.ipad11Slv, I.ipadAirGrey, I.ipadPro11Slv],
    thumbnail: I.ipadMini7,
    basePrice: 67999, compareAtPrice: 74000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'color', label: 'Color', values: ['Space Gray', 'Starlight', 'Purple', 'Blue'] },
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB', '512GB'] },
    ],
    attributes: new Map([['os', 'iPadOS 18'], ['processor', 'Apple A17 Pro'], ['display', 'Liquid Retina (60Hz)'], ['displaySize', '8.3'], ['battery', '19.3Wh']]),
    tags: ['apple', 'ipad', 'mini', 'a17', 'compact', 'tablet'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 98, averageRating: 4.8, reviewCount: 47, emiOptions: EMI_HIGH,
  }, { upsert: true, new: true });
  await upsertVariants(ipadMini._id, 'IPADMINI7',
    [{ key: 'color', values: ['Space Gray', 'Starlight', 'Purple', 'Blue'] }, { key: 'storage', values: ['128GB', '256GB', '512GB'] }],
    67999, {
      'Space Gray+256GB': 84999, 'Starlight+256GB': 84999, 'Purple+256GB': 84999, 'Blue+256GB': 84999,
      'Space Gray+512GB': 109999, 'Starlight+512GB': 109999, 'Purple+512GB': 109999, 'Blue+512GB': 109999,
    }, 25);

  // 7. Apple iPad 11th Gen (A16) — storage × connectivity
  const ipad11 = await ProductModel.findOneAndUpdate({ slug: 'apple-ipad-11th-gen-a16' }, {
    vendor: v2._id, category: C['ipad']._id,
    name: 'Apple iPad 11th Gen (A16)', slug: 'apple-ipad-11th-gen-a16', brand: 'Apple',
    description: 'Apple iPad 11th gen with A16 chip, 11" Liquid Retina display, Apple Intelligence, USB-C, and support for Apple Pencil Pro.',
    shortDescription: 'Everyday iPad with A16 chip and Apple Intelligence.',
    images: [I.ipad11Blue, I.ipad11Slv, I.ipadMini7, I.ipadAirGrey, I.ipadAirPurp],
    thumbnail: I.ipad11Blue,
    basePrice: 55999, compareAtPrice: 61000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'storage', label: 'Storage', values: ['128GB', '256GB', '512GB'] },
      { key: 'connectivity', label: 'Connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] },
    ],
    attributes: new Map([['os', 'iPadOS 18'], ['processor', 'Apple A16'], ['display', 'Liquid Retina (60Hz)'], ['displaySize', '11'], ['battery', '28.65Wh']]),
    tags: ['apple', 'ipad', '11th', 'a16', 'tablet', 'entry'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 231, averageRating: 4.5, reviewCount: 103, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(ipad11._id, 'IPAD11A16',
    [{ key: 'storage', values: ['128GB', '256GB', '512GB'] }, { key: 'connectivity', values: ['Wi-Fi', 'Wi-Fi + Cellular'] }],
    55999, {
      '256GB+Wi-Fi': 69999, '512GB+Wi-Fi': 91999,
      '128GB+Wi-Fi + Cellular': 74999, '256GB+Wi-Fi + Cellular': 88999, '512GB+Wi-Fi + Cellular': 109999,
    }, 35);

  // ══════════════════════════════════════════════════════════════════════════
  // WATCHES (2)
  // ══════════════════════════════════════════════════════════════════════════

  // 8. Apple Watch Ultra 3 — color (single)
  const awUltra = await ProductModel.findOneAndUpdate({ slug: 'apple-watch-ultra-3' }, {
    vendor: v2._id, category: C['watches']._id,
    name: 'Apple Watch Ultra 3', slug: 'apple-watch-ultra-3', brand: 'Apple',
    description: 'Apple Watch Ultra 3 with titanium case, 49mm always-on Retina display, 72-hour battery in low-power mode, dual-frequency GPS, and Action Button.',
    shortDescription: 'Apple\'s most rugged watch with 72-hour battery and titanium case.',
    images: [I.awUltra3, I.awS11Rose, I.aw10Blk, I.aw10Slv, I.awSE3],
    thumbnail: I.awUltra3,
    basePrice: 119999, compareAtPrice: 132000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Band Color', values: ['Black', 'White', 'Orange Trail'] }],
    attributes: new Map([['os', 'watchOS'], ['display', 'Always-On Retina LTPO2'], ['battery', 'Up to 72 hours (low power)'], ['waterproof', '100m Water Resistant'], ['gps', 'Yes'], ['size', '49mm']]),
    tags: ['apple', 'watch', 'ultra', 'titanium', 'gps', 'rugged'],
    warranty: '1 Year Apple Warranty', status: 'approved', isOnlineExclusive: true,
    totalSold: 62, averageRating: 4.9, reviewCount: 34, emiOptions: EMI_PREMIUM,
  }, { upsert: true, new: true });
  await upsertVariants(awUltra._id, 'AWULT3', [{ key: 'color', values: ['Black', 'White', 'Orange Trail'] }], 119999, {}, 15);

  // 9. Apple Watch SE 3 — size × color
  const awSE = await ProductModel.findOneAndUpdate({ slug: 'apple-watch-se-3' }, {
    vendor: v2._id, category: C['watches']._id,
    name: 'Apple Watch SE 3', slug: 'apple-watch-se-3', brand: 'Apple',
    description: 'Apple Watch SE 3 with S9 chip, crash detection, fall detection, and 18-hour battery in an affordable aluminum case.',
    shortDescription: 'Affordable Apple Watch with crash detection and S9 chip.',
    images: [I.awSE3, I.aw10Slv, I.aw10Rose, I.aw10Blk, I.awS11Rose],
    thumbnail: I.awSE3,
    basePrice: 29999, compareAtPrice: 33000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [
      { key: 'size', label: 'Size', values: ['40mm', '44mm'] },
      { key: 'color', label: 'Color', values: ['Starlight', 'Midnight', 'Silver'] },
    ],
    attributes: new Map([['os', 'watchOS'], ['display', 'Retina LTPO2'], ['battery', 'Up to 18 hours'], ['waterproof', '50m Water Resistant'], ['gps', 'Yes']]),
    tags: ['apple', 'watch', 'se', 'affordable', 'smartwatch'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 267, averageRating: 4.6, reviewCount: 119, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(awSE._id, 'AWSE3',
    [{ key: 'size', values: ['40mm', '44mm'] }, { key: 'color', values: ['Starlight', 'Midnight', 'Silver'] }],
    29999, { '44mm+Starlight': 33999, '44mm+Midnight': 33999, '44mm+Silver': 33999 });

  // ══════════════════════════════════════════════════════════════════════════
  // HEADPHONES (2)
  // ══════════════════════════════════════════════════════════════════════════

  // 10. Bose QuietComfort Ultra Headphones 2nd Gen — color
  const boseQC = await ProductModel.findOneAndUpdate({ slug: 'bose-quietcomfort-ultra-headphones-2nd-gen' }, {
    vendor: v1._id, category: C['headphone-speaker']._id,
    name: 'Bose QuietComfort Ultra Headphones 2nd Gen', slug: 'bose-quietcomfort-ultra-headphones-2nd-gen', brand: 'Bose',
    description: 'Bose QC Ultra 2nd Gen with Custom Tune spatial audio, world-class ANC, Immersive Audio mode, 24-hour battery, and multi-device Multipoint connection.',
    shortDescription: 'Bose flagship ANC headphones with Immersive Audio and 24-hour battery.',
    images: [I.boseQCU, I.marshMon, I.sonyXM6, I.boseQCU, I.marshMon],
    thumbnail: I.boseQCU,
    basePrice: 54990, compareAtPrice: 60000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black', 'White Smoke', 'Sandstone'] }],
    attributes: new Map([['type', 'Over-Ear'], ['anc', 'Yes'], ['connectivity', 'Bluetooth 5.3'], ['battery', '24 hours (ANC on)'], ['waterproof', 'None']]),
    tags: ['bose', 'headphones', 'anc', 'quietcomfort', 'wireless', 'spatial-audio'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 88, averageRating: 4.8, reviewCount: 43, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(boseQC._id, 'BOSEQCU2', [{ key: 'color', values: ['Black', 'White Smoke', 'Sandstone'] }], 54990, {}, 25);

  // 11. Marshall Monitor III ANC — color
  const marshM3 = await ProductModel.findOneAndUpdate({ slug: 'marshall-monitor-iii-anc' }, {
    vendor: v1._id, category: C['headphone-speaker']._id,
    name: 'Marshall Monitor III ANC Headphones', slug: 'marshall-monitor-iii-anc', brand: 'Marshall',
    description: 'Marshall Monitor III ANC with hybrid ANC, custom 40mm dynamic drivers, 100-hour total battery, Bluetooth 5.3, and iconic Marshall design.',
    shortDescription: 'Marshall over-ear ANC headphones with iconic design and 100h battery.',
    images: [I.marshMon, I.boseQCU, I.sonyXM6, I.marshMon, I.boseQCU],
    thumbnail: I.marshMon,
    basePrice: 39990, compareAtPrice: 45000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black', 'Cream'] }],
    attributes: new Map([['type', 'Over-Ear'], ['anc', 'Yes'], ['connectivity', 'Bluetooth 5.3'], ['battery', '30 hrs (ANC on) + 70 hrs case = 100 hrs'], ['waterproof', 'None']]),
    tags: ['marshall', 'headphones', 'anc', 'wireless', 'over-ear'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 76, averageRating: 4.6, reviewCount: 38, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(marshM3._id, 'MARSHM3', [{ key: 'color', values: ['Black', 'Cream'] }], 39990, {}, 30);

  // ══════════════════════════════════════════════════════════════════════════
  // SPEAKERS (2)
  // ══════════════════════════════════════════════════════════════════════════

  // 12. Marshall Kilburn III — color
  const kilburn = await ProductModel.findOneAndUpdate({ slug: 'marshall-kilburn-iii-speaker' }, {
    vendor: v1._id, category: C['speaker']._id,
    name: 'Marshall Kilburn III Portable Speaker', slug: 'marshall-kilburn-iii-speaker', brand: 'Marshall',
    description: 'Marshall Kilburn III portable Bluetooth speaker with 20W stereo sound, 24-hour battery, IP67 waterproofing, and classic Marshall styling.',
    shortDescription: 'Marshall portable speaker with 20W stereo and IP67 waterproofing.',
    images: [I.marshKil, I.boseSL, I.sonyUlt, I.jblBB4, I.jblOTG2],
    thumbnail: I.marshKil,
    basePrice: 32999, compareAtPrice: 37000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black', 'Cream'] }],
    attributes: new Map([['type', 'Portable Bluetooth Speaker'], ['anc', 'No'], ['connectivity', 'Bluetooth 5.3'], ['battery', 'Up to 24 hours'], ['waterproof', 'IP67']]),
    tags: ['marshall', 'speaker', 'portable', 'bluetooth', 'waterproof'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 93, averageRating: 4.6, reviewCount: 51, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(kilburn._id, 'MARSHKIL3', [{ key: 'color', values: ['Black', 'Cream'] }], 32999, {}, 30);

  // 13. Bose SoundLink Home Speaker — color
  const boseSLH = await ProductModel.findOneAndUpdate({ slug: 'bose-soundlink-home-speaker' }, {
    vendor: v1._id, category: C['speaker']._id,
    name: 'Bose SoundLink Home Bluetooth Speaker', slug: 'bose-soundlink-home-speaker', brand: 'Bose',
    description: 'Bose SoundLink Home with 360° omnidirectional sound, SimpleSync multi-room pairing, 12-hour battery, and USB-C charging.',
    shortDescription: '360° Bose home speaker with SimpleSync multi-room audio.',
    images: [I.boseSL, I.marshKil, I.sonyUlt, I.jblBB4, I.jblOTG2],
    thumbnail: I.boseSL,
    basePrice: 27999, compareAtPrice: 32000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Warm Wood', 'Black'] }],
    attributes: new Map([['type', 'Home Bluetooth Speaker'], ['anc', 'No'], ['connectivity', 'Bluetooth 5.3'], ['battery', 'Up to 12 hours'], ['waterproof', 'None']]),
    tags: ['bose', 'speaker', 'home', 'bluetooth', '360'],
    warranty: '1 Year Official Warranty', status: 'approved',
    totalSold: 67, averageRating: 4.5, reviewCount: 32, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(boseSLH._id, 'BOSESLH', [{ key: 'color', values: ['Warm Wood', 'Black'] }], 27999, {}, 30);

  // ══════════════════════════════════════════════════════════════════════════
  // PC ACCESSORIES (2)
  // ══════════════════════════════════════════════════════════════════════════

  // 14. Apple Magic Trackpad USB-C — color
  const appleTrackpad = await ProductModel.findOneAndUpdate({ slug: 'apple-magic-trackpad-usb-c' }, {
    vendor: v2._id, category: C['pc-accessories']._id,
    name: 'Apple Magic Multi-Touch Trackpad (USB-C)', slug: 'apple-magic-trackpad-usb-c', brand: 'Apple',
    description: 'Apple Magic Trackpad with USB-C charging, Force Touch, haptic feedback, and seamless macOS gesture support.',
    shortDescription: 'Apple Magic Trackpad with USB-C and Force Touch.',
    images: [I.appleTP, I.logM240, I.logErgo, I.appleTP, I.logM240],
    thumbnail: I.appleTP,
    basePrice: 12999, compareAtPrice: 14500, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Silver', 'Space Gray', 'Black'] }],
    attributes: new Map([['connectivity', 'Bluetooth + USB-C'], ['compatibility', 'macOS, iPadOS'], ['battery', 'Rechargeable (1 month per charge)']]),
    tags: ['apple', 'trackpad', 'magic', 'usb-c', 'macos'],
    warranty: '1 Year Apple Warranty', status: 'approved',
    totalSold: 134, averageRating: 4.7, reviewCount: 62, emiOptions: [],
  }, { upsert: true, new: true });
  await upsertVariants(appleTrackpad._id, 'APPLETP', [{ key: 'color', values: ['Silver', 'Space Gray', 'Black'] }], 12999, {}, 40);

  // 15. Logitech Lift Vertical Ergonomic Mouse — color
  const liftMouse = await ProductModel.findOneAndUpdate({ slug: 'logitech-lift-vertical-ergonomic-mouse' }, {
    vendor: v1._id, category: C['pc-accessories']._id,
    name: 'Logitech Lift Vertical Ergonomic Mouse', slug: 'logitech-lift-vertical-ergonomic-mouse', brand: 'Logitech',
    description: 'Logitech Lift Vertical Mouse with 57° natural grip, Bluetooth + Logi Bolt USB, 4000 DPI, and 2-year battery life.',
    shortDescription: 'Ergonomic vertical mouse with Bluetooth and 2-year battery.',
    images: [I.logErgo, I.logM240, I.appleTP, I.logErgo, I.logM240],
    thumbnail: I.logErgo,
    basePrice: 7999, compareAtPrice: 9500, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Graphite', 'Off White', 'Rose'] }],
    attributes: new Map([['connectivity', 'Bluetooth 5.1 + Logi Bolt USB'], ['compatibility', 'Windows, macOS, Linux, ChromeOS'], ['battery', '2 years (AA)']]),
    tags: ['logitech', 'mouse', 'ergonomic', 'vertical', 'bluetooth'],
    warranty: '1 Year Warranty', status: 'approved',
    totalSold: 198, averageRating: 4.5, reviewCount: 89, emiOptions: [],
  }, { upsert: true, new: true });
  await upsertVariants(liftMouse._id, 'LOGLIFT', [{ key: 'color', values: ['Graphite', 'Off White', 'Rose'] }], 7999, {}, 50);

  // ══════════════════════════════════════════════════════════════════════════
  // GAMING (2)
  // ══════════════════════════════════════════════════════════════════════════

  // 16. Razer BlackWidow X TKL Keyboard — color
  const razerKB = await ProductModel.findOneAndUpdate({ slug: 'razer-blackwidow-x-tkl-keyboard' }, {
    vendor: v1._id, category: C['gaming']._id,
    name: 'Razer BlackWidow X TKL Gaming Keyboard', slug: 'razer-blackwidow-x-tkl-keyboard', brand: 'Razer',
    description: 'Razer BlackWidow X TKL tenkeyless gaming keyboard with Razer Green mechanical switches, Razer Chroma RGB, and military-grade metal top plate.',
    shortDescription: 'Compact TKL gaming keyboard with Razer Green switches and Chroma RGB.',
    images: [I.razerBW, I.logG733, I.logG321, I.razerBW, I.logG733],
    thumbnail: I.razerBW,
    basePrice: 12990, compareAtPrice: 15000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black'] }],
    attributes: new Map([['connectivity', 'Wired USB'], ['switches', 'Razer Green (clicky)'], ['type', 'TKL Mechanical Keyboard'], ['lighting', 'Razer Chroma RGB']]),
    tags: ['razer', 'keyboard', 'mechanical', 'gaming', 'tenkeyless', 'rgb'],
    warranty: '2 Year Warranty', status: 'approved',
    totalSold: 112, averageRating: 4.5, reviewCount: 56, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(razerKB._id, 'RAZERBWX', [{ key: 'color', values: ['Black'] }], 12990, {}, 35);

  // 17. Logitech G321 LIGHTSPEED Gaming Headset — color
  const g321 = await ProductModel.findOneAndUpdate({ slug: 'logitech-g321-lightspeed-gaming-headset' }, {
    vendor: v1._id, category: C['gaming']._id,
    name: 'Logitech G321 LIGHTSPEED Wireless Gaming Headset', slug: 'logitech-g321-lightspeed-gaming-headset', brand: 'Logitech',
    description: 'Logitech G321 with LIGHTSPEED wireless 2.4GHz, 50mm Pro-G drivers, DTS Headphone:X 2.0 surround sound, and up to 25-hour battery.',
    shortDescription: 'LIGHTSPEED wireless gaming headset with 50mm Pro-G drivers.',
    images: [I.logG321, I.logG733, I.razerBW, I.logG321, I.logG733],
    thumbnail: I.logG321,
    basePrice: 14990, compareAtPrice: 17500, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black', 'White'] }],
    attributes: new Map([['connectivity', 'LIGHTSPEED Wireless 2.4GHz'], ['battery', 'Up to 25 hours'], ['type', 'Over-Ear Gaming Headset'], ['surround', 'DTS Headphone:X 2.0']]),
    tags: ['logitech', 'gaming', 'headset', 'wireless', 'lightspeed'],
    warranty: '2 Year Warranty', status: 'approved',
    totalSold: 84, averageRating: 4.4, reviewCount: 41, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(g321._id, 'LGG321', [{ key: 'color', values: ['Black', 'White'] }], 14990, {}, 35);

  // ══════════════════════════════════════════════════════════════════════════
  // POWER BANK (2)
  // ══════════════════════════════════════════════════════════════════════════

  // 18. Skross Reload 20 PD 100W — color
  const skross = await ProductModel.findOneAndUpdate({ slug: 'skross-reload-20-pd-100w-power-bank' }, {
    vendor: v1._id, category: C['power-bank']._id,
    name: 'Skross Reload 20 PD 100W Power Bank', slug: 'skross-reload-20-pd-100w-power-bank', brand: 'Skross',
    description: 'Skross Reload 20 with 20000mAh capacity, 100W PD USB-C output for laptops, dual USB-A ports, and pass-through charging.',
    shortDescription: '20000mAh Skross power bank with 100W USB-C PD for laptops.',
    images: [I.skross20, I.skross10, I.meko20, I.blk20k, I.blkQi],
    thumbnail: I.skross20,
    basePrice: 10999, compareAtPrice: 12999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black', 'White'] }],
    attributes: new Map([['charging', '100W USB-C PD'], ['ports', '2× USB-C + 2× USB-A'], ['weight', '440g'], ['capacity', '20000mAh']]),
    tags: ['skross', 'power-bank', '100w', 'pd', 'laptop', 'charger'],
    warranty: '2 Year Warranty', status: 'approved',
    totalSold: 147, averageRating: 4.5, reviewCount: 71, emiOptions: [],
  }, { upsert: true, new: true });
  await upsertVariants(skross._id, 'SKROSS20', [{ key: 'color', values: ['Black', 'White'] }], 10999, {}, 40);

  // 19. Meko M20S 20000mAh — color
  const meko = await ProductModel.findOneAndUpdate({ slug: 'meko-m20s-power-bank' }, {
    vendor: v1._id, category: C['power-bank']._id,
    name: 'Meko M20S 20000mAh Power Bank', slug: 'meko-m20s-power-bank', brand: 'Meko',
    description: 'Meko M20S 20000mAh power bank with 65W PD output, LED display, dual USB-C + dual USB-A ports, and lightweight design.',
    shortDescription: 'Meko 20000mAh power bank with 65W PD and LED display.',
    images: [I.meko20, I.blk20k, I.skross20, I.skross10, I.blkQi],
    thumbnail: I.meko20,
    basePrice: 4999, compareAtPrice: 6500, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black', 'White'] }],
    attributes: new Map([['charging', '65W USB-C PD'], ['ports', '2× USB-C + 2× USB-A'], ['weight', '390g'], ['capacity', '20000mAh']]),
    tags: ['meko', 'power-bank', '65w', 'pd', 'budget', 'charger'],
    warranty: '1 Year Warranty', status: 'approved',
    totalSold: 312, averageRating: 4.3, reviewCount: 156, emiOptions: [],
  }, { upsert: true, new: true });
  await upsertVariants(meko._id, 'MEKOМ20S', [{ key: 'color', values: ['Black', 'White'] }], 4999, {}, 60);

  // ══════════════════════════════════════════════════════════════════════════
  // CAMERA (3)
  // ══════════════════════════════════════════════════════════════════════════

  // 20. DJI Osmo Action 5 Pro Adventure Combo — color
  const djiAct = await ProductModel.findOneAndUpdate({ slug: 'dji-osmo-action-5-pro' }, {
    vendor: v2._id, category: C['camera']._id,
    name: 'DJI Osmo Action 5 Pro Adventure Combo', slug: 'dji-osmo-action-5-pro', brand: 'DJI',
    description: 'DJI Osmo Action 5 Pro with 4K/120fps, 1/1.3" CMOS, -20°C low-temp operation, RockSteady 4.0 stabilization, and 4-hour battery life.',
    shortDescription: 'DJI 4K/120fps action camera with RockSteady 4.0 and 4h battery.',
    images: [I.djiAct5, I.djiNano, I.insta360, I.djiMob8, I.djiAct5],
    thumbnail: I.djiAct5,
    basePrice: 49999, compareAtPrice: 54999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black'] }],
    attributes: new Map([['type', 'Action Camera'], ['video', '4K/120fps, 10-bit D-Log M'], ['stabilization', 'RockSteady 4.0'], ['battery', '4 hours'], ['waterproof', 'IPX8 (20m without housing)']]),
    tags: ['dji', 'osmo', 'action', '5pro', '4k', 'adventure'],
    warranty: '1 Year DJI Warranty', status: 'approved',
    totalSold: 78, averageRating: 4.7, reviewCount: 39, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(djiAct._id, 'DJIACT5', [{ key: 'color', values: ['Black'] }], 49999, {}, 20);

  // 21. Insta360 X5 Essentials Bundle — color
  const insta = await ProductModel.findOneAndUpdate({ slug: 'insta360-x5-essentials-bundle' }, {
    vendor: v2._id, category: C['camera']._id,
    name: 'Insta360 X5 Essentials Bundle', slug: 'insta360-x5-essentials-bundle', brand: 'Insta360',
    description: 'Insta360 X5 360° camera with dual 1/1.28" CMOS sensors, 8K/30fps 360° video, FlowState stabilization, AI editing, and 135-min battery.',
    shortDescription: 'Insta360 X5 360° camera with 8K video and AI editing.',
    images: [I.insta360, I.djiAct5, I.djiNano, I.djiMob8, I.djiMob7],
    thumbnail: I.insta360,
    basePrice: 64999, compareAtPrice: 71000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black'] }],
    attributes: new Map([['type', '360 Camera'], ['video', '8K/30fps 360°'], ['stabilization', 'FlowState'], ['battery', '135 minutes'], ['waterproof', 'IPX8 (10m without lens guards)']]),
    tags: ['insta360', 'x5', '360', '8k', 'action', 'camera'],
    warranty: '1 Year Warranty', status: 'approved',
    totalSold: 53, averageRating: 4.7, reviewCount: 27, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(insta._id, 'INSTA360X5', [{ key: 'color', values: ['Black'] }], 64999, {}, 15);

  // 22. DJI Osmo Mobile 8 Gimbal — color
  const djiMob = await ProductModel.findOneAndUpdate({ slug: 'dji-osmo-mobile-8-gimbal' }, {
    vendor: v2._id, category: C['camera']._id,
    name: 'DJI Osmo Mobile 8 Smartphone Gimbal', slug: 'dji-osmo-mobile-8-gimbal', brand: 'DJI',
    description: 'DJI Osmo Mobile 8 with ActiveTrack 6.0, 3-axis stabilization, foldable design, Magnetic Quick-Clamp, and 13-hour battery life.',
    shortDescription: 'DJI smartphone gimbal with ActiveTrack 6.0 and 13-hour battery.',
    images: [I.djiMob8, I.djiMob7, I.djiNano, I.djiAct5, I.insta360],
    thumbnail: I.djiMob8,
    basePrice: 19999, compareAtPrice: 22999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Obsidian Black', 'Platinum Gray'] }],
    attributes: new Map([['type', 'Smartphone Gimbal'], ['stabilization', '3-axis motorized gimbal'], ['battery', '13 hours'], ['connectivity', 'Bluetooth 5.0']]),
    tags: ['dji', 'osmo', 'mobile', 'gimbal', 'stabilizer', 'smartphone'],
    warranty: '1 Year DJI Warranty', status: 'approved',
    totalSold: 134, averageRating: 4.6, reviewCount: 67, emiOptions: EMI_MID,
  }, { upsert: true, new: true });
  await upsertVariants(djiMob._id, 'DJIMOB8', [{ key: 'color', values: ['Obsidian Black', 'Platinum Gray'] }], 19999, {}, 30);

  // ══════════════════════════════════════════════════════════════════════════
  // ROUTER (1)
  // ══════════════════════════════════════════════════════════════════════════

  // 23. TP-Link Archer AX73 AX5400 Router — color
  const tpAX73 = await ProductModel.findOneAndUpdate({ slug: 'tp-link-archer-ax73-ax5400' }, {
    vendor: v1._id, category: C['router']._id,
    name: 'TP-Link Archer AX73 AX5400 Wi-Fi 6 Router', slug: 'tp-link-archer-ax73-ax5400', brand: 'TP-Link',
    description: 'TP-Link Archer AX73 AX5400 Tri-Band Wi-Fi 6 router with 6 antennas, 4× Gigabit LAN, OFDMA, MU-MIMO, and coverage up to 2,500 sq ft.',
    shortDescription: 'AX5400 Tri-Band Wi-Fi 6 router with 6 antennas and OFDMA.',
    images: [I.tpAX73, I.tpX50, I.tpX503p, I.tpX20, I.tpS7],
    thumbnail: I.tpAX73,
    basePrice: 8490, compareAtPrice: 9999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black'] }],
    attributes: new Map([['standard', 'Wi-Fi 6 (802.11ax)'], ['speed', 'AX5400 (4804 + 574 Mbps)'], ['band', 'Dual Band'], ['ports', '4× Gigabit LAN + 1× Gigabit WAN']]),
    tags: ['tp-link', 'archer', 'router', 'wifi6', 'ax5400', 'networking'],
    warranty: '3 Year Warranty', status: 'approved',
    totalSold: 143, averageRating: 4.4, reviewCount: 68, emiOptions: [],
  }, { upsert: true, new: true });
  await upsertVariants(tpAX73._id, 'TPAX73', [{ key: 'color', values: ['Black'] }], 8490, {}, 35);

  // ══════════════════════════════════════════════════════════════════════════
  // CASES (1)
  // ══════════════════════════════════════════════════════════════════════════

  // 24. Pitaka Edge Ultra Slim Case iPhone 17 Pro — color
  const pitaka = await ProductModel.findOneAndUpdate({ slug: 'pitaka-edge-case-iphone-17-pro' }, {
    vendor: v2._id, category: C['cases-protectors']._id,
    name: 'Pitaka Edge Ultra Slim Case for iPhone 17 Pro', slug: 'pitaka-edge-case-iphone-17-pro', brand: 'Pitaka',
    description: 'Pitaka Edge case made from 600D aramid fiber, 0.65mm ultra-thin, MagSafe compatible, military-grade drop protection, and matte finish.',
    shortDescription: 'Ultra-thin aramid fiber case for iPhone 17 Pro with MagSafe.',
    images: [I.pitRed, I.pitGrn, I.spUH, I.spTA, I.torOS],
    thumbnail: I.pitRed,
    basePrice: 4999, compareAtPrice: 5999, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Black', 'Red', 'Green', 'Blue'] }],
    attributes: new Map([['compatibility', 'iPhone 17 Pro'], ['material', '600D Aramid Fiber'], ['thickness', '0.65mm'], ['magsafe', 'Yes']]),
    tags: ['pitaka', 'case', 'iphone', '17pro', 'aramid', 'magsafe', 'slim'],
    warranty: '1 Year Warranty', status: 'approved',
    totalSold: 287, averageRating: 4.7, reviewCount: 143, emiOptions: [],
  }, { upsert: true, new: true });
  await upsertVariants(pitaka._id, 'PITIP17P', [{ key: 'color', values: ['Black', 'Red', 'Green', 'Blue'] }], 4999, {}, 80);

  // ══════════════════════════════════════════════════════════════════════════
  // DRONES (2)
  // ══════════════════════════════════════════════════════════════════════════

  // 25. DJI Neo 2 Fly More Combo — color
  const djiNeo = await ProductModel.findOneAndUpdate({ slug: 'dji-neo-2-fly-more-combo' }, {
    vendor: v2._id, category: C['drone']._id,
    name: 'DJI Neo 2 Fly More Combo', slug: 'dji-neo-2-fly-more-combo', brand: 'DJI',
    description: 'DJI Neo 2 ultra-lightweight 149g drone with 4K/60fps camera, 35-min flight time, 13km O4 transmission, and ActiveTrack 360.',
    shortDescription: 'Ultra-lightweight DJI Neo 2 with 4K/60fps and 35-min flight.',
    images: [I.djiNeo2, I.djiFlip, I.djiAvata, I.djiMini3, I.djiMini5],
    thumbnail: I.djiNeo2,
    basePrice: 82999, compareAtPrice: 91000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Gray'] }],
    attributes: new Map([['camera', '4K/60fps (1/2" CMOS)'], ['flightTime', '35 min'], ['range', '13 km'], ['weight', '149g'], ['stabilization', '3-axis gimbal']]),
    tags: ['dji', 'neo2', 'drone', '4k', 'lightweight', 'activetrack'],
    warranty: '1 Year DJI Warranty', status: 'approved',
    totalSold: 56, averageRating: 4.7, reviewCount: 29, emiOptions: EMI_HIGH,
  }, { upsert: true, new: true });
  await upsertVariants(djiNeo._id, 'DJINEO2', [{ key: 'color', values: ['Gray'] }], 82999, {}, 12);

  // 26. DJI Flip RC-N3 Drone — color (bonus 26th product)
  const djiFlipProd = await ProductModel.findOneAndUpdate({ slug: 'dji-flip-drone' }, {
    vendor: v2._id, category: C['drone']._id,
    name: 'DJI Flip RC-N3 Drone', slug: 'dji-flip-drone', brand: 'DJI',
    description: 'DJI Flip foldable drone with 4K/60fps, 32-min flight time, Obstacle Avoidance, QuickShots, and palm take-off for easy beginners.',
    shortDescription: 'Beginner-friendly DJI Flip with 4K/60fps and QuickShots.',
    images: [I.djiFlip, I.djiNeo2, I.djiAvata, I.djiMini3, I.djiFlip],
    thumbnail: I.djiFlip,
    basePrice: 54999, compareAtPrice: 61000, currency: 'BDT',
    hasVariants: true,
    variantOptions: [{ key: 'color', label: 'Color', values: ['Gray'] }],
    attributes: new Map([['camera', '4K/60fps (1/2" CMOS)'], ['flightTime', '32 min'], ['range', '13 km'], ['weight', '249g'], ['stabilization', '3-axis gimbal']]),
    tags: ['dji', 'flip', 'drone', '4k', 'beginner', 'quickshots'],
    warranty: '1 Year DJI Warranty', status: 'approved',
    totalSold: 71, averageRating: 4.6, reviewCount: 36, emiOptions: EMI_HIGH,
  }, { upsert: true, new: true });
  await upsertVariants(djiFlipProd._id, 'DJIFLIP', [{ key: 'color', values: ['Gray'] }], 54999, {}, 18);

  console.log('✓ Extra products (26) + Variants seeded');
  console.log('\n🎉 seedProducts2 complete!');
  console.log('Total products in DB: 18 (seedAll) + 26 (seedProducts2) = 44');

  await mongoose.disconnect();
};

seed2().catch(err => { console.error(err); process.exit(1); });
