// Vercel Serverless Function: Parallel.ai Web Search & Knowledge Lookup Connector
// Powered by Parallel Web Systems API & AI Grounding

const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY || 'hjj0CMo72OxUS2m4kta6K-KAtS764LRebnQU4Tfu';

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

  // 1. PRIMARY: Parallel.ai Real-Time Web Search
  try {
    const parallelResp = await fetch('https://api.parallel.ai/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PARALLEL_API_KEY
      },
      body: JSON.stringify({
        objective: `Find accurate, up-to-date facts, specifications, prices, and answers for: ${query}`,
        search_queries: [query, `${query} details`]
      })
    });

    if (parallelResp.ok) {
      const pData = await parallelResp.json();
      if (pData.results && pData.results.length > 0) {
        const topResults = pData.results.slice(0, 5).map(r => ({
          title: (r.title || '').trim(),
          url: r.url,
          publish_date: r.publish_date,
          snippet: (r.excerpts || []).join(' ').replace(/\s+/g, ' ').slice(0, 350)
        }));

        const summaryParts = topResults.map((r, i) => `[${i+1}] ${r.title}: ${r.snippet}`).join('\n\n');

        return res.status(200).json({
          success: true,
          engine: 'parallel.ai',
          query,
          found: true,
          count: topResults.length,
          title: topResults[0].title,
          summary: summaryParts,
          top_results: topResults,
          url: topResults[0].url
        });
      }
    } else {
      console.warn('Parallel search HTTP status:', parallelResp.status);
    }
  } catch (err) {
    console.warn('Parallel search error, falling back:', err.message);
  }

  // 2. FALLBACK: Live Web Search Scrape Fallback (Products, Reviews, News)
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
        return res.status(200).json({
          success: true,
          engine: 'web_scrape',
          query,
          found: true,
          title: query,
          summary: snippets.join('\n\n'),
          source: 'Web Search'
        });
      }
    }
  } catch (e) {
    console.warn('DDG HTML scrape failed:', e.message);
  }

  // 3. FALLBACK: Wikipedia Summary REST API
  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const wikiResp = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'RJN-Assistant/1.0' }
    });
    if (wikiResp.ok) {
      const wikiData = await wikiResp.json();
      if (wikiData.extract && wikiData.type !== 'disambiguation') {
        return res.status(200).json({
          success: true,
          engine: 'wikipedia',
          query,
          found: true,
          title: wikiData.title || query,
          summary: wikiData.extract,
          source: 'Wikipedia',
          url: wikiData.content_urls?.desktop?.page || ''
        });
      }
    }
  } catch (e) {
    console.warn('Wiki fallback failed:', e.message);
  }

  return res.status(200).json({
    success: true,
    query,
    found: false,
    summary: `No immediate web search results found for "${query}".`
  });
};
