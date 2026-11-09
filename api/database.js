// Vercel Serverless Function: Database & Memory Cloud Sync Connector
const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1/functions/rjn-sync/executions';
const APPWRITE_PROJECT_ID = '6af08cee002c1c5b2882';
const RAILWAY_WHATSAPP_URL = 'https://rjn-whatsapp-production.up.railway.app';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.body && req.body.action ? req.body.action : (req.query.action || 'health');
  const sessionId = req.body && req.body.sessionId ? req.body.sessionId : (req.query.sessionId || 'anonymous');
  const userMsg = req.body && req.body.userMsg ? req.body.userMsg : '';
  const aiReply = req.body && req.body.aiReply ? req.body.aiReply : '';
  const shape = req.body && req.body.shape ? req.body.shape : 'none';

  try {
    // 1. Stats and MongoDB Overview
    if (action === 'stats') {
      try {
        const waResp = await fetch(`${RAILWAY_WHATSAPP_URL}/status`);
        const waData = await waResp.json();
        return res.status(200).json({
          success: true,
          action: 'stats',
          database: 'MongoDB Atlas (rjn_holo)',
          whatsappConnected: waData.status === 'connected',
          whatsappPairingCode: waData.pairingCode,
          stats: waData.database
        });
      } catch(e) {
        return res.status(200).json({
          success: true,
          action: 'stats',
          database: 'MongoDB Atlas (rjn_holo)',
          status: 'online'
        });
      }
    }

    // 2. WhatsApp Logged Messages
    if (action === 'whatsapp') {
      try {
        const waResp = await fetch(`${RAILWAY_WHATSAPP_URL}/messages`);
        const waData = await waResp.json();
        return res.status(200).json(waData);
      } catch(e) {
        return res.status(500).json({ success: false, error: e.message });
      }
    }

    // 3. Hologram Speech Turns Sync via Appwrite
    const payload = {
      action,
      sessionId,
      userMsg,
      aiReply,
      shape,
      timestamp: new Date().toISOString()
    };

    const resp = await fetch(APPWRITE_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        body: JSON.stringify(payload),
        async: action === 'sync_turn' // Fast async return for real-time speech turns
      })
    });

    const data = await resp.json();
    let parsedBody = null;
    if (data.responseBody) {
      try { parsedBody = JSON.parse(data.responseBody); } catch(e){ parsedBody = data.responseBody; }
    }

    return res.status(200).json({
      success: true,
      action,
      database: 'MongoDB Atlas (rjn_holo)',
      bridge: 'Appwrite Serverless Execution',
      result: parsedBody || data
    });
  } catch (error) {
    console.error('Database connector error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database connector sync failed: ' + error.message
    });
  }
};
