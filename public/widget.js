/*!
 * Widget de estado de las APIs de BIND PSP — para la página de documentación.
 *
 * Uso:
 *   <div id="bind-status"></div>
 *   <script src="https://<host-publico>/widget.js"
 *           data-api="https://<host-publico>/api/publico/estado"
 *           data-pagina="https://<host-publico>/"
 *           data-producto="wallet"            (opcional: muestra solo ese producto)
 *           data-contenedor="bind-status"     (opcional: id del contenedor)
 *           data-modo="compacto|lista"        (opcional, por defecto "lista")
 *           async></script>
 *
 * Usa Shadow DOM: no hereda ni pisa estilos de la página que lo incluye.
 */
(function () {
  'use strict';
  var script = document.currentScript || (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();
  var base = script.src.replace(/\/widget\.js(\?.*)?$/, '');
  var API = script.getAttribute('data-api') || base + '/api/estado';
  var PAGINA = script.getAttribute('data-pagina') || base + '/';
  var PRODUCTO = script.getAttribute('data-producto');
  var MODO = script.getAttribute('data-modo') || 'lista';
  var idCont = script.getAttribute('data-contenedor') || 'bind-status';
  var cont = document.getElementById(idCont);
  if (!cont) { cont = document.createElement('div'); cont.id = idCont; script.parentNode.insertBefore(cont, script); }
  var root = cont.attachShadow ? cont.attachShadow({ mode: 'open' }) : cont;

  var COLORES = { operativo: '#138a4b', degradado: '#b35c00', con_errores: '#c42b1c', no_verificado: '#6b7280' };
  var TITULOS = { operativo: 'Todos los servicios operativos', degradado: 'Algunos servicios con inconvenientes', con_errores: 'Servicios con errores', no_verificado: 'Estado no disponible' };
  var css = ':host{all:initial;display:block;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:inherit}' +
    '.w{border:1px solid rgba(127,127,127,.28);border-radius:10px;padding:12px 14px;background:transparent}' +
    '.cab{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}' +
    '.est{display:flex;align-items:center;gap:8px;font-weight:600}' +
    '.dot{width:10px;height:10px;border-radius:50%;flex:none}' +
    'a{color:inherit;font-size:13px;opacity:.8}a:hover{opacity:1}' +
    'ul{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:6px}' +
    'li{display:flex;justify-content:space-between;gap:10px;font-size:13px}' +
    '.et{font-weight:600}.m{opacity:.7;font-size:12px;margin-top:8px}';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hace(iso) {
    if (!iso) return '—';
    var m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    return m < 1 ? 'hace instantes' : m < 60 ? 'hace ' + m + ' min' : 'hace ' + Math.round(m / 60) + ' h';
  }
  function pintar(d) {
    var prods = d.productos.filter(function (p) { return !PRODUCTO || p.id === PRODUCTO; });
    var est = PRODUCTO && prods[0] ? prods[0].estado : d.plataforma.estado;
    var titulo = PRODUCTO && prods[0] ? prods[0].nombre + ': ' + prods[0].etiqueta : TITULOS[est];
    var lista = MODO === 'compacto' ? '' : '<ul>' + prods.map(function (p) {
      return '<li><span>' + esc(p.nombre) + '</span><span class="et" style="color:' + COLORES[p.estado] + '">● ' + esc(p.etiqueta) + '</span></li>';
    }).join('') + '</ul>';
    root.innerHTML = '<style>' + css + '</style><div class="w" role="status" aria-live="polite">' +
      '<div class="cab"><span class="est"><span class="dot" style="background:' + COLORES[est] + '"></span>' + esc(titulo) + '</span>' +
      '<a href="' + esc(PAGINA) + (PRODUCTO ? '?producto=' + encodeURIComponent(PRODUCTO) : '') + '" target="_blank" rel="noopener">Ver detalle por endpoint →</a></div>' +
      lista + '<div class="m">Ambiente ' + esc(d.ambiente) + ' · Última verificación ' + esc(hace(d.ultimaActualizacion)) + '</div></div>';
  }
  function cargar() {
    fetch(API, { cache: 'no-store', credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(pintar).catch(function () {
      root.innerHTML = '<style>' + css + '</style><div class="w"><span class="est"><span class="dot" style="background:' + COLORES.no_verificado + '"></span>Estado no disponible en este momento</span></div>';
    });
  }
  cargar();
  setInterval(cargar, 60000);
})();
