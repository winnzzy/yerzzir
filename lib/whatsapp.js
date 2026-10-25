/* Sends a WhatsApp message through the WhatsApp Cloud API. Used by the
   webhook intake route for automatic acknowledgements and by the
   operator reply route for WhatsApp conversations. When WHATSAPP_TOKEN
   or WHATSAPP_PHONE_NUMBER_ID is unset, it returns a not-configured
   result and sends nothing. Server logs record only the result, never
   tokens and never message bodies. */

export async function sendWhatsAppMessage(to, text) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) return { sent: false, reason: 'not-configured' }
  try {
    const response = await fetch(
      'https://graph.facebook.com/v21.0/' + phoneNumberId + '/messages',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      },
    )
    if (!response.ok) {
      console.log('[whatsapp] send failed. Status: ' + response.status)
      return { sent: false, reason: 'whatsapp-error' }
    }
    return { sent: true }
  } catch (err) {
    console.log('[whatsapp] send failed. Error: ' + err.message)
    return { sent: false, reason: 'send-failed' }
  }
}
