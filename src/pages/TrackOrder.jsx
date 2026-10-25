import { useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { formatNaira, deliveryEstimate } from '../lib/shop.js'

const steps = ['Order placed', 'Processing', 'Shipped', 'Delivered']

export default function TrackOrder({ query }) {
  const { findOrder } = useStore()
  const [orderNumber, setOrderNumber] = useState(query.order || '')
  const [phone, setPhone] = useState(query.phone || '')
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [order, setOrder] = useState(null)

  function handleSearch(event) {
    event.preventDefault()
    setSearching(true)
    setSearched(false)
    /* Short simulated lookup delay, so the button shows progress and
       the result never appears to change without feedback. */
    setTimeout(() => {
      setOrder(findOrder(orderNumber, phone))
      setSearching(false)
      setSearched(true)
    }, 600)
  }

  const currentStep = order ? steps.indexOf(order.status) : 0

  return (
    <div className="container">
      <section className="section">
        <h1 className="page-title">Track your order</h1>
        <p className="page-lead">
          Enter the order number from your confirmation and the phone number
          used at checkout.
        </p>
        <form onSubmit={handleSearch} className="narrow form-stack">
          <div className="field">
            <label htmlFor="track-number">Order number</label>
            <input
              id="track-number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="TIN-20261025-4821"
            />
          </div>
          <div className="field">
            <label htmlFor="track-phone">Phone number</label>
            <input
              id="track-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08031234567"
              inputMode="tel"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={searching}>
            {searching && <span className="btn-spinner" aria-hidden="true" />}
            {searching ? 'Searching...' : 'Track order'}
          </button>
        </form>

        {searched && !order && (
          <p className="alert alert-error narrow alert-spaced">
            No order matches that order number and phone number. Check both
            and try again. Orders are saved on the device where they were
            placed.
          </p>
        )}

        {searched && order && (
          <div className="success-grid alert-spaced">
            <div>
              <h2 className="section-title">Order {order.orderNumber}</h2>
              <p className="muted">
                Placed on{' '}
                {new Date(order.placedAt).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
                . Estimated delivery:{' '}
                {deliveryEstimate(order.deliveryMethod, order.placedAt)}.
              </p>
              <table className="summary-table">
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name} × {item.qty}</td>
                      <td>{formatNaira(item.lineTotal)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Subtotal</td>
                    <td>{formatNaira(order.subtotal)}</td>
                  </tr>
                  <tr>
                    <td>Delivery</td>
                    <td>
                      {order.deliveryFee === 0 ? 'Free' : formatNaira(order.deliveryFee)}
                    </td>
                  </tr>
                  <tr className="summary-total">
                    <td>Total</td>
                    <td>{formatNaira(order.total)}</td>
                  </tr>
                </tbody>
              </table>
              <p>
                Delivering to {order.shipping.street}, {order.shipping.city},{' '}
                {order.shipping.state}.
              </p>
            </div>
            <aside className="summary-box">
              <h2>Delivery status: {order.status}</h2>
              <ol className="steps">
                {steps.map((step, i) => (
                  <li
                    key={step}
                    className={
                      'step'
                      + (i < currentStep ? ' done' : '')
                      + (i === currentStep ? ' current' : '')
                    }
                  >
                    <span className="step-dot">
                      {i < currentStep ? '✓' : i + 1}
                    </span>
                    <span>
                      <span className="step-title">{step}</span>
                      {i === currentStep && (
                        <p className="step-note">Current stage of this order.</p>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        )}
      </section>
    </div>
  )
}
