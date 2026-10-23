// contenido.js — StockFlow · Nexora 2026
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
  if (!resp.ok) throw new Error(datos.error || t('comun.error_inesperado'));
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
      <td>${esc(a.nombre)}</td>
      <td>${a.aplica_variante == 1 ? t('contenido.genera_variante') : t('contenido.dato_fijo')}</td>
      <td><button class="btn-texto" onclick="borrarAtributo(${a.id})">${t('comun.desactivar')}</button></td>
    </tr>`).join('') || '<tr><td colspan="3" style="color:var(--texto-secundario)">' + t('contenido.sin_atributos') + '</td></tr>';
}

function renderChecksAtributos() {
  document.getElementById('tipo-atributos-checks').innerHTML = atributosCache.map(a => `
    <label style="display:flex;align-items:center;gap:4px;font-size:var(--texto-sm)">
      <input type="checkbox" value="${a.id}" class="check-atributo-tipo" /> ${esc(a.nombre)}
    </label>`).join('') || '<span style="color:var(--texto-secundario);font-size:var(--texto-sm)">' + t('contenido.cargar_primero') + '</span>';
}

function renderTipos(tipos) {
  document.getElementById('tbody-tipos').innerHTML = tipos.map(t => `
    <tr>
      <td>${esc(t.nombre)}</td>
      <td>${t.requiere_vencimiento == 1 ? i18n.t('comun.si') : i18n.t('comun.no')}</td>
      <td>${t.atributos_sugeridos.map(a => esc(a.nombre)).join(', ') || '—'}</td>
      <td><button class="btn-texto" onclick="borrarTipo(${t.id})">${i18n.t('comun.desactivar')}</button></td>
    </tr>`).join('') || '<tr><td colspan="4" style="color:var(--texto-secundario)">' + t('contenido.sin_tipos') + '</td></tr>';
}

async function borrarTipo(id) {
  if (!confirm(t('contenido.confirmar_tipo'))) return;
  try {
    await api('/api/tipos.php?id=' + id, { method: 'DELETE' });
    mostrarToast(t('contenido.tipo_desactivado'), 'exito');
    cargarTodo();
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

async function crearAtributo() {
  const nombre = document.getElementById('atr-nombre').value.trim();
  document.getElementById('err-atributo').textContent = '';
  if (!nombre) { document.getElementById('err-atributo').textContent = t('contenido.poner_nombre'); return; }

  try {
    await api('/api/atributos.php', {
      method: 'POST',
      body: JSON.stringify({
        nombre,
        aplica_variante: document.getElementById('atr-aplica-variante').value === 'true',
      }),
    });
    document.getElementById('atr-nombre').value = '';
    mostrarToast(t('contenido.atributo_creado'), 'exito');
    cargarTodo();
  } catch (e) {
    document.getElementById('err-atributo').textContent = e.message;
  }
}

async function borrarAtributo(id) {
  if (!confirm(t('contenido.confirmar_atributo'))) return;
  try {
    await api('/api/atributos.php?id=' + id, { method: 'DELETE' });
    mostrarToast(t('contenido.atributo_desactivado'), 'exito');
    cargarTodo();
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

async function crearTipo() {
  const nombre = document.getElementById('tipo-nombre').value.trim();
  document.getElementById('err-tipo').textContent = '';
  if (!nombre) { document.getElementById('err-tipo').textContent = t('contenido.poner_nombre'); return; }

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
    mostrarToast(t('contenido.tipo_creado'), 'exito');
    cargarTodo();
  } catch (e) {
    document.getElementById('err-tipo').textContent = e.message;
  }
}

cargarTodo();
