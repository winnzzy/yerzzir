import { site } from '../config/site.js'
import { useStore } from '../store/StoreContext.jsx'
import { formatNaira } from '../lib/shop.js'
import QtySelector from '../components/QtySelector.jsx'

export default function Cart() {
  const { cartItems, subtotal, updateQty, removeFromCart } = useStore()

  if (cartItems.length === 0) {
    return (
      <div className="container">
        <section className="section">
          <h1 className="page-title">Your cart is empty.</h1>
          <p className="page-lead">
            Browse the shop and add products to start an order.
          </p>
          <a className="btn btn-primary" href="#/shop">Browse products</a>
        </section>
      </div>
    )
  }

  return (
    <div className="container">
      <section className="section">
        <h1 className="page-title">Your cart</h1>
        <p className="page-lead">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart.
        </p>
        <div className="cart-layout">
          <div>
            {cartItems.map((item) => (
              <div className="cart-line" key={item.id}>
                <a href={'#/product/' + item.id}>
                  <img src={item.image} alt={item.name} />
                </a>
                <div>
                  <p className="cart-line-name">
                    <a href={'#/product/' + item.id}>{item.name}</a>
                  </p>
                  <p className="cart-line-price">
                    {formatNaira(item.price)} each
                  </p>
                  <QtySelector
                    value={item.qty}
                    onChange={(next) => updateQty(item.id, next)}
                  />
                </div>
                <div className="cart-line-right">
                  <strong>{formatNaira(item.lineTotal)}</strong>
                  <button
                    className="btn btn-quiet btn-sm"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <aside className="summary-box">
            <h2>Order summary</h2>
            <table className="summary-table">
              <tbody>
                <tr>
                  <td>Subtotal</td>
                  <td>{formatNaira(subtotal)}</td>
                </tr>
                <tr>
                  <td>Delivery fee</td>
                  <td>Calculated at checkout</td>
                </tr>
                <tr className="summary-total">
                  <td>Total so far</td>
                  <td>{formatNaira(subtotal)}</td>
                </tr>
              </tbody>
            </table>
            <p className="summary-note">
              Standard delivery costs {formatNaira(site.delivery.standardFee)}.
              Express delivery costs {formatNaira(site.delivery.expressFee)}.
              Lagos orders with a subtotal of{' '}
              {formatNaira(site.delivery.freeLagosThreshold)} or more ship free.
            </p>
            <a className="btn btn-primary btn-block" href="#/checkout">
              Proceed to checkout
            </a>
            <p className="center-link">
              <a href="#/shop">Continue shopping</a>
            </p>
          </aside>
        </div>
      </section>
    </div>
  )
}
