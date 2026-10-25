import { useMemo, useState } from 'react'
import { site } from '../config/site.js'
import { paymentMethods, paymentConfig, flutterwaveReady } from '../config/payments.js'
import { loadFlutterwaveScript, openFlutterwaveCheckout } from '../lib/flutterwave.js'
import { useStore } from '../store/StoreContext.jsx'
import {
  formatNaira,
  getDeliveryFee,
  generateOrderNumber,
  isValidEmail,
  isValidNigerianPhone,
} from '../lib/shop.js'
import { navigate } from '../lib/router.js'

const emptyForm = {
  fullName: '',
  phone: '',
  email: '',
  street: '',
  city: '',
  state: '',
  postal: '',
  deliveryMethod: 'standard',
  paymentMethod: 'flutterwave',
}

export default function Checkout() {
  const { cartItems, subtotal, placeOrder, clearCart } = useStore()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const deliveryFee = useMemo(
    () => getDeliveryFee(form.deliveryMethod, form.state, subtotal),
    [form.deliveryMethod, form.state, subtotal],
  )
  const total = subtotal + deliveryFee
  const freeDelivery =
    form.state === site.delivery.freeLagosState &&
    subtotal >= site.delivery.freeLagosThreshold

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Enter your full name.'
    if (!isValidNigerianPhone(form.phone)) {
      next.phone = 'Enter a valid Nigerian mobile number, for example 08031234567.'
    }
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.'
    if (!form.street.trim()) next.street = 'Enter your street address.'
    if (!form.city.trim()) next.city = 'Enter your city.'
    if (!form.state) next.state = 'Select your state.'
    return next
  }

  function buildOrder() {
    return {
      orderNumber: generateOrderNumber(),
      placedAt: new Date().toISOString(),
      status: 'Processing',
      paymentStatus: 'pending',
      contact: {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      },
      shipping: {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state,
        postal: form.postal.trim(),
      },
      deliveryMethod: form.deliveryMethod,
      deliveryFee,
      paymentMethod: form.paymentMethod,
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        lineTotal: item.lineTotal,
      })),
      subtotal,
      total,
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')
    if (cartItems.length === 0) {
      setSubmitError('Your cart is empty. Add a product before placing an order.')
      return
    }
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    /* Flutterwave path: the order is recorded only after Flutterwave
       reports a successful payment. Closing the modal without paying
       places no order. */
    if (form.paymentMethod === 'flutterwave') {
      if (!flutterwaveReady) {
        setSubmitError('Flutterwave checkout is not active yet. The store owner needs to add the public key.')
        return
      }
      setPlacing(true)
      const order = buildOrder()
      loadFlutterwaveScript()
        .then(() => {
          openFlutterwaveCheckout({
            publicKey: paymentConfig.publicKey,
            txRef: order.orderNumber,
            amount: order.total,
            customer: order.contact,
            onSuccess: (data) => {
              order.paymentStatus = 'paid'
              order.flutterwaveTransactionId = data.transaction_id || null
              placeOrder(order)
              clearCart()
              navigate('/success/' + order.orderNumber)
            },
            onClosed: () => {
              setPlacing(false)
              setSubmitError('Checkout was closed before payment finished, so no order was placed.')
            },
          })
        })
        .catch(() => {
          setPlacing(false)
          setSubmitError('Flutterwave checkout could not be loaded. Check your connection and try again.')
        })
      return
    }

    /* No other payment method exists. Every payment goes through
       Flutterwave, so reaching here means the selected method is
       invalid and no order is placed. */
    setPlacing(false)
    setSubmitError('All payments go through Flutterwave. Select Flutterwave checkout to continue.')
  }

  if (cartItems.length === 0) {
    return (
      <div className="container">
        <section className="section">
          <h1 className="page-title">Your cart is empty.</h1>
          <p className="page-lead">
            Add a product to your cart before checking out.
          </p>
          <a className="btn btn-primary" href="#/shop">Browse products</a>
        </section>
      </div>
    )
  }

  return (
    <div className="container">
      <section className="section">
        <h1 className="page-title">Checkout</h1>
        <p className="page-lead">
          Enter your contact details and delivery address, choose delivery
          and payment, then review and place your order.
        </p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="checkout-layout">
            <div>
              <div className="checkout-section">
                <h2>Contact details</h2>
                <div className="form-grid">
                  <div className={'field' + (errors.fullName ? ' invalid' : '')}>
                    <label htmlFor="fullName">Full name</label>
                    <input
                      id="fullName"
                      value={form.fullName}
                      onChange={(e) => setField('fullName', e.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                    {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                  </div>
                  <div className={'field' + (errors.phone ? ' invalid' : '')}>
                    <label htmlFor="phone">Phone number</label>
                    <input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                      placeholder="08031234567"
                      autoComplete="tel"
                      inputMode="tel"
                    />
                    {errors.phone && <span className="field-error">{errors.phone}</span>}
                  </div>
                  <div className={'field field-full' + (errors.email ? ' invalid' : '')}>
                    <label htmlFor="email">Email address</label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>
                </div>
              </div>

              <div className="checkout-section">
                <h2>Shipping address</h2>
                <div className="form-grid">
                  <div className={'field field-full' + (errors.street ? ' invalid' : '')}>
                    <label htmlFor="street">Street address</label>
                    <input
                      id="street"
                      value={form.street}
                      onChange={(e) => setField('street', e.target.value)}
                      placeholder="House number, street, area"
                      autoComplete="street-address"
                    />
                    {errors.street && <span className="field-error">{errors.street}</span>}
                  </div>
                  <div className={'field' + (errors.city ? ' invalid' : '')}>
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      value={form.city}
                      onChange={(e) => setField('city', e.target.value)}
                      placeholder="Ikeja"
                      autoComplete="address-level2"
                    />
                    {errors.city && <span className="field-error">{errors.city}</span>}
                  </div>
                  <div className={'field' + (errors.state ? ' invalid' : '')}>
                    <label htmlFor="state">State</label>
                    <select
                      id="state"
                      value={form.state}
                      onChange={(e) => setField('state', e.target.value)}
                    >
                      <option value="">Select a state</option>
                      {site.nigerianStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.state && <span className="field-error">{errors.state}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="postal">Postal code (optional)</label>
                    <input
                      id="postal"
                      value={form.postal}
                      onChange={(e) => setField('postal', e.target.value)}
                      placeholder="100001"
                      autoComplete="postal-code"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              <div className="checkout-section">
                <h2>Delivery method</h2>
                <div className="checkout-stack" role="radiogroup" aria-label="Delivery method">
                  <label className={'radio-card' + (form.deliveryMethod === 'standard' ? ' selected' : '')}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="standard"
                      checked={form.deliveryMethod === 'standard'}
                      onChange={() => setField('deliveryMethod', 'standard')}
                    />
                    <span>
                      <span className="radio-card-title">
                        Standard delivery, {formatNaira(site.delivery.standardFee)}
                      </span>
                      <p className="radio-card-note">
                        3 to 5 working days, nationwide.
                        {freeDelivery && ' Free for this Lagos order.'}
                      </p>
                    </span>
                  </label>
                  <label className={'radio-card' + (form.deliveryMethod === 'express' ? ' selected' : '')}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="express"
                      checked={form.deliveryMethod === 'express'}
                      onChange={() => setField('deliveryMethod', 'express')}
                    />
                    <span>
                      <span className="radio-card-title">
                        Express delivery, {formatNaira(site.delivery.expressFee)}
                      </span>
                      <p className="radio-card-note">
                        1 to 2 working days, nationwide.
                        {freeDelivery && ' Free for this Lagos order.'}
                      </p>
                    </span>
                  </label>
                </div>
                {freeDelivery && (
                  <p className="alert alert-success alert-spaced">
                    Free delivery applied. Lagos orders with a subtotal of{' '}
                    {formatNaira(site.delivery.freeLagosThreshold)} or more ship free.
                  </p>
                )}
              </div>

              <div className="checkout-section">
                <h2>Payment method</h2>
                <div className="checkout-stack" role="radiogroup" aria-label="Payment method">
                  {paymentMethods.map((method) => {
                    const disabled = !method.enabled
                    return (
                      <label
                        key={method.id}
                        className={
                          'radio-card'
                          + (form.paymentMethod === method.id ? ' selected' : '')
                          + (disabled ? ' disabled' : '')
                        }
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={form.paymentMethod === method.id}
                          disabled={disabled}
                          onChange={() => setField('paymentMethod', method.id)}
                        />
                        <span>
                          <span className="radio-card-title">{method.label}</span>
                          <p className="radio-card-note">{method.note}</p>
                        </span>
                      </label>
                    )
                  })}
                </div>
                {!flutterwaveReady && (
                  <p className="muted summary-note">
                    Flutterwave checkout (card, bank transfer, USSD)
                    activates once the public key is added in
                    src/config/payments.js.
                  </p>
                )}
              </div>
            </div>

            <aside className="summary-box">
              <h2>Order review</h2>
              <table className="summary-table">
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name} × {item.qty}</td>
                      <td>{formatNaira(item.lineTotal)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Subtotal</td>
                    <td>{formatNaira(subtotal)}</td>
                  </tr>
                  <tr>
                    <td>
                      Delivery (
                      {form.deliveryMethod === 'express' ? 'Express' : 'Standard'})
                    </td>
                    <td>
                      {deliveryFee === 0 ? 'Free' : formatNaira(deliveryFee)}
                    </td>
                  </tr>
                  <tr className="summary-total">
                    <td>Total</td>
                    <td>{formatNaira(total)}</td>
                  </tr>
                </tbody>
              </table>
              {submitError && (
                <p className="alert alert-error">{submitError}</p>
              )}
              <button
                className="btn btn-primary btn-block"
                type="submit"
                disabled={placing}
              >
                {placing && <span className="btn-spinner" aria-hidden="true" />}
                {placing ? 'Processing...' : 'Pay with Flutterwave'}
              </button>
              <p className="summary-note">
                By placing this order you confirm that your contact details
                and delivery address above are correct.
              </p>
            </aside>
          </div>
        </form>
      </section>
    </div>
  )
}
