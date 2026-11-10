// Vercel Serverless Function: Icons8 Vector & Graphic Asset Search Connector
// Integrates Icons8 API v5 for icon search, previews, and PNG/SVG asset discovery

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = (req.query.query || req.query.term || (req.body && (req.body.query || req.body.term)) || '').trim();
  const amount = Math.min(parseInt(req.query.amount || (req.body && req.body.amount) || 10, 10), 30);
  const platform = (req.query.platform || (req.body && req.body.platform) || '').trim();

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query parameter is required'
    });
  }

  try {
    let searchUrl = `https://search.icons8.com/api/iconsets/v5/search?term=${encodeURIComponent(query)}&amount=${amount}`;
    if (platform) {
      searchUrl += `&platform=${encodeURIComponent(platform)}`;
    }

    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'RJN-Assistant/1.0 (https://nxtzenmaker-max.github.io/holo/)'
      }
    });

    if (!resp.ok) {
      throw new Error(`Icons8 API returned HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const rawIcons = data.icons || [];

    const icons = rawIcons.map(icon => ({
      id: icon.id,
      name: icon.name,
      commonName: icon.commonName || icon.name.toLowerCase().replace(/\s+/g, '-'),
      category: icon.category || 'General',
      platform: icon.platform || 'ios7',
      isFree: icon.isFree ?? true,
      pngUrl: `https://img.icons8.com/?size=160&id=${icon.id}&format=png`,
      thumbnailUrl: `https://img.icons8.com/?size=64&id=${icon.id}&format=png`,
      highResUrl: `https://img.icons8.com/?size=512&id=${icon.id}&format=png`,
      pageUrl: `https://icons8.com/icon/${icon.id}/${encodeURIComponent(icon.commonName || icon.name.toLowerCase().replace(/\s+/g, '-'))}`
    }));

    return res.status(200).json({
      success: true,
      query,
      count: icons.length,
      icons,
      summary: icons.length > 0
        ? `Found ${icons.length} Icons8 icons for "${query}". Top matches: ${icons.slice(0, 3).map(i => i.name).join(', ')}.`
        : `No icons found on Icons8 for "${query}".`
    });

  } catch (err) {
    console.error('Icons8 connector error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to search Icons8: ' + err.message
    });
  }
};
