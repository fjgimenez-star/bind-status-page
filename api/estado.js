'use strict';
// GET /api/estado — lo leen la página y el widget.
const { head } = require('@vercel/blob');
const { marcarSiEstaViejo } = require('../lib/limpiar');

const ORIGENES = String(process.env.CORS_ORIGENES || 'https://psp.bind.com.ar').split(',').map((s) => s.trim());

module.exports = async (req, res) => {
  const o = req.headers.origin;
  if (o && (ORIGENES.includes('*') || ORIGENES.includes(o))) { res.setHeader('Access-Control-Allow-Origin', ORIGENES.includes('*') ? '*' : o); res.setHeader('Vary', 'Origin'); }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const meta = await head('estado/estado.json');
    const r = await fetch(`${meta.url}?v=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error('blob');
    const d = marcarSiEstaViejo(await r.json(), Number(process.env.MINUTOS_SIN_DATOS || 20));
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=30');
    return res.status(200).json(d);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Todavía no hay datos del monitor' });
  }
};
