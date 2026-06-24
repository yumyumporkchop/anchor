// Vercel serverless proxy: anchor PWA -> cysm VPS /cos/dispatch
// Same-origin HTTPS endpoint for Safari mixed-content compliance.
// No npm deps. Node 18+ native fetch.

const UPSTREAM = 'http://167.233.114.119/cos/dispatch';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-CYSM-API-TOKEN');
  res.setHeader('Access-Control-Max-Age', '86400');
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    // Vercel parses JSON bodies automatically when Content-Type is set;
    // fall back to raw stream if needed.
    let body = req.body;
    if (body == null) {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
    }
    const payload = typeof body === 'string' ? body : JSON.stringify(body);

    const headers = { 'Content-Type': 'application/json' };
    if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];
    if (req.headers['x-cysm-api-token']) headers['X-CYSM-API-TOKEN'] = req.headers['x-cysm-api-token'];

    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: headers,
      body: payload,
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
