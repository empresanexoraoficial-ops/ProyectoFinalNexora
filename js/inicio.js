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
  { href: 'configuracion.html', clave: 'configuracion', nombre: 'Configuración', desc: 'Atributos y tipos de producto',
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

// Resumen relevante para el rol, para que la página no se sienta vacía
// cuando el rol tiene pocos accesos (ej. Vendedor solo tiene 1 tarjeta).
function renderResumen() {
  const cont = document.getElementById('inicio-resumen');
  if (!cont || !sesionInicio) return;

  const productos = Store.get('productos') || [];
  const ventas    = Store.get('ventas')    || [];
  const hoy       = new Date().toISOString().split('T')[0];
  const ventasHoy = ventas.filter(v => v.fecha && v.fecha.startsWith(hoy));

  let tarjetas = [];

  if (sesionInicio.rol === 'administrador') {
    const criticos = productos.filter(p => p.stock <= p.stockMin);
    tarjetas = [
      { label: 'Ventas hoy',        valor: ventasHoy.length, sub: fmtInicio(ventasHoy.reduce((s,v) => s + v.total, 0)), href: 'dashboard.html' },
      { label: 'Stock crítico',     valor: criticos.length,  sub: 'productos por reponer', href: 'inventario.html', clase: criticos.length ? 'rojo' : '' },
      { label: 'Productos activos', valor: productos.length, sub: 'en el catálogo', href: 'inventario.html' },
    ];
  } else if (sesionInicio.rol === 'vendedor') {
    tarjetas = [
      { label: 'Tus ventas de hoy', valor: ventasHoy.length, sub: fmtInicio(ventasHoy.reduce((s,v) => s + v.total, 0)), href: 'ventas.html' },
    ];
  } else if (sesionInicio.rol === 'repositor') {
    const criticos = productos.filter(p => p.stock <= p.stockMin);
    const porVencer = productos.filter(p => p.vencimiento && (new Date(p.vencimiento) - new Date()) / 86400000 <= 15);
    tarjetas = [
      { label: 'Stock crítico',      valor: criticos.length,  sub: 'productos por reponer', href: 'inventario.html', clase: criticos.length ? 'rojo' : '' },
      { label: 'Por vencer (≤15 días)', valor: porVencer.length, sub: 'revisar pronto', href: 'inventario.html', clase: porVencer.length ? 'ambar' : '' },
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
function renderActividadReciente() {
  const cont = document.getElementById('inicio-actividad');
  if (!cont || !sesionInicio) return;

  let titulo = '';
  let filas = [];

  if (sesionInicio.rol === 'vendedor') {
    const ventas = (Store.get('ventas') || []).slice(-6).reverse();
    titulo = 'Tus últimas ventas';
    filas = ventas.map(v => `
      <tr>
        <td>${new Date(v.fecha).toLocaleDateString('es-UY')}</td>
        <td>${v.cliente || v.canal || '—'}</td>
        <td style="text-align:right">${fmtInicio(v.total)}</td>
      </tr>`);
  } else if (sesionInicio.rol === 'repositor') {
    const ingresos = (Store.get('ingresos') || []).slice(-6).reverse();
    titulo = 'Últimos ingresos registrados';
    filas = ingresos.map(i => `
      <tr>
        <td>${new Date(i.fecha || i.fechaHoraRegistro).toLocaleDateString('es-UY')}</td>
        <td>${i.producto || '—'}</td>
        <td style="text-align:right">${i.cantidadBuena ?? i.cantidad}</td>
      </tr>`);
  } else {
    return; // Administrador ya tiene suficiente contenido con las 7 tarjetas
  }

  if (!filas.length) {
    cont.innerHTML = '';
    return;
  }

  cont.innerHTML = `
    <div class="card">
      <h2 style="font-size:var(--texto-md);margin-bottom:var(--espacio-md);">${titulo}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:var(--texto-sm);">
        <tbody>${filas.join('')}</tbody>
      </table>
    </div>`;
}

renderSaludo();
renderResumen();
renderTarjetas();
renderActividadReciente();
