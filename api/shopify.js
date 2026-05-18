export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'x-shopify-url, x-shopify-token, content-type',
      }
    });
  }

  const shopUrl = req.headers.get('x-shopify-url');
  const token = req.headers.get('x-shopify-token');

  if (!shopUrl || !token) {
    return new Response(JSON.stringify({ error: 'Nedostaje shopUrl ili token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get('path') || 'orders.json';
  url.searchParams.delete('path');

  const shopifyUrl = `https://${shopUrl}/admin/api/2024-01/${path}?${url.searchParams.toString()}`;

  try {
    const fetchOpts = {
      method: req.method,
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    };

    // Forward body for POST requests
    if (req.method === 'POST') {
      const body = await req.text();
      if (body) fetchOpts.body = body;
    }

    const response = await fetch(shopifyUrl, fetchOpts);
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
