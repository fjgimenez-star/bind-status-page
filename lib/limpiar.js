'use strict';
// Reconstruye el estado público campo por campo (lista blanca). Aunque el monitor
// ya manda la vista pública, acá se descarta cualquier campo que no esté previsto.

const ESTADOS = ['operativo', 'degradado', 'con_errores', 'no_verificado'];
const ETIQUETAS = { operativo: 'Operativo', degradado: 'Degradado', con_errores: 'Con errores', no_verificado: 'No verificado' };

const txt = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : v == null ? null : String(v).slice(0, max));
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const est = (v) => (ESTADOS.includes(v) ? v : 'no_verificado');
const fecha = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

function limpiar(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.productos)) throw new Error('Formato inválido');
  const productos = d.productos.slice(0, 20).map((p) => ({
    id: txt(p.id, 40), nombre: txt(p.nombre, 80), nombreCorto: txt(p.nombreCorto, 20), descripcion: txt(p.descripcion, 300),
    estado: est(p.estado), etiqueta: ETIQUETAS[est(p.estado)], desde: fecha(p.desde),
    endpoints: (Array.isArray(p.endpoints) ? p.endpoints : []).slice(0, 200).map((e) => ({
      id: txt(e.id, 80), nombre: txt(e.nombre, 120), metodo: txt(e.metodo, 10), ruta: txt(e.ruta, 300),
      estado: est(e.estado), etiqueta: ETIQUETAS[est(e.estado)], nota: txt(e.nota, 200),
      ultimaVerificacion: fecha(e.ultimaVerificacion), ms: num(e.ms),
      disponibilidad24h: num(e.disponibilidad24h), disponibilidad7d: num(e.disponibilidad7d), msPromedio24h: num(e.msPromedio24h),
      barras: typeof e.barras === 'string' ? e.barras.replace(/[^olfn]/g, '').slice(-60) : '',
    })),
  }));
  const plat = est(d.plataforma && d.plataforma.estado);
  return {
    generado: fecha(d.generado) || new Date().toISOString(),
    recibido: new Date().toISOString(),
    ambiente: txt(d.ambiente, 30) || 'STG',
    ultimaActualizacion: fecha(d.ultimaActualizacion),
    frecuenciaSegundos: num(d.frecuenciaSegundos) || 300,
    plataforma: { estado: plat, etiqueta: ETIQUETAS[plat] },
    productos,
    incidentes: (Array.isArray(d.incidentes) ? d.incidentes : []).slice(0, 100).map((i) => ({
      producto: txt(i.producto, 80), titulo: txt(i.titulo, 200), tipo: i.tipo === 'degradado' ? 'degradado' : 'con_errores',
      inicio: fecha(i.inicio), fin: fecha(i.fin), resuelto: !!i.resuelto,
    })),
  };
}

// Si el monitor dejó de mandar datos, no se muestra un estado viejo como si fuera actual.
function marcarSiEstaViejo(d, maxMin) {
  const ref = Date.parse(d.recibido || d.generado);
  if (Date.now() - ref <= maxMin * 60000) return d;
  const nv = { estado: 'no_verificado', etiqueta: ETIQUETAS.no_verificado };
  return {
    ...d, desactualizado: true, plataforma: nv,
    productos: d.productos.map((p) => ({ ...p, ...nv, endpoints: p.endpoints.map((e) => ({ ...e, ...nv, nota: 'Sin verificaciones recientes del monitor.' })) })),
  };
}

module.exports = { limpiar, marcarSiEstaViejo };
