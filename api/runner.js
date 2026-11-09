// Vercel Serverless Function: Proxy to RJN Railway Runner
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const command = req.body && req.body.command ? req.body.command : req.query.command;
  if (!command) {
    return res.status(400).json({ success: false, error: 'Command parameter is required' });
  }

  try {
    const railwayResp = await fetch('https://rjn-runner-production.up.railway.app/execute', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer rjn_live_runner_9a8b7c6d5e4f3a2b1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command, timeout: 30000 })
    });
    const data = await railwayResp.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Runner proxy error: ' + error.message });
  }
};
