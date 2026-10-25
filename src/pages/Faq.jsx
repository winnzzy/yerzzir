import { useState } from 'react'

const faqs = [
  {
    question: 'How long does delivery take?',
    answer: 'Standard delivery takes 3 to 5 working days. Express delivery takes 1 to 2 working days. Delivery times count from the day your order is confirmed, and working days exclude Saturdays, Sundays, and public holidays.',
  },
  {
    question: 'Where do you deliver?',
    answer: 'Delivery covers all 36 states and the Federal Capital Territory. Enter your full address at checkout, including your state and city, so the courier can reach you without delay.',
  },
  {
    question: 'How much does delivery cost?',
    answer: 'Standard delivery costs ₦3,000. Express delivery costs ₦5,000. Lagos orders with a subtotal of ₦100,000 or more ship free, no matter which delivery method is chosen.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'All payments go through Flutterwave at checkout: card, bank transfer, or USSD. Your order is confirmed once Flutterwave reports a successful payment, and Flutterwave emails you a payment receipt.',
  },
  {
    question: 'How do I track my order?',
    answer: 'Open the track order page and enter your order number and the phone number used at checkout. Your order number is shown on the confirmation page after you place an order.',
  },
  {
    question: 'What is your returns policy?',
    answer: 'Items that arrive damaged or faulty can be returned within 7 days of delivery. Use the contact form on this site to report the problem, and include your order number and a description of the fault. Items returned for a change of mind are reviewed case by case. Refunds are issued to the original payment method, or as a replacement item where that fits better.',
  },
  {
    question: 'Can I change or cancel my order?',
    answer: 'Orders can be changed or cancelled before dispatch. Use the contact form with your order number as soon as possible. Once an order is handed to the courier, changes are no longer possible, and the normal returns process applies instead.',
  },
  {
    question: 'What if an item I want is out of stock?',
    answer: 'Out of stock items cannot be added to the cart. Check back later, or use the contact form to ask about restock timing for a specific item.',
  },
]

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="container">
      <section className="section">
        <h1 className="page-title">Frequently asked questions</h1>
        <p className="page-lead">
          Delivery, payment, tracking, and returns, answered plainly.
        </p>
        <div className="faq-list">
          {faqs.map((faq, i) => {
            const open = openIndex === i
            return (
              <div className="faq-item" key={faq.question}>
                <button
                  className="faq-question"
                  onClick={() => setOpenIndex(open ? -1 : i)}
                  aria-expanded={open}
                >
                  {faq.question}
                  <span aria-hidden="true">{open ? '−' : '+'}</span>
                </button>
                {open && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
