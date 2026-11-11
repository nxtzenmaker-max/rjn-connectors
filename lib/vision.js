// Vercel Serverless Function: RJN Vision AI & Multimodal Media Inspector
const RAILWAY_RUNNER_URL = 'https://rjn-runner-production.up.railway.app';
const RUNNER_SECRET_KEY = 'rjn_live_runner_9a8b7c6d5e4f3a2b1';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.body && req.body.action) || req.query.action || 'latest_whatsapp';
  const contact = (req.body && req.body.contact) || req.query.contact || '';
  const url = (req.body && req.body.url) || req.query.url || '';

  try {
    if (action === 'latest_whatsapp' || action === 'latest' || action === 'inspect_photo') {
      const safeContact = String(contact || '').replace(/"/g, '\\"');
      const cmd = `/root/vision_venv/bin/python3 /root/vision_analyzer.py latest "${safeContact}"`;

      const runnerResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RUNNER_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: cmd, timeout: 25000 })
      });

      const runnerData = await runnerResp.json();
      let parsed = null;
      try {
        parsed = JSON.parse(runnerData.stdout.trim());
      } catch (e) {
        parsed = { stdout: runnerData.stdout, stderr: runnerData.stderr };
      }

      return res.status(200).json(parsed);
    }

    if (action === 'analyze_url' && url) {
      const safeUrl = String(url).replace(/"/g, '\\"');
      const cmd = `/root/vision_venv/bin/python3 /root/vision_analyzer.py analyze_url "${safeUrl}"`;

      const runnerResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RUNNER_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: cmd, timeout: 25000 })
      });

      const runnerData = await runnerResp.json();
      let parsed = null;
      try {
        parsed = JSON.parse(runnerData.stdout.trim());
      } catch (e) {
        parsed = { stdout: runnerData.stdout, stderr: runnerData.stderr };
      }

      return res.status(200).json(parsed);
    }

    return res.status(200).json({
      name: 'RJN Vision AI Connector',
      version: '1.0.0',
      status: 'active',
      capabilities: ['blip_captioning', 'tesseract_ocr', 'whatsapp_media_inspection'],
      endpoints: {
        latest_whatsapp: '/api/vision?action=latest_whatsapp',
        latest_from_contact: '/api/vision?action=latest_whatsapp&contact=Ankush',
        analyze_url: '/api/vision?action=analyze_url&url=https://...'
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Vision Connector error: ' + error.message
    });
  }
};
