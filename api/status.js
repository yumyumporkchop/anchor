// Vercel serverless proxy: anchor PWA -> cysm VPS /api/status
// Same-origin HTTPS endpoint for Safari mixed-content compliance.
// Public endpoint, no auth required (but we pass Authorization through if present).

const UPSTREAM = 'http://167.233.114.119/api/status';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-CYSM-API-TOKEN');
  res.setHeader('Access-Control-Max-Age', '86400');
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  try {
    const headers = {};
    if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];
    if (req.headers['x-cysm-api-token']) headers['X-CYSM-API-TOKEN'] = req.headers['x-cysm-api-token'];

    const upstream = await fetch(UPSTREAM, {
      method: 'GET',
      headers: headers,
    });

    const text = await upstream.text();
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: 'Upstream fetch failed: ' + (err && err.message ? err.message : String(err)) });
  }
};
