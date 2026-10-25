# Order confirmation email

Sent immediately after an order is placed and, for Flutterwave payments,
after the payment is confirmed. One email per order. Placeholders in
double braces are filled from the order record. No other customer data
is added to this email.

Placeholders:

- {{store_name}}: Yerzzir Store
- {{customer_name}}: full name from checkout
- {{order_number}}: order number, used as the transfer reference
- {{items}}: one line per item, name, quantity, line total
- {{subtotal}}: items total in Naira
- {{delivery_fee}}: delivery fee in Naira, or Free
- {{total}}: total paid or due in Naira
- {{delivery_address}}: street, city, state, postal code if given
- {{payment_method}}: Flutterwave, bank transfer, or pay on delivery
- {{delivery_estimate}}: estimated delivery window in working days
- {{track_url}}: link to the track order page

## Subject line

Your {{store_name}} order {{order_number}} is confirmed

## Plain text version

Hi {{customer_name}},

Thank you for your order. Your order {{order_number}} is confirmed.

Items:
{{items}}

Subtotal: {{subtotal}}
Delivery: {{delivery_fee}}
Total: {{total}}

Payment method: {{payment_method}}
Delivery address:
{{delivery_address}}

Estimated delivery: {{delivery_estimate}}

Track your order here: {{track_url}}
You need your order number and phone number to track it.

If you paid by bank transfer, use your order number as the transfer
reference. Your order is confirmed once payment is received.

Thank you for shopping with {{store_name}}.

## HTML version

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Your order is confirmed</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #17191d;">
    <h1>Your order {{order_number}} is confirmed</h1>
    <p>Hi {{customer_name}},</p>
    <p>Thank you for your order.</p>
    <h2>Items</h2>
    <p>{{items}}</p>
    <p>Subtotal: {{subtotal}}<br />
    Delivery: {{delivery_fee}}<br />
    <strong>Total: {{total}}</strong></p>
    <p>Payment method: {{payment_method}}</p>
    <h2>Delivery address</h2>
    <p>{{delivery_address}}</p>
    <p>Estimated delivery: {{delivery_estimate}}</p>
    <p><a href="{{track_url}}">Track your order</a></p>
    <p>You need your order number and phone number to track it.</p>
    <p>If you paid by bank transfer, use your order number as the
    transfer reference. Your order is confirmed once payment is
    received.</p>
    <p>Thank you for shopping with {{store_name}}.</p>
  </body>
</html>
```

## Sending rules

- Send from the store domain once the sending domain is confirmed.
  Until then, do not send from a personal mailbox.
- Send once per order. Do not resend on page refresh or repeat visits.
- For Flutterwave payments, Flutterwave also emails the customer a
  payment receipt after a successful payment. That receipt is separate
  from this confirmation email.
