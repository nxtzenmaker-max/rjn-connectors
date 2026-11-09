// Vercel Serverless Function: Instant Web Search & Knowledge Lookup Connector
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = (req.query.query || (req.body && req.body.query) || '').trim();

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query parameter is required'
    });
  }

  try {
    // 1. Check DuckDuckGo Instant Answer
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const ddgResp = await fetch(ddgUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (RJN-AI-Connector)' } });
    const ddgData = await ddgResp.json();

    let abstract = ddgData.AbstractText || '';
    let source = ddgData.AbstractSource || 'DuckDuckGo';
    let url = ddgData.AbstractURL || '';

    // 2. If DDG is empty, check Wikipedia summary API
    if (!abstract) {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const wikiResp = await fetch(wikiUrl);
      if (wikiResp.ok) {
        const wikiData = await wikiResp.json();
        if (wikiData.extract) {
          abstract = wikiData.extract;
          source = 'Wikipedia';
          url = wikiData.content_urls ? wikiData.content_urls.desktop.page : '';
        }
      }
    }

    if (!abstract && ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
      abstract = ddgData.RelatedTopics[0].Text || '';
    }

    if (!abstract) {
      return res.status(200).json({
        success: true,
        query,
        found: false,
        summary: `No immediate encyclopedia summary found for "${query}". You can ask more specific keywords.`
      });
    }

    return res.status(200).json({
      success: true,
      query,
      found: true,
      summary: abstract,
      source,
      url
    });
  } catch (error) {
    console.error('Search connector error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search: ' + error.message
    });
  }
};
