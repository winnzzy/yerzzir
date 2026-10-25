/* Site configuration. The brand name lives here and nowhere else, so it
   can be swapped in this one file. The working name below will be
   replaced with the real brand name when it is confirmed. */

export const site = {
  brandName: 'Yerzzir Store',
  tagline: 'Quality tech gadgets delivered across Nigeria.',
  currencySymbol: '₦',

  /* Delivery fee rule, documented in one place.
     Standard delivery costs 3000. Express delivery costs 5000.
     Lagos orders with a subtotal of 100000 or more ship free, no matter
     which delivery method is chosen. Standard delivery takes 3 to 5
     working days. Express delivery takes 1 to 2 working days. */
  delivery: {
    standardFee: 3000,
    expressFee: 5000,
    freeLagosThreshold: 100000,
    freeLagosState: 'Lagos',
    standardDaysMin: 3,
    standardDaysMax: 5,
    expressDaysMin: 1,
    expressDaysMax: 2,
  },

  /* Contact details are not set yet. Pages that would need real contact
     details say so plainly instead of showing invented details. */
  contact: {
    email: null,
    phone: null,
    address: null,
  },

  categories: ['Audio', 'Power', 'Wearables', 'Accessories'],

  nigerianStates: [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
    'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti',
    'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
    'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun',
    'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara', 'Federal Capital Territory',
  ],
}
