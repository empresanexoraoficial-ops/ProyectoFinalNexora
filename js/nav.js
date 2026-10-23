// nav.js — StockFlow · Nexora 2026
// Renzo Corbo
// Lógica compartida por TODAS las páginas internas:
// sidebar hover, dropdown de usuario, restricciones por rol

let sesion = null;
try { sesion = JSON.parse(sessionStorage.getItem('usuario')); } catch {}

const rolesLabel = { administrador: t('rol.administrador'), vendedor: t('rol.vendedor'), repositor: t('rol.repositor') };

// ── Menú único ────────────────────────────────────────────────────
// La barra lateral se genera desde ESTA lista; las páginas solo traen un
// <ul id="nav-lista"></ul> vacío. Para agregar, quitar o renombrar una
// opción se edita acá y listo (antes había que tocar los 9 HTML).
// Los permisos por rol salen de PERMISOS (js/store.js), el mismo mapa que
// usa protegerPagina, así menú y acceso real no pueden desincronizarse.
const MENU = [
  { id: 'inicio', texto: t('menu.inicio'),
    icono: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>' },
  { id: 'dashboard', texto: t('menu.dashboard'),
    icono: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.3"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.3"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.3"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.3"/></svg>' },
  { id: 'ingresos', texto: t('menu.ingresos'),
    icono: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>' },
  { id: 'inventario', texto: t('menu.inventario'),
    icono: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5L12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 7.5v9L12 21l9-4.5v-9"/><path d="M12 12v9"/></svg>' },
  { id: 'ventas', texto: t('menu.ventas'),
    icono: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.2l2.3 11.2a1.4 1.4 0 001.4 1.1h8.4a1.4 1.4 0 001.4-1.1L20.5 8.5H6"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>' },
  { id: 'gastos', texto: t('menu.gastos'),
    icono: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M8 12h8"/></svg>' },
  { id: 'reportes', texto: t('menu.reportes'),
    icono: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V11"/><path d="M11 20V6"/><path d="M18 20v-7"/></svg>' },
  { id: 'personal', texto: t('menu.personal'),
    icono: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-4 3.5-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/></svg>' },
  { id: 'contenido', texto: t('menu.contenido'),
    icono: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/></svg>' },
  { id: 'configuracion', texto: t('menu.configuracion'),
    icono: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z"/></svg>' },
];

function construirMenu() {
  const lista = document.getElementById('nav-lista');
  if (!lista) return;
  const permitidos = (sesion && PERMISOS[sesion.rol]) || ['inicio'];
  const paginaActual = window.location.pathname.split('/').pop();
  lista.innerHTML = MENU
    .filter(function (m) { return permitidos.includes(m.id); })
    .map(function (m) {
      const activo = paginaActual === m.id + '.html' ? ' activo' : '';
      return '<li class="nav-item' + activo + '"><a href="' + m.id + '.html">' +
             '<span class="nav-icono">' + m.icono + '</span>' +
             '<span class="nav-texto">' + m.texto + '</span></a></li>';
    }).join('') + '<li class="nav-separador"></li>';
}

// ── Hamburguesa (móvil) ───────────────────────────────────────────
const btnHamburguesa = document.getElementById('btn-hamburguesa');
const sidebar        = document.getElementById('sidebar');
const overlay        = document.getElementById('sidebar-overlay');

if (btnHamburguesa && sidebar && overlay) {
  btnHamburguesa.addEventListener('click', function () {
    const ab = sidebar.classList.toggle('abierto');
    btnHamburguesa.classList.toggle('abierto', ab);
    overlay.classList.toggle('visible', ab);
  });
  overlay.addEventListener('click', function () {
    sidebar.classList.remove('abierto');
    btnHamburguesa.classList.remove('abierto');
    overlay.classList.remove('visible');
  });
}

// (El plegado en escritorio ahora es con hover, vía CSS — no necesita JS)

// ── Usuario en header ─────────────────────────────────────────────
const usuarioBtn      = document.getElementById('usuario-btn');
const usuarioDropdown = document.getElementById('usuario-dropdown');

if (sesion && usuarioBtn) {
  const rol = rolesLabel[sesion.rol] || sesion.rol;

  usuarioBtn.innerHTML =
    `<span class="usuario-nombre">${esc(sesion.nombre)}</span>` +
    `<span class="usuario-rol">${rol}</span>`;

  if (usuarioDropdown) {
    usuarioDropdown.innerHTML = `
      <div class="dropdown-header">
        <p class="dropdown-nombre">${esc(sesion.nombre)}</p>
        <p class="dropdown-rol">${rol}</p>
      </div>
      <div class="dropdown-body">
        <div class="dropdown-item">
          <span class="dropdown-label">${t('nav.email')}</span>
          <span class="dropdown-valor">${esc(sesion.email)}</span>
        </div>
        <div class="dropdown-item">
          <span class="dropdown-label">${t('nav.telefono')}</span>
          <span class="dropdown-valor">${esc(sesion.telefono || '—')}</span>
        </div>
        <div class="dropdown-item">
          <span class="dropdown-label">${t('nav.rol')}</span>
          <span class="dropdown-valor">${rol}</span>
        </div>
      </div>
      <div class="dropdown-footer">
        <button class="dropdown-salir" id="btn-dropdown-salir">${t('menu.salir')}</button>
      </div>`;

    document.getElementById('btn-dropdown-salir').addEventListener('click', function () {
      sessionStorage.removeItem('usuario');
      window.location.href = '../index.html';
    });
  }

  usuarioBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    const ab = usuarioDropdown.classList.toggle('visible');
    usuarioBtn.classList.toggle('activo', ab);
  });
  document.addEventListener('click', function () {
    usuarioDropdown.classList.remove('visible');
    usuarioBtn.classList.remove('activo');
  });
  usuarioDropdown.addEventListener('click', function (e) { e.stopPropagation(); });
}

construirMenu();
