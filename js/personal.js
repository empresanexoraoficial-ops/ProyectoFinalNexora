// personal.js — StockFlow · Nexora 2026
// Migrado a la API real. La protección de "no dejar el sistema sin
// Administrador activo" y "no auto-desactivarte" ahora se valida en el
// servidor (clases/logica/PersonalService.php), no solo acá.

const ROLES_LABEL = { administrador: 'Administrador', vendedor: 'Vendedor', repositor: 'Repositor' };
let editandoId = null;
let usuariosCache = [];

function getSesion() { try { return JSON.parse(sessionStorage.getItem('usuario')); } catch { return {}; } }

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast visible ' + tipo;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

async function api(url, opciones = {}) {
  const resp = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opciones });
  const datos = await resp.json();
  if (!resp.ok) throw new Error(datos.error || 'Error inesperado.');
  return datos;
}

async function cargarUsuarios() {
  try {
    const r = await api('/api/personal.php');
    usuariosCache = r.usuarios;
    renderTablaPersonal(document.getElementById('buscar-usuario').value);
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

function renderTablaPersonal(filtro = '') {
  const tbody = document.getElementById('tbody-personal');
  const lista = filtro
    ? usuariosCache.filter(u => (u.nombre + u.email + u.rol).toLowerCase().includes(filtro.toLowerCase()))
    : usuariosCache;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;
      color:var(--texto-secundario);padding:32px">Sin usuarios.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(u => {
    const activo = u.activo == 1;
    const esYo   = getSesion().id === u.id;
    return `<tr style="${!activo ? 'opacity:0.6' : ''}">
      <td><strong>${esc(u.nombre)}</strong>${esYo ? ' <span style="font-size:0.7rem;color:var(--color-acento)">(vos)</span>' : ''}</td>
      <td>${esc(u.email)}</td>
      <td>${ROLES_LABEL[u.rol] || u.rol}</td>
      <td>${activo
        ? '<span class="badge badge-ok">Activo</span>'
        : '<span class="badge badge-critico">Inactivo</span>'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn-secundario btn-sm" onclick="editarUsuario(${u.id})">Editar</button>
        ${!esYo ? `<button class="btn-peligro btn-sm" onclick="toggleActivo(${u.id})">
          ${activo ? 'Desactivar' : 'Activar'}</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

function abrirModalUsuario() {
  editandoId = null;
  document.getElementById('modal-usuario-titulo').textContent = 'Nuevo usuario';
  document.getElementById('lbl-password').textContent = 'Contraseña *';
  ['usr-nombre','usr-email','usr-password'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('usr-rol').value    = '';
  document.getElementById('usr-activo').value = 'true';
  limpiarErroresModal();
  document.getElementById('modal-usuario').classList.add('visible');
}

function editarUsuario(id) {
  const u = usuariosCache.find(x => x.id === id);
  if (!u) return;
  editandoId = id;
  document.getElementById('modal-usuario-titulo').textContent = 'Editar usuario';
  document.getElementById('lbl-password').textContent = 'Nueva contraseña (vacío = no cambiar)';
  document.getElementById('usr-nombre').value   = u.nombre;
  document.getElementById('usr-email').value    = u.email;
  document.getElementById('usr-rol').value      = u.rol;
  document.getElementById('usr-activo').value   = String(u.activo == 1);
  document.getElementById('usr-password').value = '';
  limpiarErroresModal();
  document.getElementById('modal-usuario').classList.add('visible');
}

function cerrarModalUsuario() { document.getElementById('modal-usuario').classList.remove('visible'); }

function limpiarErroresModal() {
  ['err-usr-nombre','err-usr-email','err-usr-rol','err-usr-password']
    .forEach(id => document.getElementById(id).textContent = '');
}

async function guardarUsuario() {
  limpiarErroresModal();
  const nombre   = document.getElementById('usr-nombre').value.trim();
  const email    = document.getElementById('usr-email').value.trim().toLowerCase();
  const rol      = document.getElementById('usr-rol').value;
  const password = document.getElementById('usr-password').value;
  const activo   = document.getElementById('usr-activo').value === 'true';

  let ok = true;
  if (!nombre) { document.getElementById('err-usr-nombre').textContent = 'Obligatorio.'; ok = false; }
  if (!email)  { document.getElementById('err-usr-email').textContent  = 'Obligatorio.'; ok = false; }
  if (!rol)    { document.getElementById('err-usr-rol').textContent    = 'Seleccioná un rol.'; ok = false; }
  if (!editandoId && !password) { document.getElementById('err-usr-password').textContent = 'Obligatorio.'; ok = false; }
  if (!ok) return;

  try {
    if (editandoId) {
      await api('/api/personal.php?id=' + editandoId, {
        method: 'PUT',
        body: JSON.stringify({ nombre, email, rol, activo, ...(password ? { password } : {}) }),
      });
      mostrarToast('Usuario actualizado.', 'exito');
    } else {
      await api('/api/personal.php', {
        method: 'POST',
        body: JSON.stringify({ nombre, email, rol, password }),
      });
      mostrarToast('Usuario creado.', 'exito');
    }
    cerrarModalUsuario();
    cargarUsuarios();
  } catch (e) {
    document.getElementById('err-usr-email').textContent = e.message;
  }
}

async function toggleActivo(id) {
  const u = usuariosCache.find(x => x.id === id);
  if (!u) return;
  const nuevo = u.activo != 1;
  if (!confirm(`¿${nuevo ? 'Activar' : 'Desactivar'} a ${u.nombre}?`)) return;

  try {
    await api('/api/personal.php?id=' + id, { method: 'PATCH', body: JSON.stringify({ activo: nuevo }) });
    mostrarToast(`Usuario ${nuevo ? 'activado' : 'desactivado'}.`, 'exito');
    cargarUsuarios();
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

document.getElementById('buscar-usuario')
  .addEventListener('input', function () { renderTablaPersonal(this.value); });

cargarUsuarios();
