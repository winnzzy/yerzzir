import { site } from '../config/site.js'

export default function About() {
  return (
    <div className="container">
      <section className="section narrow">
        <h1 className="page-title">About {site.brandName}</h1>
        <p>
          {site.brandName} is a Nigeria-based online store that sells tech
          gadgets sourced from China. The catalog covers earbuds, power
          banks, smartwatches, speakers, chargers, and phone accessories.
        </p>
        <p>
          Customers browse the catalog on this site, place an order with a
          delivery address, and pay securely through Flutterwave at
          checkout, by card, bank transfer, or USSD.
        </p>
        <p>
          Orders are delivered across all 36 states and the Federal Capital
          Territory. Standard delivery takes 3 to 5 working days. Express
          delivery takes 1 to 2 working days. Lagos orders with a subtotal
          of ₦100,000 or more ship free.
        </p>
        <p>
          Questions about an order can be sent through the contact form on
          this site. Contact details are coming soon.
        </p>
        <a className="btn btn-primary" href="#/shop">Browse products</a>
      </section>
    </div>
  )
}
