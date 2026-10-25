import { site } from '../config/site.js'

/* Floating WhatsApp chat button. The number comes only from
   site.contact.whatsapp. While that value is null, this component
   renders nothing, so the store never shows a dead button or an
   invented number. */

export default function WhatsAppButton() {
  const number = site.contact.whatsapp
  if (!number) return null

  const greeting = 'Hello Yerzzir Store, I have a question about an order.'
  const href =
    'https://wa.me/' + number + '?text=' + encodeURIComponent(greeting)

  return (
    <a
      className="whatsapp-button"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Yerzzir Store on WhatsApp"
      title="Chat on WhatsApp"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
      </svg>
    </a>
  )
}
