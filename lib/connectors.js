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
  },
  {
    id: 'runner',
    name: 'Railway Cloud Command Runner',
    icon: '⚡',
    category: 'Execution',
    description: 'Execute arbitrary bash shell commands, terminal tools, or Python scripts on dedicated cloud Linux server.',
    endpoint: '/api/runner',
    methods: ['POST', 'GET'],
    parameters: {
      command: { type: 'string', description: 'Bash shell command to execute', required: true }
    },
    voiceToolSchema: {
      name: 'execute_command',
      description: 'Execute arbitrary bash shell commands or python scripts on dedicated cloud Linux server (Railway) and return stdout/stderr',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The exact Linux bash command or python script to execute' }
        },
        required: ['command']
      }
    }
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Baileys Cloud Bridge',
    icon: '💬',
    category: 'Communication',
    description: '24/7 WhatsApp API gateway with Baileys WebSocket, MongoDB Atlas memory sync, pairing code generator, and command execution.',
    endpoint: '/api/whatsapp',
    methods: ['GET', 'POST'],
    parameters: {
      action: { type: 'string', description: 'status, pair, send, messages', required: false },
      phone: { type: 'string', description: 'Phone number with country code for pairing (e.g. 91808797688)', required: false }
    },
    voiceToolSchema: {
      name: 'send_whatsapp_message',
      description: 'Send a WhatsApp message to any phone number or check WhatsApp linking status',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Destination phone number with country code' },
          message: { type: 'string', description: 'Message content to send' }
        },
        required: ['to', 'message']
      }
    }
  },
  {
    id: 'iconscout',
    name: 'IconScout Vector & Asset Connector',
    icon: '🎨',
    category: 'Design & Media',
    description: 'Search, retrieve, and embed over 1,900+ vector icons, SVGs, and IconScout API design assets with real-time preview and CDN delivery.',
    endpoint: '/api/iconscout',
    methods: ['GET', 'POST'],
    parameters: {
      query: { type: 'string', description: 'Icon name or search keyword (e.g. rocket, user, home, cloud)', required: false },
      style: { type: 'string', description: 'line, solid, monochrome, or thinline (default: line)', required: false },
      category: { type: 'string', description: 'Filter by category (e.g. User Interface, Communication, Arrows)', required: false },
      action: { type: 'string', description: 'search, svg, get, categories, styles, status', required: false },
      limit: { type: 'number', description: 'Number of results to return (default: 12)', required: false }
    },
    voiceToolSchema: {
      name: 'search_icons',
      description: 'Search Icon Scout for vector icons, SVGs, or design symbols by keyword (e.g. rocket, home, lock, bell, phone, heart)',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Icon keyword or search term' },
          style: { type: 'string', description: 'Style: line, solid, monochrome, or thinline (default: line)' }
        },
        required: ['query']
      }
    }
  },
  {
    id: 'image',
    name: 'Real-Time AI Image Generator',
    icon: '🎨',
    category: 'Creative AI',
    description: 'Instant ultra-high resolution AI image, artwork, illustration, and photo generation using modern Flux and Diffusion models on demand.',
    endpoint: '/api/image',
    methods: ['GET', 'POST'],
    parameters: {
      prompt: { type: 'string', description: 'Detailed visual description of the image to generate', required: true },
      width: { type: 'number', description: 'Image width in pixels (default: 1024)', required: false },
      height: { type: 'number', description: 'Image height in pixels (default: 1024)', required: false },
      model: { type: 'string', description: 'flux or turbo (default: flux)', required: false }
    },
    voiceToolSchema: {
      name: 'generate_image',
      description: 'Generate high-resolution AI image, artwork, photo, or wallpaper for Boss based on a descriptive prompt',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Detailed English visual prompt describing the scene, style, lighting, and subjects' }
        },
        required: ['prompt']
      }
    }
  },
  {
    id: 'icons8',
    name: 'Icons8 Vector & Graphic Search',
    icon: '✨',
    category: 'Design & Media',
    description: 'Instant search across Icons8 library of PNG & vector icons, stickers, and UI assets.',
    endpoint: '/api/icons8',
    methods: ['GET', 'POST'],
    parameters: {
      query: { type: 'string', description: 'Icon name or search term', required: true },
      amount: { type: 'number', description: 'Max number of results (default: 10)', required: false },
      platform: { type: 'string', description: 'Platform style (e.g. ios7, material, color)', required: false }
    },
    voiceToolSchema: {
      name: 'search_icons8',
      description: 'Search Icons8 library for vector icons, graphics, and UI symbols',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Icon keyword or topic' }
        },
        required: ['query']
      }
    }
  },
  {
    id: 'music',
    name: 'YouTube Music & Audio Streamer',
    icon: '🎵',
    category: 'Media & Audio',
    description: 'Instant YouTube & YouTube Music track search, playback controls, artist discovery, and real-time audio stream embedding.',
    endpoint: '/api/music',
    methods: ['GET', 'POST'],
    parameters: {
      query: { type: 'string', description: 'Song name, artist, genre, or mood (e.g. Kesariya, lofi beats, Arijit Singh)', required: true },
      action: { type: 'string', description: 'play or search (default: play)', required: false }
    },
    voiceToolSchema: {
      name: 'play_music',
      description: 'Search and play any song, artist, track, lo-fi beats, or ambient music from YouTube Music for Boss',
      parameters: {
        type: 'object',
        properties: {
          song: { type: 'string', description: 'Name of the song, artist, genre, or mood to play (e.g. Kesariya, lo-fi beats, Arijit Singh, Sidhu Moosewala)' }
        },
        required: ['song']
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
