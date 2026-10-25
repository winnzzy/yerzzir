import { site } from '../config/site.js'
import { useStore } from '../store/StoreContext.jsx'

const links = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
  { to: '/track', label: 'Track order' },
]

export default function Header({ currentPath }) {
  const { cartCount } = useStore()

  function isActive(to) {
    if (to === '/') return currentPath === '/'
    return currentPath === to || currentPath.startsWith(to + '/')
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden="true">T</span>
          {site.brandName}
        </a>
        <nav className="nav" aria-label="Main navigation">
          {links.map((link) => (
            <a
              key={link.to}
              className={'nav-link' + (isActive(link.to) ? ' active' : '')}
              href={'#' + link.to}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="cart-link" href="#/cart" aria-label={'Cart, ' + cartCount + ' items'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Cart
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </a>
        </div>
      </div>
    </header>
  )
}
