import { useStore } from '../store/StoreContext.jsx'
import { formatNaira, deliveryEstimate } from '../lib/shop.js'
import { paymentMethods } from '../config/payments.js'

export default function OrderSuccess({ params }) {
  const { orders } = useStore()
  const order = orders.find((o) => o.orderNumber === params.orderNumber)

  if (!order) {
    return (
      <div className="container">
        <section className="section">
          <h1 className="page-title">Order not found.</h1>
          <p className="page-lead">
            The order number in the address does not match a saved order on
            this device. Use the track order page to look it up.
          </p>
          <a className="btn btn-primary" href="#/track">Track an order</a>
        </section>
      </div>
    )
  }

  const payment = paymentMethods.find((m) => m.id === order.paymentMethod)

  return (
    <div className="container">
      <section className="section">
        <p className="alert alert-success">
          Thank you, {order.contact.fullName}. Your order has been placed.
        </p>
        <p className="muted no-margin-bottom">Your order number is</p>
        <p className="success-number">{order.orderNumber}</p>
        <p className="page-lead">
          Estimated delivery: {deliveryEstimate(order.deliveryMethod, order.placedAt)}.
          Keep your order number and phone number safe. You need both to
          track this order.
        </p>
        <div className="success-grid">
          <div>
            <h2 className="section-title">Order summary</h2>
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
                  <td>
                    Delivery (
                    {order.deliveryMethod === 'express' ? 'Express' : 'Standard'})
                  </td>
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
            <h2 className="section-title block-heading">Delivery address</h2>
            <p>
              {order.contact.fullName}<br />
              {order.shipping.street}<br />
              {order.shipping.city}, {order.shipping.state}
              {order.shipping.postal ? ', ' + order.shipping.postal : ''}<br />
              {order.contact.phone}<br />
              {order.contact.email}
            </p>
            <h2 className="section-title block-heading">Payment</h2>
            <p>
              {payment ? payment.label : order.paymentMethod}
              {order.paymentMethod === 'flutterwave' && order.paymentStatus === 'paid' && (
                <>
                  <br />
                  Payment received. Flutterwave emails you a payment receipt
                  after a successful payment.
                </>
              )}
              {order.paymentMethod === 'transfer' && (
                <>
                  <br />
                  Use your order number as the transfer reference. Your order
                  is confirmed once payment is received. Transfer details are
                  shared with you after you place your order.
                </>
              )}
              {order.paymentMethod === 'pod' && (
                <>
                  <br />
                  Pay the courier in full when your order arrives.
                </>
              )}
            </p>
          </div>
          <aside className="summary-box">
            <h2>What happens next</h2>
            <ol className="steps">
              <li className="step done">
                <span className="step-dot">✓</span>
                <span>
                  <span className="step-title">Order placed</span>
                  <p className="step-note">Your order is saved and being prepared.</p>
                </span>
              </li>
              <li className="step current">
                <span className="step-dot">2</span>
                <span>
                  <span className="step-title">Processing</span>
                  <p className="step-note">Items are packed and handed to the courier.</p>
                </span>
              </li>
              <li className="step">
                <span className="step-dot">3</span>
                <span>
                  <span className="step-title">Shipped</span>
                  <p className="step-note">Your order is on its way to your address.</p>
                </span>
              </li>
              <li className="step">
                <span className="step-dot">4</span>
                <span>
                  <span className="step-title">Delivered</span>
                  <p className="step-note">Your order arrives at your address.</p>
                </span>
              </li>
            </ol>
            <p className="center-link">
              <a href={'#/track?order=' + encodeURIComponent(order.orderNumber)}>
                Track this order
              </a>
            </p>
            <a className="btn btn-secondary btn-block" href="#/shop">
              Continue shopping
            </a>
          </aside>
        </div>
      </section>
    </div>
  )
}
