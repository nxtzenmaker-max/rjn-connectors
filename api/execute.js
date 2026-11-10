// Vercel Serverless Function: Universal Connector Router
const weatherHandler = require('./weather');
const searchHandler = require('./search');
const databaseHandler = require('./database');
const systemHandler = require('./system');
const githubHandler = require('./github');
const iconscoutHandler = require('./iconscout');

const HANDLERS = {
  weather: weatherHandler,
  search: searchHandler,
  database: databaseHandler,
  system: systemHandler,
  github: githubHandler,
  iconscout: iconscoutHandler
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const connector = (req.body && req.body.connector) || req.query.connector;
  const params = (req.body && req.body.params) || req.query;

  if (!connector || !HANDLERS[connector.toLowerCase()]) {
    return res.status(400).json({
      success: false,
      error: `Invalid or missing connector. Available connectors: ${Object.keys(HANDLERS).join(', ')}`
    });
  }

  // Create mock request with merged params
  const mockReq = {
    method: 'POST',
    query: params || {},
    body: params || {},
    headers: req.headers
  };

  try {
    return await HANDLERS[connector.toLowerCase()](mockReq, res);
  } catch (error) {
    console.error(`Error executing connector ${connector}:`, error);
    return res.status(500).json({
      success: false,
      connector,
      error: error.message
    });
  }
};
