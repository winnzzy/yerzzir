import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { formatNaira } from '../lib/shop.js'
import { stockLabel } from '../data/products.js'

export default function ProductCard({ product }) {
  const { addToCart } = useStore()
  const [added, setAdded] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const outOfStock = product.stock === 'out'

  function handleAdd() {
    if (outOfStock) return
    addToCart(product.id, 1)
    setAdded(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1200)
  }

  return (
    <article className="card product-card">
      <a className="product-card-image" href={'#/product/' + product.id} aria-label={'View ' + product.name}>
        <img src={product.image} alt={product.name} loading="lazy" />
      </a>
      <div className="product-card-body">
        <span className="product-card-category">{product.category}</span>
        <h3 className="product-card-name">
          <a href={'#/product/' + product.id}>{product.name}</a>
        </h3>
        <span
          className={
            'badge ' +
            (product.stock === 'in'
              ? 'badge-success'
              : product.stock === 'low'
                ? 'badge-warning'
                : 'badge-danger')
          }
        >
          {stockLabel(product.stock)}
        </span>
        <p className="product-card-price">{formatNaira(product.price)}</p>
        <div className="product-card-actions">
          <a className="btn btn-secondary btn-sm" href={'#/product/' + product.id}>
            View details
          </a>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAdd}
            disabled={outOfStock}
          >
            {outOfStock ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  )
}
