// Vercel Serverless Function: RJN Connectors Root Health & Discovery
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    status: 'online',
    service: 'RJN Universal Connectors API Hub',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      connectors: '/api/connectors',
      execute: '/api/execute',
      weather: '/api/weather',
      search: '/api/search',
      database: '/api/database',
      system: '/api/system',
      github: '/api/github'
    },
    message: 'RJN Connectors Hub is ready for Vercel Serverless execution.'
  });
};
