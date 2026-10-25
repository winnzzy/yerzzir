/* Payment provider seam. This is the one file that changes when payment
   settings change. The provider is Flutterwave. Card, bank transfer, and
   USSD through Flutterwave Checkout activate only when a public key is
   set below and cardPaymentsEnabled is true. Until then, the Flutterwave
   option renders disabled with an honest note, and bank transfer plus
   pay on delivery work as before. Never put a secret key in this file
   or in any front end code. Public key only, pasted from the
   Flutterwave dashboard. */

export const paymentConfig = {
  provider: 'flutterwave',
  publicKey: 'FLWPUBK-78f560d3ccec4039297b22dd22498f43-X',
  cardPaymentsEnabled: true,
}

/* Flutterwave Checkout is ready only when the provider is Flutterwave,
   a public key is set, and card payments are enabled. */
export const flutterwaveReady =
  paymentConfig.provider === 'flutterwave' &&
  paymentConfig.cardPaymentsEnabled &&
  Boolean(paymentConfig.publicKey)

export const paymentMethods = [
  {
    id: 'flutterwave',
    label: 'Pay with Flutterwave',
    enabled: flutterwaveReady,
    note: flutterwaveReady
      ? 'Pay by card, bank transfer, or USSD through Flutterwave Checkout.'
      : 'Add your Flutterwave public key in src/config/payments.js to activate.',
  },
  {
    id: 'transfer',
    label: 'Bank transfer',
    enabled: true,
    note: 'Use your order number as the transfer reference. Your order is confirmed once payment is received. Transfer details are shared with you after you place your order.',
  },
  {
    id: 'pod',
    label: 'Pay on delivery',
    enabled: true,
    note: 'Pay the courier in full when your order arrives. Please have the exact amount ready.',
  },
]
