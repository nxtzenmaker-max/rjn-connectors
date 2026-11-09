// Vercel Serverless Function: System Date, Timezone & Calculation Connector
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.query.action || (req.body && req.body.action) || 'datetime').toLowerCase();
  const tz = req.query.tz || (req.body && req.body.tz) || 'Asia/Kolkata';

  if (action === 'calculate') {
    const expr = (req.query.expr || req.query.expression || (req.body && (req.body.expr || req.body.expression)) || '').trim();
    if (!expr) {
      return res.status(400).json({ success: false, error: 'expr or expression parameter is required for calculation' });
    }
    // Safe mathematical evaluation (only digits, operators, parens, decimal, percent, power)
    if (!/^[0-9+\-*/().\s%^]+$/.test(expr)) {
      return res.status(400).json({ success: false, error: 'Invalid or unsafe mathematical expression' });
    }
    try {
      const clean = expr.replace(/\^/g, '**');
      const result = Function(`'use strict'; return (${clean})`)();
      return res.status(200).json({ success: true, expression: expr, result });
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Evaluation error: ' + e.message });
    }
  }

  // Datetime in requested timezone
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      dateStyle: 'full',
      timeStyle: 'medium',
      hour12: true
    });
    const formatted = formatter.format(now);

    return res.status(200).json({
      success: true,
      timezone: tz,
      formatted,
      iso: now.toISOString(),
      timestampMs: now.getTime()
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: 'Invalid timezone: ' + error.message });
  }
};
