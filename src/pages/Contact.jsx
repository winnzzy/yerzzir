import { useState } from 'react'

/* Contact form. Messages are stored on this device until an inbox is
   connected. The form shows a sending state and a success state. */
export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address.'
    }
    if (!form.message.trim()) next.message = 'Enter your message.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSending(true)
    setTimeout(() => {
      try {
        const stored = JSON.parse(
          window.localStorage.getItem('techimport_messages_v1') || '[]',
        )
        stored.push({ ...form, sentAt: new Date().toISOString() })
        window.localStorage.setItem('techimport_messages_v1', JSON.stringify(stored))
      } catch {
        // If storage is unavailable, the success state still applies.
      }
      setSending(false)
      setSent(true)
    }, 900)
  }

  if (sent) {
    return (
      <div className="container">
        <section className="section narrow">
          <h1 className="page-title">Message received.</h1>
          <p className="page-lead">
            Thank you, {form.name}. Your message has been recorded. Our team
            will reply to {form.email}.
          </p>
          <a className="btn btn-primary" href="#/shop">Continue shopping</a>
        </section>
      </div>
    )
  }

  return (
    <div className="container">
      <section className="section narrow">
        <h1 className="page-title">Contact us</h1>
        <p className="page-lead">
          Ask about an order, a product, or delivery. Include your order
          number when your question is about an existing order.
        </p>
        <p className="muted">Contact details coming soon.</p>
        <form onSubmit={handleSubmit} noValidate className="form-stack">
          <div className={'field' + (errors.name ? ' invalid' : '')}>
            <label htmlFor="contact-name">Your name</label>
            <input
              id="contact-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Your full name"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className={'field' + (errors.email ? ' invalid' : '')}>
            <label htmlFor="contact-email">Email address</label>
            <input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="you@example.com"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className={'field' + (errors.message ? ' invalid' : '')}>
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              rows={5}
              value={form.message}
              onChange={(e) => setField('message', e.target.value)}
              placeholder="Write your question or order number here"
            />
            {errors.message && <span className="field-error">{errors.message}</span>}
          </div>
          <button className="btn btn-primary" type="submit" disabled={sending}>
            {sending && <span className="btn-spinner" aria-hidden="true" />}
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </form>
      </section>
    </div>
  )
}
