import { site } from '../config/site.js'
import { products } from '../data/products.js'
import Carousel from '../components/Carousel.jsx'
import ProductCard from '../components/ProductCard.jsx'

const steps = [
  {
    title: 'Browse products',
    text: 'Open the shop, search by name, or filter by category to find the gadget you want.',
  },
  {
    title: 'Place your order',
    text: 'Add items to your cart, enter your contact details and delivery address, then review the order.',
  },
  {
    title: 'Pay your way',
    text: 'Pay by bank transfer or pay the courier on delivery. Card payments arrive once a provider is connected.',
  },
  {
    title: 'Receive delivery',
    text: 'Standard delivery takes 3 to 5 working days. Express delivery takes 1 to 2 working days.',
  },
]

export default function Home() {
  const featured = products.filter((p) => p.featured)
  const bestSellers = products.filter((p) => p.bestSeller)

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <h1>Quality tech gadgets, delivered across Nigeria.</h1>
          <p>
            {site.brandName} sells earbuds, power banks, smartwatches,
            speakers, chargers, and accessories sourced from China, with
            delivery to all 36 states and the Federal Capital Territory.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#/shop">Shop all products</a>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              How ordering works
            </button>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="category-strip" aria-label="Product categories">
          {site.categories.map((category) => (
            <a
              key={category}
              className="chip"
              href={'#/shop?category=' + encodeURIComponent(category)}
            >
              {category}
            </a>
          ))}
        </div>

        <section className="section">
          <h2 className="section-title">Featured products</h2>
          <p className="section-lead">
            A rotating selection from the current catalog. Use the arrows or
            the dots to move through them.
          </p>
          <Carousel products={featured} />
        </section>

        <section className="section" id="how-it-works">
          <h2 className="section-title">How ordering works</h2>
          <p className="section-lead">
            Four steps, from finding a product to receiving it at your door.
          </p>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <article className="step-card" key={step.title}>
                <span className="step-number">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Best sellers</h2>
          <p className="section-lead">
            The products customers order most often from the current catalog.
          </p>
          <div className="product-grid">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
