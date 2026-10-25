# Yerzzir Store backend

The storefront works on its own with browser storage. This backend adds
real orders, Flutterwave payment confirmation, order and abandoned cart
emails, operator chat, and WhatsApp intake. It implements
docs/backend-spec.md on a serverless stack: Vercel serverless API routes
plus Postgres. There is no persistent server process and no SQLite
file, because serverless functions cannot hold either reliably.

## Layout

- `api/` holds one file per route. Vercel maps each file to its path,
  so `api/orders/[orderNumber].js` serves `/api/orders/:orderNumber`.
- `lib/` holds the shared code. `lib/db.js` is the only file that
  touches the database, so a provider change means changing
  DATABASE_URL, not the routes.
- `vercel.json` holds the cron schedule for abandoned cart reminders.
- `src/config/api.js` and `src/lib/apiClient.js` are the storefront
  seam. They are not wired into any page yet.

## Deploy to Vercel

1. Import the GitHub repo into Vercel. Vercel detects the Vite project
   on its own: build command `npm run build`, output directory `dist`.
   No rewrites are needed, because the storefront uses hash routing.
2. Set every variable from `.env.example` in the Vercel dashboard
   under Settings, Environment Variables.
3. Deploy. The storefront and the API then share one domain, and the
   API lives under `/api`.

## Environment variables

- `DATABASE_URL`: Postgres connection string. Required for every route
  except health and WhatsApp verification. Use the pooled connection
  string: for Supabase, the transaction mode pooler string (port 6543);
  for Neon, its pooled string. The pool uses SSL unless
  `DATABASE_SSL` is set to `false`, which fits only a local Postgres.
- `ADMIN_TOKEN`: shared token for the admin list, status update, and
  chat reply routes, sent as the `x-admin-token` header. When unset,
  admin routes are disabled with an honest error and are never open.
- `FLUTTERWAVE_SECRET_KEY`: Flutterwave secret key, used only server
  side to verify transactions. Must arrive through the Secure Vault,
  never chat. Never put it in front end code.
- `FLUTTERWAVE_WEBHOOK_SECRET`: secret hash compared against the
  `verif-hash` header on every webhook call. Must arrive through the
  Secure Vault.
- `RESEND_API_KEY`: Resend API key for order and abandoned cart emails.
- `EMAIL_FROM_DOMAIN`: domain verified in Resend. Store emails are sent
  from orders@ on this domain.
- `STORE_URL`: public base URL of the deployed store, used for track
  and shop links in emails. Optional.
- `WHATSAPP_VERIFY_TOKEN`: token Meta sends when verifying the webhook.
- `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp Cloud API
  credentials, needed only for sending WhatsApp replies.
- `CRON_SECRET`: shared secret for the cron reminders route. Vercel
  sends it as a Bearer token with every cron call when it is set.

## Database

The schema is created automatically on first use by `lib/db.js`
(CREATE TABLE IF NOT EXISTS), so no migration step is needed for the
first deploy. Tables: orders, carts, cart_reminders, conversations,
messages. Orders store the order number, contact, shipping, items,
totals, payment method and status, delivery status, and the Flutterwave
transaction id. The server generates the order number in the existing
TIN-YYYYMMDD-XXXX format and is authoritative for the subtotal and
total. Prices still come from the storefront payload, so a server side
catalog is a future hardening step, not part of this build.

## Endpoints

All endpoints return JSON.

- `GET /api/health`: ok flag plus which integrations are configured,
  as booleans only. No secret value is ever revealed.
- `POST /api/orders`: creates an order from the checkout payload.
  Validates name, Nigerian phone, email, street, city, state, and
  non-empty items. Stores payment status pending. Returns the order
  number and the stored order. Creating an order also marks that
  email's open carts as converted, so reminders stop at once.
- `GET /api/orders/:orderNumber?phone=:phone`: looks up one order by
  order number plus phone. A wrong phone returns the same not found
  response as a missing order.
- `GET /api/orders`: operator list. Requires the admin token. When
  ADMIN_TOKEN is unset, the route is disabled.
- `PATCH /api/orders/:orderNumber/status`: updates delivery status to
  placed, processing, shipped, delivered, or cancelled. Requires the
  admin token.
- `POST /api/webhooks/flutterwave`: Flutterwave payment events. See
  the webhook section below.
- `POST /api/carts`: records an abandoned cart snapshot. Only carts
  with an email address are accepted.
- `POST /api/carts/:id/remind`: sends the next due reminder for one
  cart, or reports honestly when nothing is due.
- `GET /api/cron/reminders`: Vercel Cron route. Requires the cron
  secret. Processes every open cart once.
- `POST /api/chat/conversations`: opens a customer chat conversation.
- `POST /api/chat/conversations/:id/messages`: appends a customer
  message to the queue.
- `GET /api/chat/conversations/:id/messages`: lists the messages of
  one conversation in order, for widget polling.
- `POST /api/chat/conversations/:id/replies`: operator reply. Requires
  the admin token. For a WhatsApp conversation, the reply is also sent
  to the customer on WhatsApp when the WhatsApp credentials are set,
  and the response reports whether that send worked.
- `GET /api/webhooks/whatsapp`: Meta verification. Returns
  hub.challenge when hub.verify_token matches WHATSAPP_VERIFY_TOKEN.
- `POST /api/webhooks/whatsapp`: receives a WhatsApp message, stores
  it as a chat conversation linked to the sender phone, and sends a
  short automatic acknowledgement through the WhatsApp Cloud API only
  when the WhatsApp credentials are set.

## Flutterwave webhook verification

Trust is earned in two steps, never from the webhook body alone:

1. The `verif-hash` header must match FLUTTERWAVE_WEBHOOK_SECRET.
2. The transaction is verified server side with the Flutterwave
   verification API, and the amount, currency, and tx_ref must match
   the stored order.

Only then is the order marked paid, and the order confirmation email is
sent. The store is Flutterwave only, so the confirmation email goes out
once payment is confirmed, not when an unpaid order is created. Events
other than charge.completed are acknowledged and ignored. A webhook for
an unknown order, an already paid order, or a failed verification
changes nothing. Server logs record outcomes only, never keys and never
request bodies.

## Operator chat

Chat on this store is a queue, not an automatic answering service.
Customers write through the widget or WhatsApp, messages wait in
Postgres, and the operator replies through the reply endpoint with the
admin token. The widget polls the messages route for replies. There is
no automatic answering anywhere in this backend. Card details must
never be collected in chat or WhatsApp: payment always happens through
a Flutterwave payment link.

## Abandoned cart reminders

The sequence from docs/emails/abandoned-cart.md runs at 1 hour, 24
hours, and 72 hours after abandonment, through Resend. The rules are
enforced in code: only carts with an email address are recorded, a
cart that converts to an order stops at once, opted out carts never
receive another email, each step sends at most once, and no cart
receives two steps on the same day. Every send is recorded in the
database, so a repeated cron run can never duplicate an email. The
cron schedule in vercel.json runs every 15 minutes. Note the Vercel
plan limit: Hobby plans allow daily cron schedules only, so on Hobby
change the schedule to once a day (for example `0 9 * * *`) or upgrade
to Pro for the 15 minute schedule. The manual remind route sends the
next due reminder for one cart under the same rules.

## Email sending

Email goes through Resend and activates only when RESEND_API_KEY and
EMAIL_FROM_DOMAIN are both set and the domain is verified in Resend.
Until the store domain is bought and verified, every email call returns
a not-configured result and nothing is sent. Templates mirror
docs/emails/order-confirmation.md and docs/emails/abandoned-cart.md.

## WhatsApp activation

1. Create the WhatsApp Business app and number in Meta for Developers.
2. Set WHATSAPP_VERIFY_TOKEN and use it when subscribing the webhook
   URL, which is the deployed domain plus `/api/webhooks/whatsapp`.
3. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID to enable replies.
   Without them, incoming messages are still stored, and the webhook
   response says so honestly.

## Storefront seam

`src/config/api.js` holds `apiBaseUrl`, which is null by default, so
the storefront keeps its current localStorage behavior and nothing
changes. `src/lib/apiClient.js` holds order and chat functions that use
fetch when apiBaseUrl is set and fall back to localStorage when it is
null. To connect the storefront: set apiBaseUrl to an empty string for
same origin (right when frontend and API share one Vercel project) or
to a full URL for a separately hosted backend, then wire the checkout,
track, and chat widget pages to the apiClient functions. That wiring
is a separate step and is not done here, so the deployed storefront
keeps working exactly as today until it is wired.

## Local testing

There is no persistent server to run. The Vite dev server does not
serve `/api` routes, so for a full local stack use `vercel dev` once
the Vercel CLI is connected. Without it, test a route by importing its
handler in Node and invoking it with a mock request and response, as
in: import the handler, pass `{ method, query, body, headers }`, and
read the status and JSON body from the mock response. Routes that need
the database return an honest 503 without DATABASE_URL, and routes
that validate first (order creation, cart creation, chat messages)
return 400 for bad input before touching the database. Handler files
use the same module format as the rest of the project, so plain Node
can import them.

## Security notes

Secrets live only in environment variables, never in code, never in
the repo, and never in chat. The Flutterwave secret key and webhook
secret must arrive through the Secure Vault. Server logs record counts
and statuses only, never tokens, keys, or message bodies. Admin and
cron routes fail closed when their tokens are unset. Future hardening,
not part of this build: server side delivery fee computation, a server
side product catalog as the price authority, WhatsApp webhook
signature verification with the app secret, and rate limiting on the
public routes.
