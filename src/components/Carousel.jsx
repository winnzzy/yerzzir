import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/StoreContext.jsx'
import { formatNaira } from '../lib/shop.js'

/* Featured products carousel. Prev and next buttons, dots, and timed
   advance that pauses while the pointer is over the carousel or a
   control has focus. Every control works. */
export default function Carousel({ products }) {
  const { addToCart } = useStore()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)

  const count = products.length

  function goTo(next) {
    setIndex(((next % count) + count) % count)
  }

  useEffect(() => {
    if (paused || count <= 1) return undefined
    timer.current = setTimeout(() => goTo(index + 1), 6000)
    return () => clearTimeout(timer.current)
  }, [index, paused, count])

  if (count === 0) return null

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{ transform: 'translateX(-' + index * 100 + '%)' }}
        >
          {products.map((product) => (
            <div className="carousel-slide" key={product.id}>
              <a className="carousel-slide-image" href={'#/product/' + product.id}>
                <img src={product.image} alt={product.name} />
              </a>
              <div className="carousel-slide-body">
                <span className="badge badge-accent">Featured</span>
                <h3 className="section-title">{product.name}</h3>
                <p className="muted">{product.short}</p>
                <p className="detail-price">{formatNaira(product.price)}</p>
                <div className="carousel-actions">
                  <a className="btn btn-primary" href={'#/product/' + product.id}>
                    View product
                  </a>
                  <button
                    className="btn btn-secondary"
                    onClick={() => addToCart(product.id, 1)}
                    disabled={product.stock === 'out'}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        className="carousel-arrow prev"
        onClick={() => goTo(index - 1)}
        aria-label="Previous featured product"
      >
        ‹
      </button>
      <button
        className="carousel-arrow next"
        onClick={() => goTo(index + 1)}
        aria-label="Next featured product"
      >
        ›
      </button>
      <div className="carousel-dots">
        {products.map((product, i) => (
          <button
            key={product.id}
            className={'carousel-dot' + (i === index ? ' active' : '')}
            onClick={() => goTo(i)}
            aria-label={'Go to featured product ' + (i + 1)}
          />
        ))}
      </div>
    </div>
  )
}
