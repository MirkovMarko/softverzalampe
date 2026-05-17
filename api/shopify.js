export const config = { runtime: 'edge' };

export default async function handler(req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Shopify-URL, X-Shopify-Token, Authorization',
      }
    });
  }

  const url = new URL(req.url);
  const shopUrl = req.headers.get('x-shopify-url');
  const token = req.headers.get('x-shopify-token');
  const path = url.searchParams.get('path') || 'orders.json';

  if (!shopUrl || !token) {
    return new Response(JSON.stringify({ error: 'Nedostaje shopUrl ili token' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  // Build Shopify URL
  const params = new URLSearchParams(url.searchParams);
  params.delete('path');
  const shopifyUrl = `https://${shopUrl}/admin/api/2024-01/${path}?${params.toString()}`;

  try {
    const response = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Shopify-URL, X-Shopify-Token',
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}
