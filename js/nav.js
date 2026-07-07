// nav.js — StockFlow · Nexora 2026
// Renzo Corbo
// Lógica compartida por TODAS las páginas internas:
// sidebar hover, dropdown de usuario, restricciones por rol

let sesion = null;
try { sesion = JSON.parse(sessionStorage.getItem('usuario')); } catch {}

const rolesLabel = { administrador: 'Administrador', vendedor: 'Vendedor', repositor: 'Repositor' };

const PERMISOS_NAV = {
  administrador: ['inicio','dashboard','inventario','ventas','gastos','reportes','personal'],
  vendedor:      ['inicio','ventas'],
  repositor:     ['inicio','inventario'],
};

function aplicarRestriccionesNav() {
  if (!sesion) return;
  const permitidos = PERMISOS_NAV[sesion.rol] || ['inicio'];
  document.querySelectorAll('.nav-item a').forEach(function (link) {
    const href = link.getAttribute('href').replace('.html', '').split('/').pop();
    if (!permitidos.includes(href)) link.closest('.nav-item').style.display = 'none';
  });
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

// ── Ítem activo del nav ───────────────────────────────────────────
const paginaActual = window.location.pathname.split('/').pop();
document.querySelectorAll('.nav-item a').forEach(function (link) {
  if (link.getAttribute('href').split('/').pop() === paginaActual)
    link.closest('.nav-item').classList.add('activo');
});

// ── Usuario en header ─────────────────────────────────────────────
const usuarioBtn      = document.getElementById('usuario-btn');
const usuarioDropdown = document.getElementById('usuario-dropdown');

if (sesion && usuarioBtn) {
  const rol = rolesLabel[sesion.rol] || sesion.rol;

  usuarioBtn.innerHTML =
    `<span class="usuario-nombre">${sesion.nombre}</span>` +
    `<span class="usuario-rol">${rol}</span>`;

  if (usuarioDropdown) {
    usuarioDropdown.innerHTML = `
      <div class="dropdown-header">
        <p class="dropdown-nombre">${sesion.nombre}</p>
        <p class="dropdown-rol">${rol}</p>
      </div>
      <div class="dropdown-body">
        <div class="dropdown-item">
          <span class="dropdown-label">Email</span>
          <span class="dropdown-valor">${sesion.email}</span>
        </div>
        <div class="dropdown-item">
          <span class="dropdown-label">Teléfono</span>
          <span class="dropdown-valor">${sesion.telefono || '—'}</span>
        </div>
        <div class="dropdown-item">
          <span class="dropdown-label">Rol</span>
          <span class="dropdown-valor">${rol}</span>
        </div>
      </div>
      <div class="dropdown-footer">
        <button class="dropdown-salir" id="btn-dropdown-salir">Cerrar sesión</button>
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

aplicarRestriccionesNav();
