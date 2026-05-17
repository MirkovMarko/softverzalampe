export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Token, X-Shopify-URL');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const shopUrl = req.headers['x-shopify-url'];
  const token = req.headers['x-shopify-token'];
  const path = req.query.path || 'orders.json';

  if (!shopUrl || !token) {
    return res.status(400).json({ error: 'Nedostaje shopUrl ili token' });
  }

  try {
    const url = `https://${shopUrl}/admin/api/2024-01/${path}`;
    const params = new URLSearchParams(req.query);
    params.delete('path');
    const fullUrl = params.toString() ? url + '?' + params.toString() : url;

    const response = await fetch(fullUrl, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
