import { site } from '../config/site.js'
import Logo from './Logo.jsx'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <p className="footer-brand"><Logo /></p>
            <p className="footer-note">
              {site.tagline} Orders are placed on this site, paid securely
              at checkout, by bank transfer, or on delivery, and shipped to
              addresses across Nigeria.
            </p>
            <p className="footer-note">Contact details coming soon.</p>
          </div>
          <div>
            <p className="footer-heading">Shop</p>
            <ul className="footer-links">
              <li><a href="#/shop">All products</a></li>
              {site.categories.map((category) => (
                <li key={category}>
                  <a href={'#/shop?category=' + encodeURIComponent(category)}>{category}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="footer-heading">Help</p>
            <ul className="footer-links">
              <li><a href="#/track">Track your order</a></li>
              <li><a href="#/faq">Delivery and returns questions</a></li>
              <li><a href="#/about">About the store</a></li>
              <li><a href="#/contact">Contact us</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} {site.brandName}. All rights reserved.</span>
          <span>Prices are in Nigerian Naira.</span>
        </div>
      </div>
    </footer>
  )
}
