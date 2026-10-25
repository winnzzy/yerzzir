import { useEffect, useState } from 'react'
import { StoreProvider } from './store/StoreContext.jsx'
import { parseHash, matchRoute } from './lib/router.js'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'
import TrackOrder from './pages/TrackOrder.jsx'
import About from './pages/About.jsx'
import Faq from './pages/Faq.jsx'
import Contact from './pages/Contact.jsx'

function NotFound() {
  return (
    <div className="container">
      <section className="section">
        <h1 className="page-title">Page not found.</h1>
        <p className="page-lead">
          The page you are looking for does not exist.
        </p>
        <a className="btn btn-primary" href="#/">Back to home</a>
      </section>
    </div>
  )
}

function Router({ route }) {
  const { path, query } = route

  if (path === '/') return <Home />
  if (path === '/shop') return <Shop query={query} />
  if (path === '/cart') return <Cart />
  if (path === '/checkout') return <Checkout />
  if (path === '/track') return <TrackOrder query={query} />
  if (path === '/about') return <About />
  if (path === '/faq') return <Faq />
  if (path === '/contact') return <Contact />

  const productParams = matchRoute('/product/:id', path)
  if (productParams) return <ProductDetail params={productParams} />

  const successParams = matchRoute('/success/:orderNumber', path)
  if (successParams) return <OrderSuccess params={successParams} />

  return <NotFound />
}

export default function App() {
  const [route, setRoute] = useState(() => parseHash())

  useEffect(() => {
    function onHashChange() {
      setRoute(parseHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <StoreProvider>
      <Header currentPath={route.path} />
      <main>
        <Router route={route} />
      </main>
      <Footer />
    </StoreProvider>
  )
}
