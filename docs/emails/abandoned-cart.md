# Abandoned cart email sequence

A cart counts as abandoned when a shopper adds at least one item, gives
an email address at checkout or signup, and then leaves without placing
an order. The sequence below runs only for those shoppers.

## Consent rule

Only customers who gave an email address at checkout or signup may be
emailed. Never email an address that was guessed, bought, or taken from
any other source. Every email in this sequence includes a clear way to
opt out, and opted out addresses never receive another email in the
sequence.

## Email 1: 1 hour after abandonment

Subject: You left something in your cart at Yerzzir Store

Body:

Hi there,

You left items in your cart at Yerzzir Store. They are still waiting
for you:

{{cart_items}}

Complete your order here: {{cart_url}}

If you have a question about delivery or payment, reply to this email
and the store will help.

## Email 2: 24 hours after abandonment

Subject: Still thinking it over? Your cart is waiting

Body:

Hi there,

Your cart at Yerzzir Store is still waiting for you:

{{cart_items}}

Standard delivery costs {{standard_fee}} and takes 3 to 5 working
days. Express delivery costs {{express_fee}} and takes 1 to 2 working
days.

Complete your order here: {{cart_url}}

If you no longer want these items, you can ignore this email and your
cart will simply expire.

## Email 3: 72 hours after abandonment

Subject: Last call: your Yerzzir Store cart

Body:

Hi there,

This is the last reminder about your cart at Yerzzir Store:

{{cart_items}}

Complete your order here: {{cart_url}}

After this email, the store will not contact you again about this
cart. If you want to hear about new products later, you can sign up
on the store site.

## Sequence rules

- Stop the sequence immediately if the customer completes the order.
- Stop the sequence immediately if the customer opts out.
- Send at most one email per step. Never send two steps on the same day.
- Placeholders {{cart_items}}, {{cart_url}}, {{standard_fee}}, and
  {{express_fee}} are filled from the cart record and the store
  delivery settings.
