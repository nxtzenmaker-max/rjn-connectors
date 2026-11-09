// Vercel Serverless Function: Database & Memory Cloud Sync Connector
const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1/functions/rjn-sync/executions';
const APPWRITE_PROJECT_ID = '6af08cee002c1c5b2882';

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
