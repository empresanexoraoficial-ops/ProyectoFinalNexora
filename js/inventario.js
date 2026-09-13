// inventario.js — StockFlow · Nexora 2026
// Migrado a la API real (antes: localStorage). Modelo nuevo: Producto
// (catálogo maestro, solo Admin crea) + Variante (talle/color/etc. con su
// propio stock, Admin o Repositor la agregan a un producto existente).

let sesionInv = null;
try { sesionInv = JSON.parse(sessionStorage.getItem('usuario')); } catch {}

let productosCache = [];
let tiposCache = [];
let productoActivoParaVariante = null;

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

// ── Carga inicial ────────────────────────────────────────────────
async function cargarTodo() {
  try {
    const [rProductos, rTipos] = await Promise.all([
      api('/api/productos.php'),
      api('/api/tipos.php'),
    ]);
    productosCache = rProductos.productos;
    tiposCache = rTipos.tipos;
    renderTabla();
    renderSelectTipos();

    // Solo Administrador puede crear productos nuevos
    if (sesionInv && sesionInv.rol === 'administrador') {
      document.getElementById('btn-nuevo-producto').style.display = '';
    }
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

function fmt(n) { return '$' + Number(n).toFixed(2); }

// ── Tabla principal ──────────────────────────────────────────────
function renderTabla(filtro = '') {
  const tbody = document.getElementById('tbody-inventario');
  let lista = productosCache;
  if (filtro) {
    const f = filtro.toLowerCase();
    lista = lista.filter(p => (p.nombre + (p.marca || '') + (p.tipo_nombre || '')).toLowerCase().includes(f));
  }

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--texto-secundario);padding:32px">
      ${filtro ? 'Sin resultados para "' + filtro + '".' : 'Sin productos todavía.'}
    </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const stockBajo = Number(p.stock_total) === 0;
    const puedeAgregarVariante = sesionInv && (sesionInv.rol === 'administrador' || sesionInv.rol === 'repositor');
    return `<tr>
      <td><strong>${p.nombre}</strong></td>
      <td>${p.tipo_nombre || '—'}</td>
      <td>${p.marca || '—'}</td>
      <td>${fmt(p.precio_venta)}</td>
      <td ${stockBajo ? 'style="color:var(--color-error);font-weight:600"' : ''}>${p.stock_total}</td>
      <td>${p.variantes_count}</td>
      <td>
        <button class="btn-texto" onclick="verVariantes(${p.id}, '${p.nombre.replace(/'/g, "\\'")}')">Ver</button>
        ${puedeAgregarVariante ? `<button class="btn-texto" onclick="abrirModalVariante(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${p.tipo_id})">+ Variante</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

document.getElementById('buscar-producto').addEventListener('input', function () { renderTabla(this.value); });

// ── Modal: Nuevo producto (solo Administrador) ──────────────────
function renderSelectTipos() {
  const sel = document.getElementById('prod-tipo');
  sel.innerHTML = '<option value="">Elegir tipo...</option>' +
    tiposCache.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');
}

// Al elegir el tipo, mostramos los campos de sus atributos FIJOS
// (aplica_variante = false, ej. Marca) — los de variante (Talle/Color) NO
// van acá, esos se cargan recién al agregar una variante.
function alCambiarTipo() {
  const tipoId = document.getElementById('prod-tipo').value;
  const cont = document.getElementById('prod-atributos-fijos');
  cont.innerHTML = '';
  if (!tipoId) return;

  const tipo = tiposCache.find(t => String(t.id) === tipoId);
  if (!tipo) return;

  const fijos = tipo.atributos_sugeridos.filter(a => !a.aplica_variante);
  cont.innerHTML = fijos.map(a => `
    <div class="campo">
      <label>${a.nombre}</label>
      <input type="text" data-atributo-fijo="${a.nombre}" placeholder="${a.nombre}" />
    </div>`).join('');
}

function abrirModalProducto() {
  document.getElementById('prod-nombre').value = '';
  document.getElementById('prod-tipo').value = '';
  document.getElementById('prod-categoria').value = '';
  document.getElementById('prod-precio-costo').value = '';
  document.getElementById('prod-precio-venta').value = '';
  document.getElementById('prod-descripcion').value = '';
  document.getElementById('prod-atributos-fijos').innerHTML = '';
  document.getElementById('err-prod-nombre').textContent = '';
  document.getElementById('err-prod-tipo').textContent = '';
  document.getElementById('err-prod-precio').textContent = '';
  document.getElementById('modal-producto').classList.add('visible');
}
function cerrarModalProducto() { document.getElementById('modal-producto').classList.remove('visible'); }

async function guardarProducto() {
  const nombre = document.getElementById('prod-nombre').value.trim();
  const tipoId = document.getElementById('prod-tipo').value;
  const precioCosto = parseFloat(document.getElementById('prod-precio-costo').value) || 0;
  const precioVenta = parseFloat(document.getElementById('prod-precio-venta').value) || 0;

  let ok = true;
  document.getElementById('err-prod-nombre').textContent = '';
  document.getElementById('err-prod-tipo').textContent = '';
  document.getElementById('err-prod-precio').textContent = '';
  if (!nombre) { document.getElementById('err-prod-nombre').textContent = 'El nombre es obligatorio.'; ok = false; }
  if (!tipoId) { document.getElementById('err-prod-tipo').textContent = 'Elegí un tipo.'; ok = false; }
  if (precioVenta > 0 && precioVenta < precioCosto) { document.getElementById('err-prod-precio').textContent = 'El precio de venta no puede ser menor al costo.'; ok = false; }
  if (!ok) return;

  const atributosProducto = {};
  document.querySelectorAll('#prod-atributos-fijos [data-atributo-fijo]').forEach(inp => {
    if (inp.value.trim()) atributosProducto[inp.dataset.atributoFijo] = inp.value.trim();
  });

  try {
    await api('/api/productos.php', {
      method: 'POST',
      body: JSON.stringify({
        nombre, tipo_id: Number(tipoId),
        categoria: document.getElementById('prod-categoria').value.trim() || null,
        descripcion: document.getElementById('prod-descripcion').value.trim() || null,
        marca: atributosProducto['Marca'] || null, // por compatibilidad con la columna existente
        precio_costo: precioCosto, precio_venta: precioVenta,
        atributos_producto: atributosProducto,
      }),
    });
    mostrarToast('Producto creado.', 'exito');
    cerrarModalProducto();
    cargarTodo();
  } catch (e) {
    document.getElementById('err-prod-nombre').textContent = e.message;
  }
}

// ── Modal: Agregar variante ──────────────────────────────────────
function abrirModalVariante(productoId, nombreProducto, tipoId) {
  productoActivoParaVariante = productoId;
  document.getElementById('variante-producto-nombre').textContent = nombreProducto;
  document.getElementById('var-sku').value = '';
  document.getElementById('var-stock-min').value = 0;
  document.getElementById('var-vencimiento').value = '';
  document.getElementById('err-variante').textContent = '';

  const tipo = tiposCache.find(t => t.id === tipoId);
  document.getElementById('var-vencimiento-cont').style.display = (tipo && tipo.requiere_vencimiento) ? '' : 'none';

  const cont = document.getElementById('var-atributos');
  const variables = tipo ? tipo.atributos_sugeridos.filter(a => a.aplica_variante) : [];
  cont.innerHTML = variables.length
    ? variables.map(a => `
        <div class="campo">
          <label>${a.nombre} *</label>
          <input type="text" data-atributo-variante="${a.nombre}" placeholder="${a.nombre}" />
        </div>`).join('')
    : '<p style="font-size:var(--texto-sm);color:var(--texto-secundario)">Este tipo no tiene atributos de variante — se crea una variante única.</p>';

  document.getElementById('modal-variante').classList.add('visible');
}
function cerrarModalVariante() { document.getElementById('modal-variante').classList.remove('visible'); }

async function guardarVariante() {
  const atributos = {};
  let faltaAlguno = false;
  document.querySelectorAll('#var-atributos [data-atributo-variante]').forEach(inp => {
    if (!inp.value.trim()) faltaAlguno = true;
    atributos[inp.dataset.atributoVariante] = inp.value.trim();
  });
  if (faltaAlguno) {
    document.getElementById('err-variante').textContent = 'Completá todos los atributos.';
    return;
  }

  try {
    await api('/api/variantes.php', {
      method: 'POST',
      body: JSON.stringify({
        producto_id: productoActivoParaVariante,
        sku: document.getElementById('var-sku').value.trim() || null,
        stock_min: Number(document.getElementById('var-stock-min').value) || 0,
        vencimiento: document.getElementById('var-vencimiento').value || null,
        atributos,
      }),
    });
    mostrarToast('Variante agregada. Cargá el stock real desde Ingresos.', 'exito');
    cerrarModalVariante();
    cargarTodo();
  } catch (e) {
    document.getElementById('err-variante').textContent = e.message;
  }
}

// ── Ver variantes de un producto ─────────────────────────────────
async function verVariantes(productoId, nombreProducto) {
  document.getElementById('ver-variantes-nombre').textContent = nombreProducto;
  const tbody = document.getElementById('tbody-variantes');
  tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
  document.getElementById('modal-ver-variantes').classList.add('visible');

  try {
    const r = await api(`/api/variantes.php?producto_id=${productoId}`);
    if (!r.variantes.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--texto-secundario)">Sin variantes todavía.</td></tr>';
      return;
    }
    tbody.innerHTML = r.variantes.map(v => `
      <tr>
        <td>${v.sku || '—'}</td>
        <td>${Object.entries(v.atributos).map(([k, val]) => `${k}: ${val}`).join(', ') || '—'}</td>
        <td ${v.stock <= v.stock_min ? 'style="color:var(--color-error);font-weight:600"' : ''}>${v.stock}</td>
        <td>${v.stock_min}</td>
        <td>${v.vencimiento || '—'}</td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--color-error)">${e.message}</td></tr>`;
  }
}

cargarTodo();
