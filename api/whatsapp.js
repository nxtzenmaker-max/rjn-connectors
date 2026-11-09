// Vercel Serverless Function: RJN WhatsApp Baileys & MongoDB API Proxy
const RAILWAY_WHATSAPP_URL = 'https://rjn-whatsapp-production.up.railway.app';
const DEFAULT_PHONE = '91808797688';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.body && req.body.action) || req.query.action || 'status';
  const phone = (req.body && req.body.phone) || req.query.phone || DEFAULT_PHONE;

  try {
    if (action === 'pair') {
      const resp = await fetch(`${RAILWAY_WHATSAPP_URL}/pair?phone=${encodeURIComponent(phone)}`);
      const data = await resp.json();
      return res.status(200).json({
        success: true,
        action: 'pair',
        phone,
        data,
        instructions: {
          step1: 'Open WhatsApp on your phone (' + phone + ')',
          step2: 'Tap Settings > Linked Devices',
          step3: 'Tap Link with phone number instead',
          step4: 'Enter the pairing code: ' + (data.pairingCode || data.code || 'Check status')
        }
      });
    }

    if (action === 'status') {
      const resp = await fetch(`${RAILWAY_WHATSAPP_URL}/status`);
      const data = await resp.json();
      return res.status(200).json(data);
    }

    if (action === 'send') {
      let to = req.body?.to || req.query.to;
      const message = req.body?.message || req.query.message;
      if (!to || !message) {
        return res.status(400).json({ success: false, error: 'Parameters "to" and "message" are required' });
      }

      // Auto-resolve known contacts / relations
      const toStr = String(to).trim();
      const lowerTo = toStr.toLowerCase();
      if (lowerTo.includes('didi') || lowerTo.includes('sister') || lowerTo.includes('दीदी')) {
        to = '919110181407';
      } else {
        const digits = toStr.replace(/[^0-9]/g, '');
        if (digits.length === 10) {
          to = '91' + digits;
        } else if (digits.length > 10) {
          to = digits;
        }
      }

      const resp = await fetch(`${RAILWAY_WHATSAPP_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message })
      });
      const data = await resp.json();
      return res.status(200).json(data);
    }

    if (action === 'messages') {
      const resp = await fetch(`${RAILWAY_WHATSAPP_URL}/messages`);
      const data = await resp.json();
      return res.status(200).json(data);
    }

    if (action === 'contacts') {
      const resp = await fetch(`${RAILWAY_WHATSAPP_URL}/contacts`);
      const data = await resp.json();
      return res.status(200).json(data);
    }

    if (action === 'chats') {
      const resp = await fetch(`${RAILWAY_WHATSAPP_URL}/chats`);
      const data = await resp.json();
      return res.status(200).json(data);
    }

    // Default: Return API documentation & overview
    return res.status(200).json({
      name: 'RJN WhatsApp API Connector',
      version: '1.0.0',
      host: 'Vercel Serverless Gateway',
      backend: RAILWAY_WHATSAPP_URL,
      database: 'MongoDB Atlas (rjn_holo)',
      actions: ['status', 'pair', 'send', 'messages'],
      endpoints: {
        pair: '/api/whatsapp?action=pair&phone=91808797688',
        status: '/api/whatsapp?action=status',
        send: '/api/whatsapp?action=send&to=91XXXXXXXXXX&message=Hello',
        messages: '/api/whatsapp?action=messages'
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'WhatsApp proxy error: ' + error.message,
      backend: RAILWAY_WHATSAPP_URL
    });
  }
};
