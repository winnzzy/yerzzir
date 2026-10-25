import { useState } from 'react'
import { site } from '../config/site.js'
import { formatNaira } from '../lib/shop.js'

/* Chat with Mimi widget. This widget is offline first: it answers from
   a built in guide and never claims to be a live conversation. The
   live Mimi connection arrives with the backend endpoint described in
   docs/backend-spec.md. Questions the guide cannot answer can be left
   with a phone number, saved on this device for store follow up. */

const callbacksKey = 'techimport_chat_callbacks_v1'

function deliveryFeesAnswer() {
  return (
    'Standard delivery costs ' + formatNaira(site.delivery.standardFee) +
    ' and takes 3 to 5 working days. Express delivery costs ' +
    formatNaira(site.delivery.expressFee) +
    ' and takes 1 to 2 working days. Lagos orders of ' +
    formatNaira(site.delivery.freeLagosThreshold) + ' or more ship free.'
  )
}

const quickAnswers = [
  {
    chip: 'Delivery fees',
    match: ['fee', 'fees', 'cost', 'delivery fee', 'shipping fee', 'charge'],
    answer: deliveryFeesAnswer(),
  },
  {
    chip: 'Payment methods',
    match: ['payment', 'pay', 'card', 'transfer', 'ussd', 'flutterwave'],
    answer:
      'You can pay by bank transfer using your order number as the ' +
      'reference, or pay on delivery. Card, bank transfer, and USSD ' +
      'through Flutterwave will be available once the store connects ' +
      'its payment key.',
  },
  {
    chip: 'Track my order',
    match: ['track', 'status', 'where is my order', 'order status'],
    answer:
      'Open the Track order page from the menu and enter your order ' +
      'number and the phone number you used at checkout.',
  },
  {
    chip: 'Delivery time',
    match: ['time', 'long', 'arrive', 'days', 'when'],
    answer:
      'Standard delivery takes 3 to 5 working days. Express delivery ' +
      'takes 1 to 2 working days, nationwide.',
  },
]

const fallbackAnswer =
  'Thanks for your question. I do not have an answer for that yet. ' +
  'Leave your phone number below and the store will follow up.'

function findAnswer(text) {
  const lower = text.toLowerCase()
  for (const item of quickAnswers) {
    if (item.match.some((word) => lower.includes(word))) return item.answer
  }
  return fallbackAnswer
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      from: 'mimi',
      text:
        'Hello, welcome to Yerzzir Store. Ask me about delivery, ' +
        'payment, or tracking your order. I answer instantly from the ' +
        'store guide. For personal help, leave your phone number and ' +
        'the store will follow up.',
    },
  ])
  const [input, setInput] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneSaved, setPhoneSaved] = useState(false)

  function send(text) {
    const question = text.trim()
    if (!question) return
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: question },
      { from: 'mimi', text: findAnswer(question) },
    ])
  }

  function handleSubmit(event) {
    event.preventDefault()
    send(input)
    setInput('')
  }

  function savePhone(event) {
    event.preventDefault()
    const value = phone.trim()
    if (!value) return
    try {
      const raw = window.localStorage.getItem(callbacksKey)
      const list = raw ? JSON.parse(raw) : []
      list.push({ phone: value, savedAt: new Date().toISOString() })
      window.localStorage.setItem(callbacksKey, JSON.stringify(list))
    } catch {
      /* Storage is unavailable, so the number cannot be saved. */
    }
    setPhoneSaved(true)
  }

  return (
    <>
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Chat with Mimi">
          <div className="chat-panel-header">
            <div>
              <p className="chat-panel-title">Chat with Mimi</p>
              <p className="chat-panel-note">
                Instant answers from the store guide.
              </p>
            </div>
            <button
              className="chat-close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <p
                key={index}
                className={
                  'chat-message' +
                  (message.from === 'mimi'
                    ? ' chat-message-mimi'
                    : ' chat-message-user')
                }
              >
                {message.text}
              </p>
            ))}
          </div>
          <div className="chat-chips">
            {quickAnswers.map((item) => (
              <button
                key={item.chip}
                className="chat-chip"
                type="button"
                onClick={() => send(item.chip)}
              >
                {item.chip}
              </button>
            ))}
          </div>
          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question"
              aria-label="Ask a question"
            />
            <button className="chat-send" type="submit">Send</button>
          </form>
          {phoneSaved ? (
            <p className="chat-followup muted">
              Saved. The store will follow up on this number.
            </p>
          ) : (
            <form className="chat-followup" onSubmit={savePhone}>
              <input
                className="chat-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number for follow up"
                aria-label="Phone number for follow up"
                inputMode="tel"
              />
              <button className="chat-send" type="submit">Save</button>
            </form>
          )}
        </div>
      )}
      <button
        className="chat-toggle"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close chat with Mimi' : 'Open chat with Mimi'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Chat with Mimi
      </button>
    </>
  )
}
