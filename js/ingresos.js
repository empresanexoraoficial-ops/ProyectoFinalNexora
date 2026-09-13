// ingresos.js — StockFlow · Nexora 2026
// Migrado a la API real. Ya no se escribe el producto a mano — se busca
// una variante YA EXISTENTE (Talle/Color/etc.) y se le suma stock.
// Si el producto todavía no existe, lo tiene que crear un Administrador
// primero en Inventario — acá no se puede inventar uno nuevo.

let variantesCache = [];
let varianteElegida = null;

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

function textoBusqueda(v) {
  const valores = Object.values(v.atributos).join(' ');
  return (v.producto_nombre + ' ' + valores + ' ' + (v.sku || '')).toLowerCase();
}

async function cargarVariantes() {
  try {
    const r = await api('/api/variantes.php');
    variantesCache = r.variantes;
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

function renderResultadosBusqueda(texto) {
  const cont = document.getElementById('ing-resultados');
  if (!texto.trim()) { cont.style.display = 'none'; cont.innerHTML = ''; return; }

  const t = texto.toLowerCase();
  const coincidencias = variantesCache.filter(v => textoBusqueda(v).includes(t)).slice(0, 12);

  if (!coincidencias.length) {
    cont.innerHTML = '<div class="resultado-item" style="cursor:default;color:var(--texto-secundario)">Sin resultados. Si el producto no existe, un Administrador lo crea en Inventario.</div>';
    cont.style.display = '';
    return;
  }

  cont.innerHTML = coincidencias.map(v => {
    const atrs = Object.entries(v.atributos).map(([k, val]) => `${k}: ${val}`).join(' · ');
    return `
      <div class="resultado-item" onclick="elegirVariante(${v.id})">
        <div>
          <div class="resultado-nombre">${v.producto_nombre}</div>
          ${atrs ? `<div class="resultado-atributos">${atrs}</div>` : ''}
        </div>
        <span class="resultado-stock">Stock actual: ${v.stock}</span>
      </div>`;
  }).join('');
  cont.style.display = '';
}

function elegirVariante(varianteId) {
  varianteElegida = variantesCache.find(v => v.id === varianteId);
  if (!varianteElegida) return;

  document.getElementById('ing-buscar').value = '';
  document.getElementById('ing-resultados').style.display = 'none';

  const atrs = Object.entries(varianteElegida.atributos).map(([k, val]) => `${k}: ${val}`).join(' · ');
  const cont = document.getElementById('ing-variante-elegida');
  cont.style.display = '';
  cont.innerHTML = `Cargando ingreso para: <strong>${varianteElegida.producto_nombre}</strong>${atrs ? ' — ' + atrs : ''}
    (stock actual: ${varianteElegida.stock}) <button class="btn-texto" onclick="quitarVarianteElegida()">Cambiar</button>`;
}

function quitarVarianteElegida() {
  varianteElegida = null;
  document.getElementById('ing-variante-elegida').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  const buscar = document.getElementById('ing-buscar');
  buscar.addEventListener('input', function () { renderResultadosBusqueda(this.value); });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#ing-buscar') && !e.target.closest('#ing-resultados')) {
      document.getElementById('ing-resultados').style.display = 'none';
    }
  });
});

// ── Reloj en vivo (hora de registro) ──────────────────────────────
function actualizarHora() {
  const ahora = new Date();
  document.getElementById('ing-hora').value = ahora.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
actualizarHora();
setInterval(actualizarHora, 1000);

async function registrarIngreso() {
  document.getElementById('err-ing-variante').textContent = '';
  document.getElementById('err-ing-cantidad').textContent = '';
  document.getElementById('err-ing-buena').textContent = '';
  document.getElementById('err-ing-lote').textContent = '';

  const cantidad      = parseInt(document.getElementById('ing-cantidad').value);
  const cantidadBuena = parseInt(document.getElementById('ing-cantidad-buena').value);
  const lote          = document.getElementById('ing-lote').value.trim();

  let ok = true;
  if (!varianteElegida) { document.getElementById('err-ing-variante').textContent = 'Buscá y elegí un producto/variante.'; ok = false; }
  if (!cantidad || cantidad <= 0) { document.getElementById('err-ing-cantidad').textContent = 'Ingresá una cantidad válida.'; ok = false; }
  if (isNaN(cantidadBuena) || cantidadBuena < 0) { document.getElementById('err-ing-buena').textContent = 'Ingresá la cantidad en buen estado (puede ser 0).'; ok = false; }
  if (cantidadBuena > cantidad) { document.getElementById('err-ing-buena').textContent = 'No puede ser mayor a la cantidad recibida.'; ok = false; }
  if (!lote) { document.getElementById('err-ing-lote').textContent = 'El número de remito es obligatorio (evita cargar el mismo 2 veces).'; ok = false; }
  if (!ok) return;

  try {
    await api('/api/ingresos.php', {
      method: 'POST',
      body: JSON.stringify({
        variante_id: varianteElegida.id,
        cantidad, cantidad_buena: cantidadBuena,
        proveedor_nombre: document.getElementById('ing-proveedor').value.trim() || null,
        proveedor_contacto: document.getElementById('ing-proveedor-contacto').value.trim() || null,
        lote,
        fecha: document.getElementById('ing-fecha').value || null,
        observaciones: document.getElementById('ing-obs').value.trim() || null,
      }),
    });

    quitarVarianteElegida();
    ['ing-cantidad','ing-cantidad-buena','ing-proveedor','ing-proveedor-contacto','ing-lote','ing-obs']
      .forEach(id => document.getElementById(id).value = '');

    mostrarToast(`Ingreso registrado. ${cantidadBuena} unidad(es) sumadas al inventario.`, 'exito');
    cargarVariantes();
    renderTablaIngresos();
  } catch (e) {
    document.getElementById('err-ing-lote').textContent = e.message;
  }
}

let ingresosCache = [];

async function renderTablaIngresos(filtro = '') {
  const tbody = document.getElementById('tbody-ingresos');
  try {
    const r = await api('/api/ingresos.php');
    ingresosCache = r.ingresos;
    pintarTablaIngresos(filtro);
    renderProveedores();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" style="color:var(--color-error)">${e.message}</td></tr>`;
  }
}

function pintarTablaIngresos(filtro = '') {
  const tbody = document.getElementById('tbody-ingresos');
  const lista = filtro
    ? ingresosCache.filter(i => (i.producto_nombre + (i.proveedor_nombre||'') + (i.lote||'')).toLowerCase().includes(filtro.toLowerCase()))
    : ingresosCache;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--texto-secundario);padding:32px">Sin ingresos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(i => {
    const horaRegistro = i.fecha_hora_registro ? new Date(i.fecha_hora_registro).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '';
    return `
    <tr>
      <td>${i.fecha}${horaRegistro ? ` <small style="color:var(--texto-secundario)">${horaRegistro}</small>` : ''}</td>
      <td><strong>${i.producto_nombre}</strong></td>
      <td style="font-size:0.85rem">${i.variante_detalle || '—'}</td>
      <td>${i.cantidad}</td>
      <td>${i.cantidad_buena < i.cantidad ? `<span style="color:var(--color-advertencia);font-weight:600">${i.cantidad_buena}</span>` : i.cantidad_buena}</td>
      <td>${i.proveedor_nombre || '—'}</td>
      <td>${i.lote || '—'}</td>
      <td style="font-size:0.85rem">${i.operador_nombre}</td>
    </tr>`;
  }).join('');
}

function renderProveedores() {
  const tbody = document.getElementById('tbody-proveedores');
  if (!ingresosCache.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--texto-secundario);padding:32px">Sin proveedores registrados aún.</td></tr>`;
    return;
  }

  const grupos = {};
  ingresosCache.forEach(i => {
    const nombre = i.proveedor_nombre || 'Sin proveedor especificado';
    if (!grupos[nombre]) grupos[nombre] = { contacto: i.proveedor_contacto || '', productos: new Set(), totalIngresos: 0, rechazadas: 0 };
    grupos[nombre].productos.add(i.producto_nombre);
    grupos[nombre].totalIngresos += 1;
    grupos[nombre].rechazadas += (i.cantidad - i.cantidad_buena);
    if (!grupos[nombre].contacto && i.proveedor_contacto) grupos[nombre].contacto = i.proveedor_contacto;
  });

  const filas = Object.entries(grupos).sort((a, b) => b[1].rechazadas - a[1].rechazadas);

  tbody.innerHTML = filas.map(([nombre, datos]) => `
    <tr style="${datos.rechazadas > 0 ? 'background:var(--fondo-error)' : ''}">
      <td><strong>${nombre}</strong></td>
      <td>${datos.contacto || '—'}</td>
      <td style="font-size:0.85rem">${[...datos.productos].join(', ')}</td>
      <td>${datos.totalIngresos}</td>
      <td>${datos.rechazadas > 0 ? `<span style="color:var(--color-error);font-weight:600">${datos.rechazadas}</span>` : '0'}</td>
    </tr>`).join('');
}

document.getElementById('ing-fecha').value = new Date().toISOString().split('T')[0];
document.getElementById('buscar-ingreso').addEventListener('input', function () { pintarTablaIngresos(this.value); });

cargarVariantes();
renderTablaIngresos();
