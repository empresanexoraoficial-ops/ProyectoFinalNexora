// inventario.js — StockFlow · Nexora 2026
// Módulo: Inventario — Darío Prieto

let productos = Store.get('productos');
let editandoId = null;

function diasHasta(fechaStr) {
  if (!fechaStr) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const venc = new Date(fechaStr + 'T00:00:00');
  return Math.round((venc - hoy) / (1000 * 60 * 60 * 24));
}

function renderVencimientos() {
  const cont = document.getElementById('lista-vencimientos');
  const proximos = productos
    .filter(p => p.vencimiento)
    .map(p => ({ ...p, dias: diasHasta(p.vencimiento) }))
    .filter(p => p.dias !== null && p.dias <= 15)
    .sort((a, b) => a.dias - b.dias);

  if (!proximos.length) {
    cont.innerHTML = 'Sin productos próximos a vencer (15 días o menos).';
    return;
  }

  cont.innerHTML = proximos.map(p => {
    const urgente = p.dias <= 3;
    const texto = p.dias < 0 ? `Vencido hace ${Math.abs(p.dias)} días` : (p.dias === 0 ? 'Vence hoy' : `Vence en ${p.dias} días`);
    return `<div style="display:flex;justify-content:space-between;padding:4px 0;${urgente ? 'color:var(--color-error);font-weight:600' : ''}">
      <span>${p.nombre}</span><span>${texto}</span>
    </div>`;
  }).join('');
}

// ── Render tabla ──────────────────────────────────────────────────
function renderTabla(filtro = '') {
  const tbody = document.getElementById('tbody-inventario');
  const filtroMarca = document.getElementById('filtro-marca').value;
  const filtroTalle = document.getElementById('filtro-talle').value;
  const filtroProveedor = document.getElementById('filtro-proveedor').value;

  let lista = productos;
  if (filtro) {
    lista = lista.filter(p =>
      (p.nombre + (p.codigo || '') + (p.categoria || '') + (p.marca || '') + (p.talle || ''))
        .toLowerCase().includes(filtro.toLowerCase()));
  }
  if (filtroMarca) lista = lista.filter(p => p.marca === filtroMarca);
  if (filtroTalle) lista = lista.filter(p => p.talle === filtroTalle);
  if (filtroProveedor) lista = lista.filter(p => p.proveedor === filtroProveedor);

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
        ${(p.marca || p.talle || p.color) ? `<br><small style="color:var(--texto-secundario)">${[p.marca, p.talle, p.color].filter(Boolean).join(' · ')}</small>` : ''}
        ${p.variantes ? `<br><small style="color:var(--texto-secundario)">${p.variantes}</small>` : ''}
        ${p.temporada ? `<br><small style="color:var(--color-info)">${p.temporada}</small>` : ''}
      </td>
      <td>${p.categoria || '—'}</td>
      <td><strong style="${critico ? 'color:var(--color-error)' : ''}">${p.stock}</strong></td>
      <td>${p.stockMin}</td>
      <td>$${Number(p.precioCosto || 0).toFixed(2)}</td>
      <td>$${Number(p.precioVenta || 0).toFixed(2)}</td>
      <td>${(() => { const d = diasHasta(p.vencimiento); return p.vencimiento ? (d !== null && d <= 15 ? `<span style="color:var(--color-error);font-weight:600">${p.vencimiento}</span>` : p.vencimiento) : '—'; })()}</td>
      <td>${badge}</td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-secundario btn-sm" onclick="editarProducto('${p.id}')">Editar</button>
        <button class="btn-peligro btn-sm" onclick="eliminarProducto('${p.id}')">Eliminar</button>
      </td>
    </tr>`;
  }).join('');

  actualizarCategorias();
  renderVencimientos();
}

function actualizarCategorias() {
  const cats = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
  document.getElementById('lista-categorias').innerHTML =
    cats.map(c => `<option>${c}</option>`).join('');
  actualizarFiltrosMarcaTalle();
}

function actualizarFiltrosMarcaTalle() {
  const marcas = [...new Set(productos.map(p => p.marca).filter(Boolean))].sort();
  const talles = [...new Set(productos.map(p => p.talle).filter(Boolean))].sort();
  const proveedores = [...new Set(productos.map(p => p.proveedor).filter(Boolean))].sort();

  const selMarca = document.getElementById('filtro-marca');
  const selTalle = document.getElementById('filtro-talle');
  const selProveedor = document.getElementById('filtro-proveedor');
  const marcaActual = selMarca.value;
  const talleActual = selTalle.value;
  const proveedorActual = selProveedor.value;

  selMarca.innerHTML = '<option value="">Todas las marcas</option>' + marcas.map(m => `<option value="${m}">${m}</option>`).join('');
  selTalle.innerHTML = '<option value="">Todos los talles</option>' + talles.map(t => `<option value="${t}">${t}</option>`).join('');
  selProveedor.innerHTML = '<option value="">Todos los proveedores</option>' + proveedores.map(p => `<option value="${p}">${p}</option>`).join('');

  selMarca.value = marcas.includes(marcaActual) ? marcaActual : '';
  selTalle.value = talles.includes(talleActual) ? talleActual : '';
  selProveedor.value = proveedores.includes(proveedorActual) ? proveedorActual : '';
}

// ── Modal ─────────────────────────────────────────────────────────
function abrirModalProducto() {
  editandoId = null;
  document.getElementById('modal-producto-titulo').textContent = 'Nuevo producto';
  ['prod-codigo','prod-nombre','prod-categoria','prod-variantes','prod-vencimiento','prod-marca','prod-talle','prod-color'].forEach(id =>
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
  document.getElementById('prod-vencimiento').value    = p.vencimiento || '';
  document.getElementById('prod-marca').value          = p.marca || '';
  document.getElementById('prod-talle').value          = p.talle || '';
  document.getElementById('prod-color').value          = p.color || '';
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
    vencimiento:  document.getElementById('prod-vencimiento').value,
    marca:        document.getElementById('prod-marca').value.trim(),
    talle:        document.getElementById('prod-talle').value.trim(),
    color:        document.getElementById('prod-color').value.trim(),
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
document.getElementById('filtro-marca').addEventListener('change', function () {
  renderTabla(document.getElementById('buscar-producto').value);
});
document.getElementById('filtro-talle').addEventListener('change', function () {
  renderTabla(document.getElementById('buscar-producto').value);
});
document.getElementById('filtro-proveedor').addEventListener('change', function () {
  renderTabla(document.getElementById('buscar-producto').value);
});

renderTabla();
renderVencimientos();
