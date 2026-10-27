/* Aviso por Telegram cuando un lead abre la carta (cufadev.xyz/carta-digital/?l=<local>).
   Variables de entorno en Vercel: TG_TOKEN y TG_CHAT. Si faltan, no hace nada. */
const BOTS = /bot|crawl|spider|preview|whatsapp|facebookexternalhit|slack|telegram|curl|wget|headless|lighthouse|monitor/i;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const l = String((req.query && req.query.l) || '');
  const origen = String(req.headers.origin || req.headers.referer || '');
  const ua = String(req.headers['user-agent'] || '');
  const valido = req.method === 'POST' && /^[a-z0-9-]{2,40}$/.test(l)
    && /^https:\/\/(www\.)?cufadev\.xyz(\/|$)/.test(origen) && ua && !BOTS.test(ua);
  const token = process.env.TG_TOKEN, chat = process.env.TG_CHAT;
  if (valido && token && chat) {
    const nombre = l.replace(/-/g, ' ');
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: `👀 ${nombre} abrió la carta digital\nEscribile ahora: #outreach-menus en Mattermost`,
        }),
      });
    } catch (e) { /* el aviso es opcional: nunca romper la página */ }
  }
  res.status(204).end();
};
