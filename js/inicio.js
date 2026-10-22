// inicio.js — StockFlow · Nexora 2026
// Página de Inicio: saludo personalizado, resumen relevante según el rol,
// y accesos SOLO a lo que ese rol puede usar (antes se mostraban los 4
// fijos a todo el mundo, sin importar el permiso real).

let sesionInicio = null;
try { sesionInicio = JSON.parse(sessionStorage.getItem('usuario')); } catch {}

const NOMBRES_PILA = { administrador: 'Administrador', vendedor: 'Vendedor', repositor: 'Repositor' };

function fmtInicio(n) { return '$' + Number(n).toFixed(2); }

// Catálogo completo de accesos posibles — se filtra abajo según PERMISOS
// (el mismo objeto que ya usa store.js para proteger páginas).
const TARJETAS = [
  { href: 'dashboard.html',  clave: 'dashboard',  nombre: 'Dashboard',   desc: 'Métricas del negocio',
    icono: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.3"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.3"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.3"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.3"/>' },
  { href: 'inventario.html', clave: 'inventario', nombre: 'Inventario',  desc: 'Gestión de productos',
    icono: '<path d="M3 7.5L12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 7.5v9L12 21l9-4.5v-9"/><path d="M12 12v9"/>' },
  { href: 'ingresos.html',   clave: 'ingresos',   nombre: 'Ingresos',     desc: 'Registrar mercadería',
    icono: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>' },
  { href: 'ventas.html',     clave: 'ventas',     nombre: 'Nueva Venta',  desc: 'Registrar una venta',
    icono: '<path d="M3 4h2.2l2.3 11.2a1.4 1.4 0 001.4 1.1h8.4a1.4 1.4 0 001.4-1.1L20.5 8.5H6"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>' },
  { href: 'gastos.html',     clave: 'gastos',     nombre: 'Gastos',       desc: 'Cargar gastos operativos',
    icono: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12h8"/>' },
  { href: 'reportes.html',   clave: 'reportes',   nombre: 'Reportes',     desc: 'Ver informes del negocio',
    icono: '<path d="M4 20V11"/><path d="M11 20V6"/><path d="M18 20v-7"/>' },
  { href: 'personal.html',   clave: 'personal',   nombre: 'Personal',     desc: 'Gestionar empleados',
    icono: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-4 3.5-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>' },
  { href: 'contenido.html', clave: 'contenido', nombre: 'Contenido', desc: 'Atributos y tipos de producto',
    icono: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/>' },
  { href: 'configuracion.html', clave: 'configuracion', nombre: 'Configuración', desc: 'Idioma y tema',
    icono: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z"/>' },
];

function renderSaludo() {
  const h = document.getElementById('inicio-titulo');
  if (!h || !sesionInicio) return;
  const primerNombre = sesionInicio.nombre.split(' ')[0];
  h.textContent = `Hola, ${primerNombre}`;
}

function renderTarjetas() {
  const cont = document.getElementById('acceso-grid');
  if (!cont || !sesionInicio) return;
  const permitidas = (typeof PERMISOS !== 'undefined' && PERMISOS[sesionInicio.rol]) || [];
  const tarjetas = TARJETAS.filter(t => permitidas.includes(t.clave));

  cont.innerHTML = tarjetas.map(t => `
    <a href="${t.href}" class="acceso-card">
      <span class="acceso-icono"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${t.icono}</svg></span>
      <span class="acceso-nombre">${t.nombre}</span>
      <span class="acceso-desc">${t.desc}</span>
    </a>`).join('');
}

async function api(url, opciones = {}) {
  const resp = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opciones });
  const datos = await resp.json();
  if (!resp.ok) throw new Error(datos.error || 'Error inesperado.');
  return datos;
}

function fechaCorta(f) {
  // las fechas vienen "YYYY-MM-DD" o "YYYY-MM-DD HH:MM:SS" desde la base
  return new Date(String(f).replace(' ', 'T')).toLocaleDateString('es-UY');
}

// Resumen relevante para el rol, para que la página no se sienta vacía
// cuando el rol tiene pocos accesos (ej. Vendedor solo tiene 1 tarjeta).
// Los números vienen de /api/resumen.php?vista=inicio (ya filtrados por rol).
function pintarResumen(rol, d) {
  const cont = document.getElementById('inicio-resumen');
  let tarjetas = [];

  if (rol === 'administrador') {
    tarjetas = [
      { label: 'Ventas hoy',        valor: d.ventas_hoy.cantidad, sub: fmtInicio(d.ventas_hoy.total), href: 'dashboard.html' },
      { label: 'Stock crítico',     valor: d.stock_critico,       sub: 'variantes por reponer', href: 'inventario.html', clase: d.stock_critico ? 'rojo' : '' },
      { label: 'Productos activos', valor: d.productos_activos,   sub: 'en el catálogo', href: 'inventario.html' },
    ];
  } else if (rol === 'vendedor') {
    tarjetas = [
      { label: 'Tus ventas de hoy', valor: d.ventas_hoy.cantidad, sub: fmtInicio(d.ventas_hoy.total), href: 'ventas.html' },
    ];
  } else if (rol === 'repositor') {
    tarjetas = [
      { label: 'Stock crítico',         valor: d.stock_critico, sub: 'variantes por reponer', href: 'inventario.html', clase: d.stock_critico ? 'rojo' : '' },
      { label: 'Por vencer (≤15 días)', valor: d.por_vencer,    sub: 'revisar pronto', href: 'inventario.html', clase: d.por_vencer ? 'ambar' : '' },
    ];
  }

  cont.innerHTML = tarjetas.map(t => `
    <a href="${t.href}" class="metrica-card ${t.clase || ''}">
      <span class="metrica-label">${t.label}</span>
      <span class="metrica-valor">${t.valor}</span>
      <span class="metrica-sub">${t.sub}</span>
    </a>`).join('');
}

// Actividad reciente — para que Inicio no se sienta vacío en roles con
// pocos accesos (Vendedor, Repositor). Sugerencia real de un compañero de
// otro equipo al ver el prototipo: "rellenar más el espacio".
function pintarActividad(rol, d) {
  const cont = document.getElementById('inicio-actividad');
  let titulo = '';
  let filas = [];

  if (rol === 'vendedor') {
    titulo = 'Tus últimas ventas';
    filas = d.ultimas.map(v => `
      <tr>
        <td>${fechaCorta(v.fecha)}</td>
        <td>${esc(v.cliente_nombre || v.canal) || '—'}${v.estado === 'pendiente' ? ' <span class="badge badge-critico">Pendiente</span>' : ''}</td>
        <td style="text-align:right">${fmtInicio(v.total)}</td>
      </tr>`);
  } else if (rol === 'repositor') {
    titulo = 'Últimos ingresos registrados';
    filas = d.ultimos.map(i => `
      <tr>
        <td>${fechaCorta(i.fecha)}</td>
        <td>${esc(i.producto_nombre) || '—'}</td>
        <td style="text-align:right">${i.cantidad_buena}</td>
      </tr>`);
  } else {
    return; // Administrador ya tiene suficiente contenido con las tarjetas
  }

  if (!filas.length) { cont.innerHTML = ''; return; }

  cont.innerHTML = `
    <div class="card">
      <h2 style="font-size:var(--texto-md);margin-bottom:var(--espacio-md);">${titulo}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:var(--texto-sm);">
        <tbody>${filas.join('')}</tbody>
      </table>
    </div>`;
}

// ── Avisos (RF 1.8 / RF 2.3): stock mínimo y ventas pendientes ──────
// Solo Administrador y Repositor (el Vendedor no recibe avisos de stock).
async function cargarAvisos() {
  const cont = document.getElementById('inicio-avisos');
  if (!cont || !sesionInicio || !['administrador', 'repositor'].includes(sesionInicio.rol)) return;
  try {
    const r = await api('/api/notificaciones.php');
    const lista = r.notificaciones;
    if (!lista.length) { cont.innerHTML = ''; return; }
    cont.innerHTML = `
      <div class="card" style="border-left:4px solid var(--color-error)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--espacio-md)">
          <h2 style="font-size:var(--texto-md)">Avisos (${lista.length})</h2>
          <button class="btn-secundario btn-sm" id="btn-avisos-todos" type="button">Marcar todos como leídos</button>
        </div>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:8px">
          ${lista.map(n => `
            <li style="display:flex;justify-content:space-between;align-items:center;gap:12px;
                       background:var(--fondo-app);padding:8px 12px;border-radius:var(--radio)">
              <span style="font-size:var(--texto-sm)">${esc(n.mensaje)}</span>
              <button class="btn-secundario btn-sm" type="button" data-aviso="${Number(n.id)}">Leído</button>
            </li>`).join('')}
        </ul>
      </div>`;
    cont.querySelectorAll('[data-aviso]').forEach(b => b.addEventListener('click', async () => {
      await api('/api/notificaciones.php?id=' + b.dataset.aviso, { method: 'PATCH' });
      cargarAvisos();
    }));
    document.getElementById('btn-avisos-todos').addEventListener('click', async () => {
      await api('/api/notificaciones.php?todas=1', { method: 'PATCH' });
      cargarAvisos();
    });
  } catch (e) { cont.innerHTML = ''; }
}

async function cargarInicio() {
  if (!sesionInicio) return;
  try {
    const r = await api('/api/resumen.php?vista=inicio');
    pintarResumen(r.rol, r.datos);
    pintarActividad(r.rol, r.datos);
  } catch (e) {
    document.getElementById('inicio-resumen').innerHTML =
      `<p style="color:var(--color-error)">${esc(e.message)}</p>`;
  }
  cargarAvisos();
}

renderSaludo();
renderTarjetas();
cargarInicio();
