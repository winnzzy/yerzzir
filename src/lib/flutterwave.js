/* Flutterwave Inline checkout. Loads the official Flutterwave checkout
   script on demand and opens the payment modal. Only the public key
   ever appears here. No secret key is used, requested, or stored. */

const scriptUrl = 'https://checkout.flutterwave.com/v3.js'

let scriptPromise = null

export function loadFlutterwaveScript() {
  if (window.FlutterwaveCheckout) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Flutterwave script failed to load'))
    }
    document.body.appendChild(script)
  })
  return scriptPromise
}

/* Opens the Flutterwave modal. txRef is the store order number, so the
   payment and the order match exactly. onSuccess runs only when
   Flutterwave reports a successful payment. onClosed runs when the
   modal closes without a completed payment. */
export function openFlutterwaveCheckout({
  publicKey,
  txRef,
  amount,
  customer,
  onSuccess,
  onClosed,
}) {
  let completed = false
  window.FlutterwaveCheckout({
    public_key: publicKey,
    tx_ref: txRef,
    amount,
    currency: 'NGN',
    payment_options: 'card,banktransfer,ussd',
    customer: {
      email: customer.email,
      phone_number: customer.phone,
      name: customer.fullName,
    },
    customizations: {
      title: 'Yerzzir Store',
      description: 'Payment for order ' + txRef,
    },
    callback: (data) => {
      if (data && data.status === 'successful') {
        completed = true
        onSuccess(data)
      }
    },
    onclose: () => {
      if (!completed) onClosed()
    },
  })
}
