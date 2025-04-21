// export type CategoryType = 'Mobile' | 'Laptop' | 'Headphone' | 'Power Bank';

export const categoryOptions = [
  'Phone',
  'Power-Bank',
  'Speakers',
  'Camera-Gimbal',
  'Cases-Protector',
  'Cable-Adapter',
  'iPad',
  'Headset',
  'Car-Accessories',
  'Wearables',
  'Mac',
  'Video-Games',
  'Earbuds',
  'Airpods',
  'Tablets',
  'Others'
] as const;

export type CategoryType = (typeof categoryOptions)[number];

// export type CategoryType =
//   | 'Phones'
//   | 'Power Bank'
//   | 'Speakers'
//   | 'Camera/Gimbal'
//   | 'Cases & Protector'
//   | 'Cable & Adapter'
//   | 'iPad'
//   | 'Headset'
//   | 'Car Accessories'
//   | 'Wearables'
//   | 'Mac'
//   | 'Video Games'
//   | 'Earbuds'
//   | 'AirPods'
//   | 'Tablets'

//   | 'Others'
