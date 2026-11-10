// Vercel Serverless Function: IconScout Vector & Asset Connector
const fs = require('fs');
const path = require('path');

let iconData = null;

function getIcons() {
  if (iconData && iconData.length > 0) return iconData;
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'unicons-index.json');
    if (fs.existsSync(dataPath)) {
      iconData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return iconData;
    }
  } catch (e) {
    console.warn('Could not read unicons-index.json:', e.message);
  }

  try {
    const line = require('@iconscout/unicons/json/line.json');
    const solid = require('@iconscout/unicons/json/solid.json');
    const mono = require('@iconscout/unicons/json/monochrome.json');
    const thin = require('@iconscout/unicons/json/thinline.json');
    iconData = [
      ...line.map(i => ({ name: i.name, style: 'line', category: i.category, tags: i.tags || [], unicode: i.unicode })),
      ...solid.map(i => ({ name: i.name, style: 'solid', category: i.category, tags: i.tags || [], unicode: i.unicode })),
      ...mono.map(i => ({ name: i.name, style: 'monochrome', category: i.category, tags: i.tags || [], unicode: i.unicode })),
      ...thin.map(i => ({ name: i.name, style: 'thinline', category: i.category, tags: i.tags || [], unicode: i.unicode }))
    ];
    return iconData;
  } catch (err) {
    console.error('Failed to load icons from package:', err.message);
    return [];
  }
}

function toPascalCase(str) {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

function formatIcon(item) {
  const cleanName = item.name;
  const style = item.style || 'line';
  const cdnSvg = `https://unicons.iconscout.com/release/v4.0.8/svg/${style}/${cleanName}.svg`;
  const pascalName = toPascalCase(cleanName);
  return {
    name: cleanName,
    style,
    category: item.category || 'General',
    tags: item.tags || [],
    unicode: item.unicode || '',
    svgUrl: cdnSvg,
    previewUrl: cdnSvg,
    htmlTag: `<i class="uil uil-${cleanName}"></i>`,
    reactImport: `import { Uil${pascalName} } from '@iconscout/react-unicons'`,
    source: 'IconScout Unicons'
  };
}

function scoreIcon(icon, query) {
  const name = icon.name.toLowerCase();
  const q = query.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q + '-') || name.startsWith(q)) return 85;
  if (name.includes(q)) return 65;
  if (icon.tags) {
    for (const t of icon.tags) {
      const tagLower = t.toLowerCase();
      if (tagLower === q) return 50;
      if (tagLower.startsWith(q)) return 40;
      if (tagLower.includes(q)) return 25;
    }
  }
  if (icon.category && icon.category.toLowerCase().includes(q)) return 15;
  return 0;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const queryParams = req.query || {};
  const bodyParams = req.body || {};

  const action = (queryParams.action || bodyParams.action || (queryParams.query || bodyParams.query ? 'search' : 'status')).toLowerCase();
  const query = (queryParams.query || queryParams.q || bodyParams.query || bodyParams.q || '').trim();
  const style = (queryParams.style || bodyParams.style || 'line').toLowerCase();
  const categoryFilter = (queryParams.category || bodyParams.category || '').toLowerCase().trim();
  const limit = Math.min(Math.max(parseInt(queryParams.limit || bodyParams.limit || 12, 10), 1), 50);
  const iconName = (queryParams.name || bodyParams.name || query || '').trim();
  const clientId = queryParams.clientId || bodyParams.clientId || process.env.ICONSCOUT_CLIENT_ID;
  const clientSecret = queryParams.clientSecret || bodyParams.clientSecret || process.env.ICONSCOUT_CLIENT_SECRET;

  const allIcons = getIcons();

  // 1. Status / Health Action
  if (action === 'status' || action === 'health') {
    const categories = new Set(allIcons.map(i => i.category).filter(Boolean));
    return res.status(200).json({
      success: true,
      connector: 'iconscout',
      status: 'online',
      provider: 'IconScout',
      version: '4.2.0',
      totalIcons: allIcons.length,
      categoriesCount: categories.size,
      styles: ['line', 'solid', 'monochrome', 'thinline'],
      apiV3Configured: Boolean(clientId),
      cdnBaseUrl: 'https://unicons.iconscout.com/release/v4.0.8'
    });
  }

  // 2. Categories List Action
  if (action === 'categories') {
    const counts = {};
    for (const icon of allIcons) {
      const cat = icon.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      count: sorted.length,
      categories: sorted
    });
  }

  // 3. Styles List Action
  if (action === 'styles') {
    const counts = {};
    for (const icon of allIcons) {
      const st = icon.style || 'line';
      counts[st] = (counts[st] || 0) + 1;
    }
    return res.status(200).json({
      success: true,
      styles: counts
    });
  }

  // 4. Raw SVG / Details Action
  if (action === 'svg' || action === 'get') {
    if (!iconName) {
      return res.status(400).json({
        success: false,
        error: "Icon 'name' parameter is required for action: 'svg' or 'get'"
      });
    }

    const cleanName = iconName.toLowerCase().replace(/^uil-/, '');
    const targetStyle = style === 'all' ? 'line' : style;
    const found = allIcons.find(i => i.name.toLowerCase() === cleanName && (targetStyle ? i.style === targetStyle : true)) ||
                  allIcons.find(i => i.name.toLowerCase() === cleanName);

    const iconItem = found || { name: cleanName, style: targetStyle, category: 'General', tags: [] };
    const formatted = formatIcon(iconItem);

    let svgContent = '';
    // Try reading local SVG file
    try {
      const localSvgPath = path.join(__dirname, '..', 'node_modules', '@iconscout', 'unicons', 'svg', iconItem.style, `${cleanName}.svg`);
      if (fs.existsSync(localSvgPath)) {
        svgContent = fs.readFileSync(localSvgPath, 'utf8');
      }
    } catch (e) {
      // Local read failed, fallback to CDN
    }

    // Fallback to fetch from CDN
    if (!svgContent) {
      try {
        const cdnRes = await fetch(formatted.svgUrl);
        if (cdnRes.ok) {
          svgContent = await cdnRes.text();
        }
      } catch (err) {
        console.warn(`Failed to fetch SVG from CDN for ${cleanName}:`, err.message);
      }
    }

    return res.status(200).json({
      success: true,
      ...formatted,
      hasSvgContent: Boolean(svgContent),
      svgContent: svgContent || null
    });
  }

  // 5. Search Action (Default)
  if (!query) {
    // If no query provided, return top popular icons
    const popularNames = ['home', 'user', 'search', 'heart', 'bell', 'cog', 'envelope', 'shopping-cart', 'camera', 'cloud', 'check', 'star'];
    const sample = popularNames.map(name => {
      const icon = allIcons.find(i => i.name === name && i.style === 'line') || { name, style: 'line' };
      return formatIcon(icon);
    });

    return res.status(200).json({
      success: true,
      message: 'No query provided. Showing popular sample icons.',
      count: sample.length,
      icons: sample
    });
  }

  // Live IconScout API v3 Check (if Client-ID configured)
  if (clientId) {
    try {
      const apiUrl = new URL('https://api.iconscout.com/v3/search');
      apiUrl.searchParams.set('query', query);
      apiUrl.searchParams.set('asset', 'icon');
      apiUrl.searchParams.set('price', 'free');
      apiUrl.searchParams.set('per_page', String(limit));
      if (style && style !== 'all') {
        apiUrl.searchParams.append('styles[]', style);
      }
      const headers = {
        'Client-ID': clientId,
        'Accept': 'application/json'
      };
      if (clientSecret) headers['Client-Secret'] = clientSecret;

      const apiRes = await fetch(apiUrl.toString(), { headers });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData && apiData.response && apiData.response.items && Array.isArray(apiData.response.items.data)) {
          const apiItems = apiData.response.items.data.map(item => ({
            id: item.id,
            uuid: item.uuid,
            name: item.name || item.slug,
            style: item.style || style,
            category: item.category || 'General',
            tags: item.tags || [],
            svgUrl: item.urls ? (item.urls.svg || item.urls.original || item.urls.png_256) : '',
            previewUrl: item.urls ? (item.urls.thumb || item.urls.png_256 || item.urls.png_128) : '',
            htmlTag: `<i class="uil uil-${(item.slug || item.name || '').replace(/\s+/g, '-')}"></i>`,
            source: 'IconScout API v3 (Live)'
          }));

          return res.status(200).json({
            success: true,
            source: 'iconscout_api_v3',
            query,
            style,
            count: apiItems.length,
            total: apiData.response.items.total || apiItems.length,
            icons: apiItems
          });
        }
      }
    } catch (apiErr) {
      console.warn('IconScout API v3 query failed, falling back to local Unicons catalog:', apiErr.message);
    }
  }

  // Search local Unicons catalog with intelligent scoring
  let candidates = allIcons;
  if (style && style !== 'all') {
    candidates = candidates.filter(i => i.style === style);
  }
  if (categoryFilter) {
    candidates = candidates.filter(i => (i.category || '').toLowerCase().includes(categoryFilter));
  }

  const scored = [];
  for (const icon of candidates) {
    const s = scoreIcon(icon, query);
    if (s > 0) {
      scored.push({ icon, score: s });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const matched = scored.slice(0, limit).map(item => formatIcon(item.icon));

  return res.status(200).json({
    success: true,
    source: 'iconscout_unicons',
    query,
    style,
    count: matched.length,
    totalMatched: scored.length,
    icons: matched
  });
};
