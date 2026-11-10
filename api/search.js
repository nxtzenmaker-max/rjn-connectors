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

  let abstract = '';
  let source = '';
  let title = query;
  let url = '';

  try {
    // 1. Wikipedia Summary REST API (Fast, factual, concise)
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const wikiResp = await fetch(wikiUrl, {
        headers: { 'User-Agent': 'RJN-Assistant/1.0 (https://rjn-connectors.vercel.app)' }
      });
      if (wikiResp.ok) {
        const wikiData = await wikiResp.json();
        if (wikiData.extract && wikiData.type !== 'disambiguation') {
          abstract = wikiData.extract;
          source = 'Wikipedia';
          title = wikiData.title || query;
          url = wikiData.content_urls ? wikiData.content_urls.desktop.page : '';
        }
      }
    } catch (e) {
      console.warn('Wiki summary attempt failed:', e.message);
    }

    // 2. Wikipedia Search API Fallback (if title spelling was slightly off)
    if (!abstract) {
      try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=1`;
        const searchResp = await fetch(searchUrl, {
          headers: { 'User-Agent': 'RJN-Assistant/1.0 (https://rjn-connectors.vercel.app)' }
        });
        if (searchResp.ok) {
          const searchData = await searchResp.json();
          if (searchData.query && searchData.query.search && searchData.query.search[0]) {
            const firstResult = searchData.query.search[0];
            title = firstResult.title;
            const snippet = (firstResult.snippet || '').replace(/<[^>]+>/g, '');
            if (snippet) {
              abstract = snippet;
              source = 'Wikipedia Search';
              url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
            }
          }
        }
      } catch (e) {
        console.warn('Wiki search fallback failed:', e.message);
      }
    }

    // 3. DuckDuckGo Instant Answer API Fallback
    if (!abstract) {
      try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const ddgResp = await fetch(ddgUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RJN-AI/1.0' }
        });
        const rawText = await ddgResp.text();
        if (rawText && rawText.trim().startsWith('{')) {
          const ddgData = JSON.parse(rawText);
          if (ddgData.AbstractText) {
            abstract = ddgData.AbstractText;
            source = ddgData.AbstractSource || 'DuckDuckGo';
            url = ddgData.AbstractURL || '';
          } else if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0 && ddgData.RelatedTopics[0].Text) {
            abstract = ddgData.RelatedTopics[0].Text;
            source = 'DuckDuckGo Related';
          }
        }
      } catch (e) {
        console.warn('DDG fallback failed:', e.message);
      }
    }

    // 4. Live Web Search Scrape Fallback (Products, Reviews, News, Anime, Real-time)
    if (!abstract) {
      try {
        const ddgHtmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const ddgResp = await fetch(ddgHtmlUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
          }
        });
        if (ddgResp.ok) {
          const html = await ddgResp.text();
          const snippets = [];
          const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi;
          let match;
          while ((match = regex.exec(html)) !== null && snippets.length < 3) {
            let clean = match[1]
              .replace(/<[^>]+>/g, '')
              .replace(/&#x27;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/\s+/g, ' ')
              .trim();
            if (clean && clean.length > 10) snippets.push(clean);
          }
          if (snippets.length > 0) {
            abstract = snippets.join(' | ');
            source = 'Web Search';
          }
        }
      } catch (e) {
        console.warn('DDG HTML scrape failed:', e.message);
      }
    }

    if (!abstract) {
      return res.status(200).json({
        success: true,
        query,
        found: false,
        summary: `सीधा वेब परिणाम नहीं मिला।`
      });
    }

    return res.status(200).json({
      success: true,
      query,
      found: true,
      title,
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
