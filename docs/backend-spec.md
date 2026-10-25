# Backend spec for Yerzzir Store

The storefront today runs entirely in the browser. Cart and orders live
in localStorage on one device, so an order placed on one device cannot
be tracked from another, no real email is sent, and chat orders have
nowhere to land. This spec describes the backend that closes those
gaps. Build it once, then connect the storefront to it in this order:
orders first, payments second, email third, chat last.

## 1. Server and order database

- A small server with a database that stores orders, order items,
  customers, and order status changes.
- The storefront sends each placed order to the server instead of
  localStorage. The server returns the order number.
- The track order page looks orders up from the server by order number
  plus phone number, so tracking works from any device.
- Order status values: Processing, Shipped, Delivered. Status changes
  are recorded with a timestamp.
- Keep localStorage only as a short term cache, never as the record
  of an order.

## 2. Flutterwave payments

- The storefront opens Flutterwave Checkout with the public key, the
  order number as tx_ref, the amount, currency NGN, and the customer
  name, email, and phone.
- The server exposes a webhook endpoint for Flutterwave events.
- Verify every webhook two ways before giving value:
  1. Check the verif-hash header against the secret hash stored on
     the server.
  2. Verify the transaction server side with the Flutterwave
     verification API, and confirm the amount, currency, and tx_ref
     match the order.
- Only mark an order paid after both checks pass. Never trust the
  browser callback alone.
- Flutterwave emails the customer a payment receipt after a
  successful payment. The store sends its own order confirmation
  email separately, using the template in docs/emails/order-confirmation.md.
- Secret keys live only on the server, in environment variables.
  Never put a secret key in front end code, in the repo, or in chat.

## 3. Email sending

- Send through a transactional provider such as Resend, from the
  store domain once the sending domain is confirmed.
- Templates live in docs/emails. The order confirmation email goes
  out on order placement and, for Flutterwave payments, on payment
  confirmation.
- Abandoned cart capture: when a shopper gives an email address at
  checkout or signup and leaves without ordering, save the cart with
  the email address and the time of abandonment.
- Scheduled sends: a scheduled job checks for abandoned carts and
  sends the 1 hour, 24 hour, and 72 hour emails from
  docs/emails/abandoned-cart.md, stopping at once if the order is
  completed or the customer opts out.
- Never email an address that was not given at checkout or signup.

## 4. WhatsApp order taking

- Connect the WhatsApp Business API to the store number once the
  number is confirmed in src/config/site.js.
- A customer who messages the store on WhatsApp can browse products,
  give a delivery address and phone number, and confirm an order in
  the conversation.
- Every WhatsApp order is written to the same order store as website
  orders, with the same order number format, so tracking works the
  same way for every channel.
- **Never collect card details in chat or WhatsApp. Always send a
  Flutterwave payment link for payment.**

## 5. Mimi chat endpoint

- The chat widget on the site answers today from a built in guide.
  The backend adds a chat endpoint that receives a customer message
  and returns a reply, so the widget can hold a real conversation.
- Chat orders follow the same path as WhatsApp orders: the customer
  confirms items, address, and phone number in chat, the order is
  written to the same order store, and payment is handled only
  through a Flutterwave payment link.
- **Never collect card details in chat or WhatsApp. Always send a
  Flutterwave payment link for payment.**
- Chat transcripts and callback numbers are stored with the same care
  as order records, and are never shared with any other party.

## 6. What the storefront needs from the backend

- POST order: create an order, return the order number.
- GET order by number plus phone: order details and status.
- POST webhook: Flutterwave events, verified as described above.
- POST email events: order confirmation sends and abandoned cart
  scheduling triggers.
- POST chat message: message in, reply out, plus order creation from
  chat when the customer confirms.
- GET/POST WhatsApp messages: inbound customer messages and outbound
  replies and payment links, through the WhatsApp Business API.
