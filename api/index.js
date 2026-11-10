// RJN Universal Connectors: Master Serverless Gateway
// Unified entry-point for all connector APIs on Vercel
const weather = require('../lib/weather');
const search = require('../lib/search');
const database = require('../lib/database');
const system = require('../lib/system');
const github = require('../lib/github');
const whatsapp = require('../lib/whatsapp');
const iconscout = require('../lib/iconscout');
const icons8 = require('../lib/icons8');
const image = require('../lib/image');
const instagram = require('../lib/instagram');
const telegram = require('../lib/telegram');
const execute = require('../lib/execute');
const connectors = require('../lib/connectors');
const music = require('../lib/music');

const ROUTES = {
  weather,
  search,
  database,
  system,
  github,
  whatsapp,
  iconscout,
  icons8,
  image,
  instagram,
  telegram,
  execute,
  connectors,
  music,
  youtube: music
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const urlObj = new URL(req.url, `https://${req.headers.host || 'localhost'}`);

    // Parse query params into req.query if missing
    if (!req.query) req.query = {};
    for (const [k, v] of urlObj.searchParams.entries()) {
      if (req.query[k] === undefined) req.query[k] = v;
    }

    // Determine target subroute:
    // e.g. /api/weather -> 'weather' or rewritten with ?route=weather
    let routeName = (req.query.route || '').toLowerCase().trim();
    if (!routeName) {
      const cleanPath = urlObj.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
      const parts = cleanPath.split('/');
      routeName = (parts[0] || '').toLowerCase().trim();
    }

    // Root / status discovery
    if (!routeName || routeName === 'index') {
      return res.status(200).json({
        status: 'online',
        service: 'RJN Universal Connectors Gateway',
        version: '1.2.0',
        totalConnectors: Object.keys(ROUTES).length,
        timestamp: new Date().toISOString(),
        endpoints: Object.keys(ROUTES).reduce((acc, r) => {
          acc[r] = `/api/${r}`;
          return acc;
        }, {}),
        message: 'RJN Unified Serverless Gateway active and operational.'
      });
    }

    const handler = ROUTES[routeName];
    if (handler) {
      return await handler(req, res);
    }

    return res.status(404).json({
      success: false,
      error: `Unknown connector endpoint: /api/${routeName}. Available: ${Object.keys(ROUTES).join(', ')}`
    });

  } catch (err) {
    console.error('Master Gateway Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Gateway internal error: ' + err.message
    });
  }
};
