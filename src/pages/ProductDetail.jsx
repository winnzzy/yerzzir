import { useState } from 'react'
import { getProduct, products, stockLabel } from '../data/products.js'
import { useStore } from '../store/StoreContext.jsx'
import { formatNaira } from '../lib/shop.js'
import { navigate } from '../lib/router.js'
import ProductCard from '../components/ProductCard.jsx'
import QtySelector from '../components/QtySelector.jsx'

export default function ProductDetail({ params }) {
  const { addToCart } = useStore()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const product = getProduct(params.id)

  if (!product) {
    return (
      <div className="container">
        <section className="section">
          <h1 className="page-title">Product not found.</h1>
          <p className="page-lead">
            The product you are looking for is not in the catalog.
          </p>
          <a className="btn btn-primary" href="#/shop">Back to shop</a>
        </section>
      </div>
    )
  }

  const outOfStock = product.stock === 'out'
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  function handleAdd() {
    addToCart(product.id, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function handleBuyNow() {
    addToCart(product.id, qty)
    navigate('/checkout')
  }

  return (
    <div className="container">
      <section className="section">
        <a className="back-link" href="#/shop">← Back to shop</a>
        <div className="detail-layout">
          <div className="detail-image">
            <img src={product.image} alt={product.name} />
          </div>
          <div className="detail-info">
            <span className={'product-card-category cat-' + product.category.toLowerCase()}>{product.category}</span>
            <h1 className="page-title" style={{ marginBottom: 0 }}>{product.name}</h1>
            <span
              className={
                'badge ' +
                (product.stock === 'in'
                  ? 'badge-success'
                  : product.stock === 'low'
                    ? 'badge-warning'
                    : 'badge-danger')
              }
              style={{ alignSelf: 'flex-start' }}
            >
              {stockLabel(product.stock)}
            </span>
            <p className="detail-price">{formatNaira(product.price)}</p>
            <p>{product.short}</p>
            <div className="detail-buy-row">
              <QtySelector value={qty} onChange={(next) => setQty(Math.max(1, next))} />
              <button
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={outOfStock}
              >
                {outOfStock ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleBuyNow}
                disabled={outOfStock}
              >
                Buy now
              </button>
            </div>
            <h2 className="detail-specs-title">Specifications</h2>
            <div className="spec-scroll">
              <table className="spec-table">
                <tbody>
                  {product.specs.map((spec) => (
                    <tr key={spec.label}>
                      <td>{spec.label}</td>
                      <td>{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <h2 className="section-title">Related products</h2>
          <p className="section-lead">
            More items in {product.category} from the current catalog.
          </p>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
