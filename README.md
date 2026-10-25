# Yerzzir Store

A Nigeria-based online store that sells tech gadgets sourced from China.
Customers browse products, add items to a cart, check out, pay
through Flutterwave, and track orders by order number and phone
number. Prices are in Nigerian Naira. Orders and cart contents are
stored in the browser (localStorage), so no server or database is
needed to run the store.

## Run it

Requirements: Node.js 18 or newer, and npm.

```bash
npm install
npm run dev
```

Open the address printed by Vite, usually http://localhost:5173.

To build the production bundle:

```bash
npm run build
npm run preview
```

Routing uses the URL hash, so the built site works when served as
static files, with no server configuration.

## Pages and routes

- `/` Home: hero, category strip, featured carousel, best sellers, how ordering works.
- `/shop` Shop: search, category filter, sort, skeleton loading state.
- `/product/:id` Product detail: specs, quantity selector, add to cart, related products.
- `/cart` Cart: quantity controls, remove, subtotal, delivery fee note.
- `/checkout` Checkout: contact details, shipping address with Nigerian state dropdown, delivery method, payment method, order review, place order with progress state and validation.
- `/success/:orderNumber` Order confirmation: order number, summary, delivery estimate, payment notes.
- `/track` Track order: look up an order by order number and phone number.
- `/about` About the store, factual only.
- `/faq` Delivery, payment, tracking, and returns questions.
- `/contact` Contact form with a sending state and a success state.

## Change the brand name

Edit one file: `src/config/site.js`. Change `brandName` and `tagline`.
Every page, the header, and the footer read the name from there, so no
other file needs to change. The current name is a working name, to be
replaced with the real brand name when it is confirmed.

## Replace the product catalog

Edit `src/data/products.js`. Each product needs an id, name, category,
price in Naira, image path, stock status (`in`, `low`, or `out`), a
short description, specs, and flags for featured and best seller. Put
product photos in `public/images/` and point the image field at them.
The file header marks the current 12 products as a starter catalog.

## Delivery fee rule

The rule lives in `src/config/site.js` under `delivery`, and the same
rule is implemented in `src/lib/shop.js`:

- Standard delivery costs ₦3,000 and takes 3 to 5 working days.
- Express delivery costs ₦5,000 and takes 1 to 2 working days.
- Lagos orders with a subtotal of ₦100,000 or more ship free, no matter
  which delivery method is chosen.

Change the numbers in `site.js` to change the rule everywhere.

## Connect Flutterwave

The payment provider is Flutterwave, and it is the only payment method
on this store. The payment seam is one file: `src/config/payments.js`.
The public key is set and card payments are enabled, so Flutterwave
Checkout is active.

To change the key:

1. Copy the public key from the Flutterwave dashboard.
2. In `src/config/payments.js`, paste the public key into `publicKey`.
3. Keep `cardPaymentsEnabled` set to `true`.

That is all the storefront needs. When active, checkout loads the
Flutterwave script and opens the modal with the order number as
tx_ref, the total amount, currency NGN, and the customer name, email,
and phone from the checkout form. Payment options inside Flutterwave
Checkout are card, bank transfer, and USSD. On a successful payment
the order is marked paid and the success page notes that Flutterwave
emails the customer a payment receipt. Closing the modal without
paying places no order.

Never put a secret key in this file or in any front end code. Public
key only. Server side webhook verification is described in
docs/backend-spec.md and must be in place before real payments are
taken. No bank account details are stored in this project.

## Backend

The storefront works on its own with browser storage. A backend of
Vercel serverless API routes plus Postgres lives in `api/` and `lib/`,
covering real orders, Flutterwave webhook verification, order and
abandoned cart emails, operator chat, and WhatsApp intake. See
`api/README.md` for setup, environment variables, and deployment
notes. The storefront connects to it through `src/config/api.js`,
which is null by default, so the site behaves exactly as before until
a backend URL is set.

## Contact details

No real phone number, email address, or physical address is stored in
this project. Pages that would need them say "Contact details coming
soon" instead. Fill in `contact` in `src/config/site.js` and update
the About and Contact pages when the real details are confirmed.

## Design system

All design values live in `src/styles/tokens.css`: one accent color
with dark ink neutrals and white surfaces, a fixed type scale, a 4px
spacing scale, exactly three border radius values, subtle shadows, and
cubic-bezier easing curves. Component styles reference these tokens.
Do not add one-off values. The hero uses a solid surface color. There
are no gradients, no glowing hovers, and hover lift is capped at 2px.

## Data storage

- Cart: `techimport_cart_v1` in localStorage.
- Placed orders: `techimport_orders_v1` in localStorage.
- Contact form messages: `techimport_messages_v1` in localStorage.

Orders are looked up by order number plus the phone number used at
checkout. Because storage is per browser, an order placed on one device
cannot be tracked from another device until a server backend is added.
