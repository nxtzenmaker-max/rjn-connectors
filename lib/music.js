// Vercel Serverless Function: YouTube Music & Audio Streamer Connector
// Powered by YouTube Knowledge Search & Streaming Engine

async function searchYouTube(query) {
  // 1. PRIMARY: Direct YouTube search scrape with rich metadata
  try {
    const searchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (resp.ok) {
      const html = await resp.text();
      const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.*?});/s);
      if (match) {
        const data = JSON.parse(match[1]);
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
        const itemSection = contents.find(c => c.itemSectionRenderer)?.itemSectionRenderer?.contents || [];
        const tracks = [];

        for (const item of itemSection) {
          const v = item.videoRenderer;
          if (v && v.videoId) {
            const rawTitle = v.title?.runs?.[0]?.text || '';
            const channel = v.ownerText?.runs?.[0]?.text || '';
            const duration = v.lengthText?.simpleText || 'Live';
            const views = v.viewCountText?.simpleText || '';

            tracks.push({
              id: v.videoId,
              title: rawTitle,
              artist: channel,
              channel,
              duration,
              views,
              thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
              url: `https://www.youtube.com/watch?v=${v.videoId}`,
              embedUrl: `https://www.youtube.com/embed/${v.videoId}?autoplay=1&enablejsapi=1`
            });

            if (tracks.length >= 6) break;
          }
        }

        if (tracks.length > 0) {
          return {
            success: true,
            engine: 'youtube_native',
            query,
            count: tracks.length,
            track: tracks[0],
            tracks
          };
        }
      }
    }
  } catch (err) {
    console.warn('Direct YouTube search error:', err.message);
  }

  // 2. FALLBACK: Invidious Public API instances
  const invidiousInstances = [
    'https://yt.chocolatemoo53.com',
    'https://invidious.nerdvpn.de',
    'https://invidious.tiekoetter.com'
  ];

  for (const instance of invidiousInstances) {
    try {
      const invUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const invResp = await fetch(invUrl, { headers: { 'Accept': 'application/json' } });
      if (invResp.ok) {
        const items = await invResp.json();
        if (Array.isArray(items) && items.length > 0) {
          const tracks = items.slice(0, 5).map(item => ({
            id: item.videoId,
            title: item.title,
            artist: item.author,
            channel: item.author,
            duration: item.lengthSeconds ? `${Math.floor(item.lengthSeconds / 60)}:${String(item.lengthSeconds % 60).padStart(2, '0')}` : 'Live',
            thumbnail: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${item.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${item.videoId}?autoplay=1&enablejsapi=1`
          }));

          return {
            success: true,
            engine: 'invidious_mirror',
            query,
            count: tracks.length,
            track: tracks[0],
            tracks
          };
        }
      }
    } catch (e) {
      // Continue to next mirror
    }
  }

  return {
    success: false,
    query,
    error: `No audio tracks found on YouTube for "${query}".`
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = (
    req.query.query ||
    req.query.song ||
    req.query.track ||
    req.query.q ||
    (req.body && (req.body.query || req.body.song || req.body.track || req.body.q)) ||
    ''
  ).trim();

  const action = (req.query.action || (req.body && req.body.action) || 'play').trim();

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Song query or title parameter is required (e.g. ?song=Kesariya or ?query=lofi+beats)'
    });
  }

  try {
    const result = await searchYouTube(query);

    if (!result.success) {
      return res.status(404).json(result);
    }

    const topTrack = result.track;

    return res.status(200).json({
      success: true,
      action,
      query,
      engine: result.engine,
      track: topTrack,
      tracks: result.tracks,
      summary: `Found "${topTrack.title}" by ${topTrack.artist} (${topTrack.duration}). Ready to stream.`
    });

  } catch (error) {
    console.error('YouTube music connector error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search YouTube music: ' + error.message
    });
  }
};
