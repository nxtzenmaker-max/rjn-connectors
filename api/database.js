// Vercel Serverless Function: Database & Memory Cloud Sync Connector
const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1/functions/rjn-sync/executions';
const APPWRITE_PROJECT_ID = '6af08cee002c1c5b2882';
const RAILWAY_WHATSAPP_URL = 'https://rjn-whatsapp-production.up.railway.app';
const RAILWAY_RUNNER_URL = 'https://rjn-runner-production.up.railway.app';
const RUNNER_SECRET_KEY = 'rjn_live_runner_9a8b7c6d5e4f3a2b1';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let action = req.body && req.body.action ? req.body.action : (req.query.action || 'health');
  if (action === 'recent' || action === 'memory' || action === 'history') {
    action = 'get_history';
  }
  let sessionId = req.body && req.body.sessionId ? req.body.sessionId : (req.query.sessionId || 'usr_rjn_zeno_main');
  if (!sessionId || sessionId === 'anonymous') {
    sessionId = 'usr_rjn_zeno_main';
  }
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
        const phoneParam = req.body?.phone || req.query?.phone || '';
        const limitParam = req.body?.limit || req.query?.limit || 50;
        const safeQ = String(phoneParam).replace(/"/g, '\\"');
        const safeLim = String(limitParam).replace(/[^0-9]/g, '');
        const cmd = `python3 /root/mongo_tool.py get_whatsapp_messages "${safeQ}" "${safeLim}"`;
        const runResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RUNNER_SECRET_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd, timeout: 20000 })
        });
        const runData = await runResp.json();
        let parsed = null;
        try { parsed = JSON.parse(runData.stdout.trim()); } catch(e){ parsed = runData.stdout; }
        return res.status(200).json(parsed || { success: true, count: 0, messages: [] });
      } catch(e) {
        return res.status(500).json({ success: false, error: e.message });
      }
    }

    // 3. Save or Search Contacts in MongoDB Atlas
    if (action === 'save_contact') {
      const name = req.body?.name || req.query.name || 'Unknown';
      const phone = req.body?.phone || req.query.phone || '';
      const relation = req.body?.relation || req.query.relation || '';
      const safeName = name.replace(/"/g, '\\"');
      const safePhone = phone.replace(/"/g, '\\"');
      const safeRel = relation.replace(/"/g, '\\"');
      const cmd = `python3 /root/mongo_tool.py save_contact "${safeName}" "${safePhone}" "${safeRel}"`;
      const runResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RUNNER_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, timeout: 20000 })
      });
      const runData = await runResp.json();
      let parsed = null;
      try { parsed = JSON.parse(runData.stdout.trim()); } catch(e){ parsed = runData.stdout; }
      return res.status(200).json({ success: true, action: 'save_contact', result: parsed });
    }

    if (action === 'get_contacts' || action === 'contacts' || action === 'search_contacts') {
      const query = req.body?.query || req.query.query || '';
      const safeQ = query.replace(/"/g, '\\"');
      const cmd = `python3 /root/mongo_tool.py get_contacts "${safeQ}"`;
      const runResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RUNNER_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, timeout: 20000 })
      });
      const runData = await runResp.json();
      let parsed = null;
      try { parsed = JSON.parse(runData.stdout.trim()); } catch(e){ parsed = runData.stdout; }
      return res.status(200).json({ success: true, action: 'get_contacts', result: parsed });
    }

    // 4. Custom Persistent Memory Key-Value
    if (action === 'save_memory') {
      const key = req.body?.key || req.query.key || 'note';
      const value = req.body?.value || req.query.value || '';
      const safeK = key.replace(/"/g, '\\"');
      const safeV = value.replace(/"/g, '\\"');
      const cmd = `python3 /root/mongo_tool.py save_memory "${safeK}" "${safeV}"`;
      const runResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RUNNER_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, timeout: 20000 })
      });
      const runData = await runResp.json();
      let parsed = null;
      try { parsed = JSON.parse(runData.stdout.trim()); } catch(e){ parsed = runData.stdout; }
      return res.status(200).json({ success: true, action: 'save_memory', result: parsed });
    }

    if (action === 'get_memory') {
      const key = req.body?.key || req.query.key || '';
      const safeK = key.replace(/"/g, '\\"');
      const cmd = `python3 /root/mongo_tool.py get_memory "${safeK}"`;
      const runResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RUNNER_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, timeout: 20000 })
      });
      const runData = await runResp.json();
      let parsed = null;
      try { parsed = JSON.parse(runData.stdout.trim()); } catch(e){ parsed = runData.stdout; }
      return res.status(200).json({ success: true, action: 'get_memory', result: parsed });
    }

    // 5. Autonomous AGY Worker Actions
    if (action === 'assign_task' || action === 'assign') {
      const instruction = req.body?.instruction || req.query.instruction || '';
      const directory = req.body?.directory || req.query.directory || '';
      const safeInstr = instruction.replace(/"/g, '\\"');
      const safeDir = directory.replace(/"/g, '\\"');
      const cmd = `python3 /root/mongo_tool.py assign_task "${safeInstr}" "${safeDir}"`;
      const runResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RUNNER_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, timeout: 20000 })
      });
      const runData = await runResp.json();
      let parsed = null;
      try { parsed = JSON.parse(runData.stdout.trim()); } catch(e){ parsed = runData.stdout; }
      return res.status(200).json({ success: true, action: 'assign_task', result: parsed });
    }

    if (action === 'get_task' || action === 'task_status') {
      const taskId = req.body?.taskId || req.query.taskId || 'latest';
      const safeId = taskId.replace(/"/g, '\\"');
      const cmd = `python3 /root/mongo_tool.py get_task "${safeId}"`;
      const runResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RUNNER_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, timeout: 20000 })
      });
      const runData = await runResp.json();
      let parsed = null;
      try { parsed = JSON.parse(runData.stdout.trim()); } catch(e){ parsed = runData.stdout; }
      return res.status(200).json({ success: true, action: 'get_task', result: parsed });
    }

    if (action === 'agent_status' || action === 'worker_status') {
      const cmd = 'python3 /root/mongo_tool.py agent_status';
      const runResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RUNNER_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, timeout: 20000 })
      });
      const runData = await runResp.json();
      let parsed = null;
      try { parsed = JSON.parse(runData.stdout.trim()); } catch(e){ parsed = runData.stdout; }
      return res.status(200).json({ success: true, action: 'agent_status', result: parsed });
    }

    // 5. Hologram Speech Turns Sync via Appwrite
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
