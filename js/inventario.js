// inventario.js — StockFlow · Nexora 2026
// Módulo: Inventario — Darío Prieto

let productos = Store.get('productos');
let editandoId = null;

// ── Render tabla ──────────────────────────────────────────────────
function renderTabla(filtro = '') {
  const tbody = document.getElementById('tbody-inventario');
  const lista = filtro
    ? productos.filter(p =>
        (p.nombre + (p.codigo || '') + (p.categoria || ''))
          .toLowerCase().includes(filtro.toLowerCase()))
    : productos;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--texto-secundario);padding:32px">
      ${filtro ? 'Sin resultados para "' + filtro + '".' : 'Sin productos. Usá "+ Nuevo producto" para agregar.'}
    </td></tr>`;
    // Actualizar datalist categorías
    actualizarCategorias();
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const critico = p.stock <= p.stockMin;
    const badge = critico
      ? '<span class="badge badge-critico">Crítico</span>'
      : '<span class="badge badge-ok">OK</span>';
    return `<tr style="${critico ? 'background:var(--fondo-error)' : ''}">
      <td>${p.codigo || '—'}</td>
      <td>
        <strong>${p.nombre}</strong>
        ${p.variantes ? `<br><small style="color:var(--texto-secundario)">${p.variantes}</small>` : ''}
        ${p.temporada ? `<br><small style="color:var(--color-info)">${p.temporada}</small>` : ''}
      </td>
      <td>${p.categoria || '—'}</td>
      <td><strong style="${critico ? 'color:var(--color-error)' : ''}">${p.stock}</strong></td>
      <td>${p.stockMin}</td>
      <td>$${Number(p.precioCosto || 0).toFixed(2)}</td>
      <td>$${Number(p.precioVenta || 0).toFixed(2)}</td>
      <td>${badge}</td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-secundario btn-sm" onclick="editarProducto('${p.id}')">Editar</button>
        <button class="btn-peligro btn-sm" onclick="eliminarProducto('${p.id}')">Eliminar</button>
      </td>
    </tr>`;
  }).join('');

  actualizarCategorias();
}

function actualizarCategorias() {
  const cats = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
  document.getElementById('lista-categorias').innerHTML =
    cats.map(c => `<option>${c}</option>`).join('');
}

// ── Modal ─────────────────────────────────────────────────────────
function abrirModalProducto() {
  editandoId = null;
  document.getElementById('modal-producto-titulo').textContent = 'Nuevo producto';
  ['prod-codigo','prod-nombre','prod-categoria','prod-variantes'].forEach(id =>
    document.getElementById(id).value = '');
  document.getElementById('prod-temporada').value = '';
  document.getElementById('prod-precio-costo').value = '';
  document.getElementById('prod-precio-venta').value = '';
  document.getElementById('prod-stock').value = '0';
  document.getElementById('prod-stock-min').value = '0';
  document.getElementById('err-prod-nombre').textContent = '';
  document.getElementById('err-prod-precio').textContent = '';
  document.getElementById('modal-producto').classList.add('visible');
}

function cerrarModalProducto() {
  document.getElementById('modal-producto').classList.remove('visible');
}

function editarProducto(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;
  editandoId = id;
  document.getElementById('modal-producto-titulo').textContent = 'Editar producto';
  document.getElementById('prod-codigo').value        = p.codigo || '';
  document.getElementById('prod-nombre').value        = p.nombre;
  document.getElementById('prod-categoria').value     = p.categoria || '';
  document.getElementById('prod-temporada').value     = p.temporada || '';
  document.getElementById('prod-precio-costo').value  = p.precioCosto || '';
  document.getElementById('prod-precio-venta').value  = p.precioVenta || '';
  document.getElementById('prod-stock').value         = p.stock;
  document.getElementById('prod-stock-min').value     = p.stockMin;
  document.getElementById('prod-variantes').value     = p.variantes || '';
  document.getElementById('modal-producto').classList.add('visible');
}

function guardarProducto() {
  const nombre      = document.getElementById('prod-nombre').value.trim();
  const precioCosto = parseFloat(document.getElementById('prod-precio-costo').value) || 0;
  const precioVenta = parseFloat(document.getElementById('prod-precio-venta').value) || 0;

  document.getElementById('err-prod-nombre').textContent = '';
  document.getElementById('err-prod-precio').textContent = '';

  if (!nombre) {
    document.getElementById('err-prod-nombre').textContent = 'El nombre es obligatorio.';
    return;
  }
  if (precioVenta > 0 && precioVenta < precioCosto) {
    document.getElementById('err-prod-precio').textContent =
      'El precio de venta no puede ser menor al costo.';
    return;
  }

  const prod = {
    id:           editandoId || 'p_' + Date.now(),
    codigo:       document.getElementById('prod-codigo').value.trim(),
    nombre,
    categoria:    document.getElementById('prod-categoria').value.trim(),
    temporada:    document.getElementById('prod-temporada').value,
    precioCosto, precioVenta,
    stock:        parseInt(document.getElementById('prod-stock').value) || 0,
    stockMin:     parseInt(document.getElementById('prod-stock-min').value) || 0,
    variantes:    document.getElementById('prod-variantes').value.trim(),
    fechaAlta:    new Date().toISOString(),
  };

  if (editandoId) {
    productos = productos.map(p => p.id === editandoId ? { ...p, ...prod } : p);
    mostrarToast('Producto actualizado.', 'exito');
  } else {
    productos.push(prod);
    mostrarToast('Producto agregado.', 'exito');
  }

  Store.set('productos', productos);
  cerrarModalProducto();
  renderTabla(document.getElementById('buscar-producto').value);
}

function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
  productos = productos.filter(p => p.id !== id);
  Store.set('productos', productos);
  renderTabla(document.getElementById('buscar-producto').value);
  mostrarToast('Producto eliminado.', 'exito');
}

// ── Toast ─────────────────────────────────────────────────────────
function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast visible ' + tipo;
  setTimeout(() => t.className = 'toast', 3000);
}

// ── Init ──────────────────────────────────────────────────────────
document.getElementById('buscar-producto').addEventListener('input', function () {
  renderTabla(this.value);
});

renderTabla();
