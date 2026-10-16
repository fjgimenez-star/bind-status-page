'use strict';
// POST /api/ingest — lo llama el monitor de la VM después de cada ciclo.
// Requiere Authorization: Bearer <INGEST_TOKEN>. Guarda el estado saneado en Vercel Blob.
const crypto = require('crypto');
const { put } = require('@vercel/blob');
const { limpiar } = require('../lib/limpiar');

function tokenOk(h) {
  const esperado = process.env.INGEST_TOKEN || '';
  const recibido = String(h || '').replace(/^Bearer\s+/i, '');
  if (esperado.length < 24 || recibido.length !== esperado.length) return false;
  return crypto.timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Método no permitido' }); }
  if (!tokenOk(req.headers.authorization)) return res.status(401).json({ error: 'No autorizado' });
  let cuerpo = req.body;
  try {
    if (typeof cuerpo === 'string') cuerpo = JSON.parse(cuerpo);
    if (JSON.stringify(cuerpo).length > 512 * 1024) return res.status(413).json({ error: 'Demasiado grande' });
    const limpio = limpiar(cuerpo);
    await put('estado/estado.json', JSON.stringify(limpio), {
      access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60,
    });
    return res.status(200).json({ ok: true, recibido: limpio.recibido });
  } catch (e) {
    return res.status(400).json({ error: e.message === 'Formato inválido' ? e.message : 'No se pudo guardar el estado' });
  }
};
