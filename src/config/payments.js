/* Payment provider seam. This is the one file that changes when a real
   payment provider is connected. Right now no provider is connected, so
   card payments stay disabled and the checkout says so honestly.
   To connect a provider later: set provider to 'paystack' or
   'flutterwave', paste the provider dashboard public key below, and set
   cardPaymentsEnabled to true. Never put a secret key in this file. */

export const paymentConfig = {
  provider: null,
  publicKey: null,
  cardPaymentsEnabled: false,
}

export const paymentMethods = [
  {
    id: 'card',
    label: 'Card payment',
    enabled: false,
    note: 'Card payments activate once a payment provider is connected.',
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
