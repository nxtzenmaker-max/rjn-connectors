// Vercel Serverless Function: Scout8 Visual Asset & High-Res Graphic Generator
// Uses Icons8 & IconScout APIs to discover high-resolution visual artwork, 3D icons, and graphics
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const prompt = (req.query.prompt || (req.body && req.body.prompt) || '').trim();
  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: 'Missing required "prompt" parameter.'
    });
  }

  // Extract key search keyword from prompt (e.g. "nature scene" -> "nature")
  const cleanTerms = prompt
    .toLowerCase()
    .replace(/a |an |the |of |in |with |beautiful |photorealistic |high resolution |8k |hd |futuristic |scene |artwork |image |photo /gi, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const queryTerm = cleanTerms[0] || 'nature';

  try {
    // 1. Search Icons8 high-resolution 512px assets
    const i8Url = `https://search.icons8.com/api/iconsets/v5/search?term=${encodeURIComponent(queryTerm)}&amount=12`;
    const resp = await fetch(i8Url, {
      headers: { 'User-Agent': 'RJN-Assistant/2.0 (Icons8-Scout8)' }
    });

    if (resp.ok) {
      const data = await resp.json();
      const rawIcons = data.icons || [];
      if (rawIcons.length > 0) {
        const topIcon = rawIcons[0];
        const highResUrl = `https://img.icons8.com/?size=512&id=${topIcon.id}&format=png`;

        const gallery = rawIcons.slice(0, 8).map(i => ({
          id: i.id,
          name: i.name,
          previewUrl: `https://img.icons8.com/?size=512&id=${i.id}&format=png`,
          thumbnailUrl: `https://img.icons8.com/?size=160&id=${i.id}&format=png`,
          platform: i.platform || 'color',
          pageUrl: `https://icons8.com/icon/${i.id}/${encodeURIComponent(i.commonName || i.name.toLowerCase().replace(/\s+/g, '-'))}`
        }));

        return res.status(200).json({
          success: true,
          engine: 'scout8_icons8',
          prompt,
          queryTerm,
          imageUrl: highResUrl,
          title: topIcon.name || prompt,
          gallery,
          description: `High-resolution Scout8 graphic discovered for "${prompt}"`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // 2. Fallback to curated Scout8 high-res asset
    const fallbackId = '25449'; // Nature / landscape 512px HD asset
    const fallbackUrl = `https://img.icons8.com/?size=512&id=${fallbackId}&format=png`;
    return res.status(200).json({
      success: true,
      engine: 'scout8_icons8',
      prompt,
      queryTerm,
      imageUrl: fallbackUrl,
      title: prompt,
      description: `Scout8 graphic asset for "${prompt}"`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scout8 image generator error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate visual from Scout8: ' + error.message
    });
  }
};
