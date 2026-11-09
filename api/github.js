// Vercel Serverless Function: GitHub Integration Connector
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const repo = (req.query.repo || (req.body && req.body.repo) || 'nxtzenmaker-max/holo').trim();
  const action = (req.query.action || (req.body && req.body.action) || 'commits').trim();

  try {
    const headers = {
      'User-Agent': 'RJN-Connectors-Hub'
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    if (action === 'commits') {
      const resp = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, { headers });
      if (!resp.ok) {
        return res.status(resp.status).json({ success: false, error: `GitHub error ${resp.status}` });
      }
      const commits = await resp.json();
      return res.status(200).json({
        success: true,
        repo,
        latestCommits: commits.map(c => ({
          sha: c.sha.substring(0, 7),
          message: c.commit.message,
          author: c.commit.author.name,
          date: c.commit.author.date
        }))
      });
    }

    // Default: repo general info
    const resp = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: `GitHub error ${resp.status}` });
    }
    const data = await resp.json();
    return res.status(200).json({
      success: true,
      repo: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      defaultBranch: data.default_branch,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('GitHub connector error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
