// Vercel Serverless Function: Instagram Live Integration Connector
const RAILWAY_RUNNER_URL = 'https://rjn-runner-production.up.railway.app';
const RUNNER_SECRET_KEY = 'rjn_live_runner_9a8b7c6d5e4f3a2b1';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.body && req.body.action ? req.body.action : (req.query.action || 'info');
  let target = req.body && req.body.to ? req.body.to : (req.query.to || (req.query.target || 'rforrjn'));
  const message = req.body && req.body.message ? req.body.message : (req.query.message || '');

  // Auto-resolve Dilshad's verified Instagram handle
  if (target) {
    const lower = String(target).toLowerCase().trim();
    if (lower.includes('dilshad') || lower.includes('दिलसाद') || lower.includes('unfab') || lower.includes('un_fab')) {
      target = 'unfav.dilshad';
    }
  }

  try {
    let cmd = `python3 /root/instagram_tool.py info "${target}"`;
    if (action === 'send') {
      if (!target || !message) {
        return res.status(400).json({ success: false, error: 'Target username and message are required' });
      }
      const safeMsg = message.replace(/"/g, '\\"');
      cmd = `python3 /root/instagram_tool.py send "${target}" "${safeMsg}"`;
    } else if (action === 'threads' || action === 'chats' || action === 'list') {
      cmd = 'python3 /root/instagram_tool.py threads 10';
    } else if (action === 'messages' || action === 'dms') {
      cmd = `python3 /root/instagram_tool.py messages "${target}" 5`;
    }

    const runnerResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNNER_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command: cmd, timeout: 35000 })
    });

    const runnerData = await runnerResp.json();
    let parsedOut = null;
    try {
      parsedOut = JSON.parse(runnerData.stdout.trim());
    } catch(e) {
      parsedOut = runnerData.stdout;
    }

    const isActualSuccess = runnerData.success && (parsedOut && parsedOut.success !== false);

    return res.status(200).json({
      success: isActualSuccess,
      action,
      result: parsedOut,
      error: (parsedOut && parsedOut.error) || (runnerData.success ? null : runnerData.stderr),
      runnerExitCode: runnerData.exitCode
    });
      stderr: runnerData.stderr
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
