// configuracion.js — StockFlow · Nexora 2026
// Pantalla de Administrador para dar de alta Atributos y Tipos de producto
// (lo que antes solo se podía cargar por comandos — esto lo desbloquea
// para usarse desde Inventario).

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast visible ' + tipo;
  setTimeout(() => t.className = 'toast', 3500);
}

async function api(url, opciones = {}) {
  const resp = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opciones });
  const datos = await resp.json();
  if (!resp.ok) throw new Error(datos.error || 'Error inesperado.');
  return datos;
}

let atributosCache = [];

async function cargarTodo() {
  try {
    const [rAtr, rTipos] = await Promise.all([api('/api/atributos.php'), api('/api/tipos.php')]);
    atributosCache = rAtr.atributos;
    renderAtributos();
    renderChecksAtributos();
    renderTipos(rTipos.tipos);
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

function renderAtributos() {
  document.getElementById('tbody-atributos').innerHTML = atributosCache.map(a => `
    <tr>
      <td>${a.nombre}</td>
      <td>${a.aplica_variante == 1 ? 'Genera variante' : 'Dato fijo'}</td>
      <td><button class="btn-texto" onclick="borrarAtributo(${a.id})">Desactivar</button></td>
    </tr>`).join('') || '<tr><td colspan="3" style="color:var(--texto-secundario)">Sin atributos todavía.</td></tr>';
}

function renderChecksAtributos() {
  document.getElementById('tipo-atributos-checks').innerHTML = atributosCache.map(a => `
    <label style="display:flex;align-items:center;gap:4px;font-size:var(--texto-sm)">
      <input type="checkbox" value="${a.id}" class="check-atributo-tipo" /> ${a.nombre}
    </label>`).join('') || '<span style="color:var(--texto-secundario);font-size:var(--texto-sm)">Cargá atributos primero.</span>';
}

function renderTipos(tipos) {
  document.getElementById('tbody-tipos').innerHTML = tipos.map(t => `
    <tr>
      <td>${t.nombre}</td>
      <td>${t.requiere_vencimiento == 1 ? 'Sí' : 'No'}</td>
      <td>${t.atributos_sugeridos.map(a => a.nombre).join(', ') || '—'}</td>
      <td><button class="btn-texto" onclick="borrarTipo(${t.id})">Desactivar</button></td>
    </tr>`).join('') || '<tr><td colspan="4" style="color:var(--texto-secundario)">Sin tipos todavía.</td></tr>';
}

async function borrarTipo(id) {
  if (!confirm('¿Desactivar este tipo? Los productos que ya lo usan no se ven afectados, pero no va a poder elegirse para productos nuevos.')) return;
  try {
    await api('/api/tipos.php?id=' + id, { method: 'DELETE' });
    mostrarToast('Tipo desactivado.', 'exito');
    cargarTodo();
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

async function crearAtributo() {
  const nombre = document.getElementById('atr-nombre').value.trim();
  document.getElementById('err-atributo').textContent = '';
  if (!nombre) { document.getElementById('err-atributo').textContent = 'Poné un nombre.'; return; }

  try {
    await api('/api/atributos.php', {
      method: 'POST',
      body: JSON.stringify({
        nombre,
        aplica_variante: document.getElementById('atr-aplica-variante').value === 'true',
      }),
    });
    document.getElementById('atr-nombre').value = '';
    mostrarToast('Atributo creado.', 'exito');
    cargarTodo();
  } catch (e) {
    document.getElementById('err-atributo').textContent = e.message;
  }
}

async function borrarAtributo(id) {
  if (!confirm('¿Desactivar este atributo? No se borra, solo deja de estar disponible para elegir.')) return;
  try {
    await api('/api/atributos.php?id=' + id, { method: 'DELETE' });
    mostrarToast('Atributo desactivado.', 'exito');
    cargarTodo();
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

async function crearTipo() {
  const nombre = document.getElementById('tipo-nombre').value.trim();
  document.getElementById('err-tipo').textContent = '';
  if (!nombre) { document.getElementById('err-tipo').textContent = 'Poné un nombre.'; return; }

  const atributos = Array.from(document.querySelectorAll('.check-atributo-tipo:checked')).map(c => Number(c.value));

  try {
    await api('/api/tipos.php', {
      method: 'POST',
      body: JSON.stringify({
        nombre,
        requiere_vencimiento: document.getElementById('tipo-requiere-vencimiento').checked,
        atributos,
      }),
    });
    document.getElementById('tipo-nombre').value = '';
    document.getElementById('tipo-requiere-vencimiento').checked = false;
    document.querySelectorAll('.check-atributo-tipo').forEach(c => c.checked = false);
    mostrarToast('Tipo creado.', 'exito');
    cargarTodo();
  } catch (e) {
    document.getElementById('err-tipo').textContent = e.message;
  }
}

cargarTodo();
