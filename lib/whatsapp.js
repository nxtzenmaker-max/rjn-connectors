// Vercel Serverless Function: RJN WhatsApp Baileys & MongoDB API Proxy
const RAILWAY_WHATSAPP_URL = 'https://rjn-whatsapp-production.up.railway.app';
const RAILWAY_RUNNER_URL = 'https://rjn-runner-production.up.railway.app';
const RUNNER_SECRET_KEY = 'rjn_live_runner_9a8b7c6d5e4f3a2b1';
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
      const message = req.body?.message || req.query.message || '';
      const imageUrl = req.body?.imageUrl || req.body?.image || req.query.imageUrl || req.query.image || '';
      const caption = req.body?.caption || req.query.caption || '';
      if (!to || (!message && !imageUrl)) {
        return res.status(400).json({ success: false, error: 'Parameters "to" and ("message" or "imageUrl") are required' });
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
        body: JSON.stringify({ to, message, imageUrl, caption })
      });
      const data = await resp.json();
      return res.status(200).json(data);
    }

    if (action === 'messages') {
      const phoneParam = req.body?.phone || req.query?.phone;
      const limitParam = req.body?.limit || req.query?.limit || 50;

      // 1. Try Railway WhatsApp microservice first (fast-path if endpoint available)
      try {
        let url = `${RAILWAY_WHATSAPP_URL}/messages`;
        const params = new URLSearchParams();
        if (phoneParam) params.append('phone', phoneParam);
        if (limitParam) params.append('limit', limitParam);
        const qs = params.toString();
        if (qs) url += `?${qs}`;

        const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (resp.ok) {
          const data = await resp.json();
          return res.status(200).json(data);
        }
      } catch (e) {
        // Fallback to direct MongoDB execution
      }

      // 2. Direct high-speed MongoDB retrieval via Railway Cloud Runner
      const safeQ = String(phoneParam || '').replace(/"/g, '\\"');
      const safeLim = String(limitParam || 50).replace(/[^0-9]/g, '');
      const cmd = `python3 /root/mongo_tool.py get_whatsapp_messages "${safeQ}" "${safeLim}"`;
      const runResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RUNNER_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, timeout: 20000 })
      });
      const runData = await runResp.json();
      let parsed = null;
      try { parsed = JSON.parse(runData.stdout.trim()); } catch(e){ parsed = runData.stdout; }
      return res.status(200).json(parsed || { success: false, error: 'Failed to retrieve messages' });
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
      database: 'Cloud Database (Active)',
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
