// Vercel Serverless Function: Telegram Live Integration Connector
const RAILWAY_RUNNER_URL = 'https://rjn-runner-production.up.railway.app';
const RUNNER_SECRET_KEY = 'rjn_live_runner_9a8b7c6d5e4f3a2b1';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.body && req.body.action ? req.body.action : (req.query.action || 'chats');
  const target = req.body && req.body.to ? req.body.to : (req.query.to || '');
  const message = req.body && req.body.message ? req.body.message : (req.query.message || '');

  try {
    let cmd = 'python3 /root/telegram_tool.py chats';
    if (action === 'send') {
      if (!target || !message) {
        return res.status(400).json({ success: false, error: 'Target (@username or phone) and message are required' });
      }
      // sanitize and escape message for shell
      const safeMsg = message.replace(/"/g, '\\"');
      cmd = `python3 /root/telegram_tool.py send "${target}" "${safeMsg}"`;
    } else if (action === 'messages') {
      cmd = `python3 /root/telegram_tool.py messages "${target}" 5`;
    }

    const runnerResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNNER_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command: cmd, timeout: 30000 })
    });

    const runnerData = await runnerResp.json();
    let parsedOut = null;
    try {
      parsedOut = JSON.parse(runnerData.stdout.trim());
    } catch(e) {
      parsedOut = runnerData.stdout;
    }

    return res.status(200).json({
      success: runnerData.success,
      action,
      result: parsedOut,
      stderr: runnerData.stderr
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
