import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getProduct } from '../data/products.js'
import { normalizePhone } from '../lib/shop.js'

const CartKey = 'techimport_cart_v1'
const OrdersKey = 'techimport_orders_v1'

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => readJson(CartKey, []))
  const [orders, setOrders] = useState(() => readJson(OrdersKey, []))

  useEffect(() => {
    window.localStorage.setItem(CartKey, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    window.localStorage.setItem(OrdersKey, JSON.stringify(orders))
  }, [orders])

  const cartItems = useMemo(() => {
    return cart
      .map((line) => {
        const product = getProduct(line.id)
        if (!product) return null
        return { ...product, qty: line.qty, lineTotal: product.price * line.qty }
      })
      .filter(Boolean)
  }, [cart])

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems],
  )

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartItems],
  )

  function addToCart(id, qty = 1) {
    setCart((prev) => {
      const found = prev.find((line) => line.id === id)
      if (found) {
        return prev.map((line) =>
          line.id === id ? { ...line, qty: line.qty + qty } : line,
        )
      }
      return [...prev, { id, qty }]
    })
  }

  function updateQty(id, qty) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((line) => line.id !== id))
      return
    }
    setCart((prev) =>
      prev.map((line) => (line.id === id ? { ...line, qty } : line)),
    )
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((line) => line.id !== id))
  }

  function clearCart() {
    setCart([])
  }

  function placeOrder(order) {
    setOrders((prev) => [order, ...prev])
  }

  function findOrder(orderNumber, phone) {
    const wantedNumber = String(orderNumber || '').trim().toUpperCase()
    const wantedPhone = normalizePhone(phone)
    return orders.find(
      (order) =>
        order.orderNumber.toUpperCase() === wantedNumber &&
        normalizePhone(order.contact.phone) === wantedPhone,
    )
  }

  const value = {
    cart, cartItems, cartCount, subtotal,
    addToCart, updateQty, removeFromCart, clearCart,
    orders, placeOrder, findOrder,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}
