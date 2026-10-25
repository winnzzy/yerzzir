/* Payment provider seam. This is the one file that changes when payment
   settings change. The provider is Flutterwave, and it is the only
   payment method on this store: card, bank transfer, and USSD all go
   through Flutterwave Checkout. There is no separate bank transfer
   option and no pay on delivery option. Flutterwave Checkout activates
   only when a public key is set below and cardPaymentsEnabled is true.
   Until then, the Flutterwave option renders disabled with an honest
   note. Never put a secret key in this file or in any front end code.
   Public key only, pasted from the Flutterwave dashboard. */

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
]
