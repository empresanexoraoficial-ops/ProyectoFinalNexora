// personal.js — StockFlow · Nexora 2026
// Migrado a la API real. La protección de "no dejar el sistema sin
// Administrador activo" y "no auto-desactivarte" ahora se valida en el
// servidor (clases/logica/PersonalService.php), no solo acá.

const ROLES_LABEL = { administrador: t('rol.administrador'), vendedor: t('rol.vendedor'), repositor: t('rol.repositor') };
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
  if (!resp.ok) throw new Error(datos.error || t('comun.error_inesperado'));
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
      color:var(--texto-secundario);padding:32px">${t('personal.sin_usuarios')}</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(u => {
    const activo = u.activo == 1;
    const esYo   = getSesion().id === u.id;
    return `<tr style="${!activo ? 'opacity:0.6' : ''}">
      <td><strong>${esc(u.nombre)}</strong>${esYo ? ' <span style="font-size:0.7rem;color:var(--color-acento)">' + t('personal.vos') + '</span>' : ''}</td>
      <td>${esc(u.email)}</td>
      <td>${ROLES_LABEL[u.rol] || u.rol}</td>
      <td>${activo
        ? '<span class="badge badge-ok">' + t('personal.activo') + '</span>'
        : '<span class="badge badge-critico">' + t('personal.inactivo') + '</span>'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn-secundario btn-sm" onclick="editarUsuario(${u.id})">${t('comun.editar')}</button>
        ${!esYo ? `<button class="btn-peligro btn-sm" onclick="toggleActivo(${u.id})">
          ${activo ? t('personal.desactivar') : t('personal.activar')}</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

function abrirModalUsuario() {
  editandoId = null;
  document.getElementById('modal-usuario-titulo').textContent = t('personal.nuevo');
  document.getElementById('lbl-password').textContent = t('personal.pass_requerida');
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
  document.getElementById('modal-usuario-titulo').textContent = t('personal.editar_titulo');
  document.getElementById('lbl-password').textContent = t('personal.pass_nueva');
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
  if (!nombre) { document.getElementById('err-usr-nombre').textContent = t('comun.obligatorio'); ok = false; }
  if (!email)  { document.getElementById('err-usr-email').textContent  = t('comun.obligatorio'); ok = false; }
  if (!rol)    { document.getElementById('err-usr-rol').textContent    = t('personal.elegir_rol'); ok = false; }
  if (!editandoId && !password) { document.getElementById('err-usr-password').textContent = t('comun.obligatorio'); ok = false; }
  if (!ok) return;

  try {
    if (editandoId) {
      await api('/api/personal.php?id=' + editandoId, {
        method: 'PUT',
        body: JSON.stringify({ nombre, email, rol, activo, ...(password ? { password } : {}) }),
      });
      mostrarToast(t('personal.actualizado'), 'exito');
    } else {
      await api('/api/personal.php', {
        method: 'POST',
        body: JSON.stringify({ nombre, email, rol, password }),
      });
      mostrarToast(t('personal.creado'), 'exito');
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
  if (!confirm(t(nuevo ? 'personal.confirmar_activar' : 'personal.confirmar_desactivar', { nombre: u.nombre }))) return;

  try {
    await api('/api/personal.php?id=' + id, { method: 'PATCH', body: JSON.stringify({ activo: nuevo }) });
    mostrarToast(t(nuevo ? 'personal.activado' : 'personal.desactivado'), 'exito');
    cargarUsuarios();
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

document.getElementById('buscar-usuario')
  .addEventListener('input', function () { renderTablaPersonal(this.value); });

cargarUsuarios();
