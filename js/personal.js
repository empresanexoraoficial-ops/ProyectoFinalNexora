// personal.js — StockFlow · Nexora 2026
// Renzo Corbo
// Solo accesible por administrador

(function () {
  let s = null;
  try { s = JSON.parse(sessionStorage.getItem('usuario')); } catch {}
  if (!s || s.rol !== 'administrador') {
    alert('Acceso restringido. Solo el Administrador puede gestionar el personal.');
    window.location.href = 'inicio.html';
  }
})();

const ROLES_LABEL = { administrador: 'Administrador', vendedor: 'Vendedor', repositor: 'Repositor' };
let editandoId = null;

function getSesion() { try { return JSON.parse(sessionStorage.getItem('usuario')); } catch { return {}; } }

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast visible ' + tipo;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

function renderTablaPersonal(filtro = '') {
  const usuarios = Store.get('usuarios');
  const tbody    = document.getElementById('tbody-personal');
  const lista    = filtro
    ? usuarios.filter(u => (u.nombre + u.email + u.rol).toLowerCase().includes(filtro.toLowerCase()))
    : usuarios;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;
      color:var(--texto-secundario);padding:32px">Sin usuarios.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(u => {
    const activo = u.activo !== false;
    const esYo   = getSesion().id === u.id;
    return `<tr style="${!activo ? 'opacity:0.6' : ''}">
      <td><strong>${u.nombre}</strong>${esYo ? ' <span style="font-size:0.7rem;color:var(--color-secundario)">(vos)</span>' : ''}</td>
      <td>${u.email}</td>
      <td>${ROLES_LABEL[u.rol] || u.rol}</td>
      <td>${activo
        ? '<span class="badge badge-ok">Activo</span>'
        : '<span class="badge badge-critico">Inactivo</span>'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn-secundario btn-sm" onclick="editarUsuario('${u.id}')">Editar</button>
        ${!esYo ? `<button class="btn-peligro btn-sm" onclick="toggleActivo('${u.id}')">
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
  const u = Store.get('usuarios').find(x => x.id === id);
  if (!u) return;
  editandoId = id;
  document.getElementById('modal-usuario-titulo').textContent = 'Editar usuario';
  document.getElementById('lbl-password').textContent = 'Nueva contraseña (vacío = no cambiar)';
  document.getElementById('usr-nombre').value   = u.nombre;
  document.getElementById('usr-email').value    = u.email;
  document.getElementById('usr-rol').value      = u.rol;
  document.getElementById('usr-activo').value   = String(u.activo !== false);
  document.getElementById('usr-password').value = '';
  limpiarErroresModal();
  document.getElementById('modal-usuario').classList.add('visible');
}

function cerrarModalUsuario() { document.getElementById('modal-usuario').classList.remove('visible'); }

function limpiarErroresModal() {
  ['err-usr-nombre','err-usr-email','err-usr-rol','err-usr-password']
    .forEach(id => document.getElementById(id).textContent = '');
}

function guardarUsuario() {
  limpiarErroresModal();
  const nombre   = document.getElementById('usr-nombre').value.trim();
  const email    = document.getElementById('usr-email').value.trim().toLowerCase();
  const rol      = document.getElementById('usr-rol').value;
  const password = document.getElementById('usr-password').value;
  const activo   = document.getElementById('usr-activo').value === 'true';

  let ok = true;
  if (!nombre)                     { document.getElementById('err-usr-nombre').textContent   = 'Obligatorio.'; ok = false; }
  if (!email)                      { document.getElementById('err-usr-email').textContent    = 'Obligatorio.'; ok = false; }
  if (!rol)                        { document.getElementById('err-usr-rol').textContent      = 'Seleccioná un rol.'; ok = false; }
  if (!editandoId && !password)    { document.getElementById('err-usr-password').textContent = 'Obligatorio.'; ok = false; }
  if (!ok) return;

  let usuarios = Store.get('usuarios');
  const duplicado = usuarios.find(u => u.email === email && u.id !== editandoId);
  if (duplicado) { document.getElementById('err-usr-email').textContent = 'Email ya registrado.'; return; }

  const ahora = new Date().toISOString();
  if (editandoId) {
    usuarios = usuarios.map(u => u.id === editandoId
      ? { ...u, nombre, email, rol, activo, ...(password ? { password } : {}), fechaModificacion: ahora }
      : u);
    mostrarToast('Usuario actualizado.', 'exito');
  } else {
    usuarios.push({ id: 'u_' + Date.now(), nombre, email, rol, password, activo, fechaIngreso: ahora, fechaModificacion: ahora });
    mostrarToast('Usuario creado.', 'exito');
  }

  Store.set('usuarios', usuarios);
  cerrarModalUsuario();
  renderTablaPersonal(document.getElementById('buscar-usuario').value);
}

function toggleActivo(id) {
  let usuarios = Store.get('usuarios');
  const idx    = usuarios.findIndex(u => u.id === id);
  if (idx < 0) return;
  const nuevo = !(usuarios[idx].activo !== false);
  if (!confirm(`¿${nuevo ? 'Activar' : 'Desactivar'} a ${usuarios[idx].nombre}?`)) return;
  usuarios[idx].activo = nuevo;
  usuarios[idx].fechaModificacion = new Date().toISOString();
  Store.set('usuarios', usuarios);
  renderTablaPersonal(document.getElementById('buscar-usuario').value);
  mostrarToast(`Usuario ${nuevo ? 'activado' : 'desactivado'}.`, 'exito');
}

document.getElementById('buscar-usuario')
  .addEventListener('input', function () { renderTablaPersonal(this.value); });

renderTablaPersonal();
