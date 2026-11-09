// Vercel Serverless Function: Autonomous AGY Agent Connector (VPS Worker)
const RAILWAY_RUNNER_URL = 'https://rjn-runner-production.up.railway.app';
const RUNNER_SECRET_KEY = 'rjn_live_runner_9a8b7c6d5e4f3a2b1';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.body && req.body.action ? req.body.action : (req.query.action || 'worker_status');
  const instruction = req.body && req.body.instruction ? req.body.instruction : (req.query.instruction || '');
  const directory = req.body && req.body.directory ? req.body.directory : (req.query.directory || '');
  const taskId = req.body && req.body.taskId ? req.body.taskId : (req.query.taskId || 'latest');

  try {
    let cmd = 'python3 /root/mongo_tool.py agent_status';

    if (action === 'assign' || action === 'assign_task') {
      if (!instruction) {
        return res.status(400).json({ success: false, error: 'Instruction is required for AGY agent task' });
      }
      const safeInstr = instruction.replace(/"/g, '\\"');
      const safeDir = directory.replace(/"/g, '\\"');
      cmd = `python3 /root/mongo_tool.py assign_task "${safeInstr}" "${safeDir}"`;
    } else if (action === 'status' || action === 'get_task') {
      const safeId = taskId.replace(/"/g, '\\"');
      cmd = `python3 /root/mongo_tool.py get_task "${safeId}"`;
    }

    const runnerResp = await fetch(`${RAILWAY_RUNNER_URL}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNNER_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command: cmd, timeout: 25000 })
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
      result: parsedOut
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
