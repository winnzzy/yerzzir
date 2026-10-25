import { useEffect, useMemo, useRef, useState } from 'react'
import { site } from '../config/site.js'
import { products } from '../data/products.js'
import ProductCard from '../components/ProductCard.jsx'
import { SkeletonGrid } from '../components/Skeletons.jsx'

export default function Shop({ query }) {
  const initialCategory = query.category || 'All'
  const [search, setSearch] = useState(query.q || '')
  const [category, setCategory] = useState(
    site.categories.includes(initialCategory) ? initialCategory : 'All',
  )
  const [sort, setSort] = useState('featured')
  const [loading, setLoading] = useState(true)
  const firstLoad = useRef(true)

  /* Keep the category in step with the link that opened the shop, even
     when the shop page is already open and a footer link is clicked. */
  useEffect(() => {
    if (query.category && site.categories.includes(query.category)) {
      setCategory(query.category)
    }
  }, [query.category])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    let list = products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category
      const matchesSearch =
        term === '' ||
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.short.toLowerCase().includes(term)
      return matchesCategory && matchesSearch
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [search, category, sort])

  /* Skeleton state. Every change to search, category, or sort shows the
     skeleton grid briefly, so the result change is never a silent jump. */
  useEffect(() => {
    setLoading(true)
    const delay = firstLoad.current ? 500 : 450
    firstLoad.current = false
    const timer = setTimeout(() => setLoading(false), delay)
    return () => clearTimeout(timer)
  }, [search, category, sort])

  function resetFilters() {
    setSearch('')
    setCategory('All')
    setSort('featured')
  }

  return (
    <div className="container">
      <section className="section" style={{ paddingBottom: 0 }}>
        <h1 className="page-title">Shop</h1>
        <p className="page-lead">
          Search the catalog, filter by category, or sort by price and name.
        </p>
        <div className="shop-toolbar">
          <div className="shop-search-row">
            <label className="shop-search">
              <span className="visually-hidden">
                Search products
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search earbuds, chargers, watches"
                aria-label="Search products"
              />
            </label>
            <span className="shop-sort">
              <label htmlFor="sort">Sort</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </span>
          </div>
          <div className="shop-filters" aria-label="Filter by category">
            {['All', ...site.categories].map((item) => (
              <button
                key={item}
                className={'chip' + (category === item ? ' active' : '')}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        {loading ? (
          <SkeletonGrid count={8} />
        ) : (
          <>
            <p className="results-count" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? 'product' : 'products'} found.
            </p>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <h2>No products match your search.</h2>
                <p>Try a different term, or clear the filters to see the full catalog.</p>
                <button className="btn btn-primary" onClick={resetFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
