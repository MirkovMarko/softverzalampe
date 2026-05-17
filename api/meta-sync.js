export const config = { runtime: 'edge' };

const SB_URL = 'https://auwkcdfsflhptaggasbv.supabase.co';
const SB_KEY = 'sb_publishable_12adbySKqi26fKObwmiKbg_u2ieOfe1';

async function sbGet(table, query = '') {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
  });
  return r.json();
}

async function sbUpsert(table, data) {
  await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(data)
  });
}

export default async function handler(req) {
  try {
    // Uzmi Meta token i account iz settings tabele
    const settings = await sbGet('settings');
    const s = {};
    (settings || []).forEach(r => s[r.key] = r.value);

    const metaToken = s.metaToken;
    const metaAccount = s.metaAccount;
    const metaAuto = s.metaAuto === 'true';

    if (!metaAuto || !metaToken || !metaAccount) {
      return new Response(JSON.stringify({ status: 'skipped', reason: 'auto disabled or no credentials' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Danas
    const today = new Date().toISOString().slice(0, 10);

    // Povuci sa Meta Ads API
    const metaResp = await fetch(
      `https://graph.facebook.com/v18.0/${metaAccount}/insights?fields=spend&time_range={"since":"${today}","until":"${today}"}&access_token=${metaToken}`
    );
    const metaData = await metaResp.json();

    if (metaData.error) {
      return new Response(JSON.stringify({ status: 'error', error: metaData.error.message }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const spend = parseFloat(metaData.data?.[0]?.spend || 0);

    if (spend > 0) {
      // Sacuvaj u reklame tabelu
      const existing = await sbGet('reklame', `date=eq.${today}`);
      const id = existing?.[0]?.id || Date.now().toString(36) + Math.random().toString(36).slice(2);
      await sbUpsert('reklame', [{ id, date: today, amount: Math.round(spend) }]);

      return new Response(JSON.stringify({ status: 'ok', date: today, spend: Math.round(spend) }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ status: 'ok', date: today, spend: 0, note: 'No spend today' }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
