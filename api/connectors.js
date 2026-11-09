// Vercel Serverless Function: Connector Catalog & Deepgram Tool Definitions
const CONNECTORS = [
  {
    id: 'weather',
    name: 'Live Global Weather',
    icon: '☀️',
    category: 'Environment',
    description: 'Fetch real-time temperature, weather condition, humidity, and wind speed for any city worldwide without any API key required.',
    endpoint: '/api/weather',
    methods: ['GET', 'POST'],
    parameters: {
      city: { type: 'string', description: 'City name (e.g. Delhi, Mumbai, New York, Tokyo)', required: true },
      units: { type: 'string', description: 'celsius or fahrenheit (default: celsius)', required: false }
    },
    voiceToolSchema: {
      name: 'get_weather',
      description: 'Get real-time live weather information for any city in the world',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name (e.g. Delhi, Mumbai, London)' }
        },
        required: ['city']
      }
    }
  },
  {
    id: 'search',
    name: 'Web Knowledge & Search',
    icon: '🌐',
    category: 'Information',
    description: 'Instant web search and encyclopedia lookup for live factual knowledge, news, and queries.',
    endpoint: '/api/search',
    methods: ['GET', 'POST'],
    parameters: {
      query: { type: 'string', description: 'Search term or question to look up', required: true }
    },
    voiceToolSchema: {
      name: 'web_search',
      description: 'Search the web for live factual knowledge, news, or general questions',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      }
    }
  },
  {
    id: 'database',
    name: 'MongoDB Atlas & Cloud Memory',
    icon: '🗄️',
    category: 'Data & Storage',
    description: 'Synchronize conversation sessions, user memory, preferences, and state directly with MongoDB Atlas.',
    endpoint: '/api/database',
    methods: ['GET', 'POST'],
    parameters: {
      action: { type: 'string', description: 'sync_turn, get_history, get_user_state, save_user_state', required: true },
      sessionId: { type: 'string', description: 'Session or user identifier', required: true },
      payload: { type: 'object', description: 'Turn data or state payload', required: false }
    },
    voiceToolSchema: {
      name: 'manage_memory',
      description: 'Save or retrieve user memory or long-term preferences from cloud database',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['save_memory', 'get_memory'] },
          key: { type: 'string', description: 'Memory key or concept' },
          value: { type: 'string', description: 'Value to remember' }
        },
        required: ['action']
      }
    }
  },
  {
    id: 'system',
    name: 'System Time, Date & Math',
    icon: '⏱️',
    category: 'Utilities',
    description: 'Get precise local/global time, date, timezone conversions, and perform exact mathematical calculations.',
    endpoint: '/api/system',
    methods: ['GET', 'POST'],
    parameters: {
      action: { type: 'string', description: 'datetime, timezone, calculate', required: true },
      tz: { type: 'string', description: 'Timezone identifier (e.g. Asia/Kolkata, UTC)', required: false },
      expression: { type: 'string', description: 'Math expression for calculate', required: false }
    },
    voiceToolSchema: {
      name: 'get_system_time',
      description: 'Get current accurate date, day, and time in India or any requested timezone',
      parameters: {
        type: 'object',
        properties: {
          timezone: { type: 'string', description: 'Timezone (default: Asia/Kolkata)' }
        }
      }
    }
  },
  {
    id: 'github',
    name: 'GitHub Repository & Code Sync',
    icon: '🐙',
    category: 'Development',
    description: 'Fetch repository metadata, recent commits, open issues, and deployment status from GitHub.',
    endpoint: '/api/github',
    methods: ['GET', 'POST'],
    parameters: {
      repo: { type: 'string', description: 'Repository name in format owner/repo', required: true },
      action: { type: 'string', description: 'info, commits, issues', required: false }
    },
    voiceToolSchema: {
      name: 'check_github_repo',
      description: 'Check latest commits, status, or issues for a GitHub repository',
      parameters: {
        type: 'object',
        properties: {
          repo: { type: 'string', description: 'owner/repo (e.g. nxtzenmaker-max/holo)' }
        },
        required: ['repo']
      }
    }
  }
];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  res.status(200).json({
    status: 'success',
    count: CONNECTORS.length,
    connectors: CONNECTORS,
    deepgramToolsCatalog: CONNECTORS.map(c => c.voiceToolSchema)
  });
};
