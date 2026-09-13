// ventas.js — StockFlow · Nexora 2026
// Migrado a la API real. El buscador ahora trabaja con VARIANTES (no
// productos planos): cada variante ya trae sus atributos (Talle, Color,
// etc.) armados en el nombre que se busca.

let variantesCache = [];
let itemsVenta = [];

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

function etiquetaVariante(v) {
  const atrs = Object.entries(v.atributos).map(([k, val]) => `${k}: ${val}`).join(', ');
  return v.producto_nombre + (atrs ? ` (${atrs})` : '') + (v.sku ? ` — ${v.sku}` : '');
}

// Texto contra el que se filtra: nombre del producto + TODOS los valores
// de atributos (talle, color, etc.) — así buscar "azul" o "M" encuentra
// la variante correcta sin tener que escribir el nombre completo primero.
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
  const cont = document.getElementById('venta-resultados');
  if (!texto.trim()) { cont.style.display = 'none'; cont.innerHTML = ''; return; }

  const t = texto.toLowerCase();
  const coincidencias = variantesCache.filter(v => textoBusqueda(v).includes(t)).slice(0, 12);

  if (!coincidencias.length) {
    cont.innerHTML = '<div class="resultado-item" style="cursor:default;color:var(--texto-secundario)">Sin resultados.</div>';
    cont.style.display = '';
    return;
  }

  cont.innerHTML = coincidencias.map(v => {
    const atrs = Object.entries(v.atributos).map(([k, val]) => `${k}: ${val}`).join(' · ');
    const sinStock = v.stock <= 0;
    return `
      <div class="resultado-item ${sinStock ? 'sin-stock' : ''}" onclick="${sinStock ? '' : `seleccionarVariante(${v.id})`}">
        <div>
          <div class="resultado-nombre">${v.producto_nombre}</div>
          ${atrs ? `<div class="resultado-atributos">${atrs}</div>` : ''}
        </div>
        <span class="resultado-stock" style="color:${sinStock ? 'var(--color-error)' : 'var(--texto-secundario)'}">
          ${sinStock ? 'Sin stock' : v.stock + ' en stock'}
        </span>
      </div>`;
  }).join('');
  cont.style.display = '';
}

function seleccionarVariante(varianteId) {
  const variante = variantesCache.find(v => v.id === varianteId);
  if (!variante) return;

  const existente = itemsVenta.find(i => i.varianteId === variante.id);
  if (existente) existente.cantidad++;
  else itemsVenta.push({
    varianteId: variante.id,
    nombre: etiquetaVariante(variante),
    cantidad: 1,
    precioUnitario: Number(variante.precio_venta),
  });

  document.getElementById('venta-buscar').value = '';
  document.getElementById('venta-resultados').style.display = 'none';
  renderItemsVenta();
}

function renderItemsVenta() {
  const cont  = document.getElementById('lista-items-venta');
  const vacio = document.getElementById('venta-vacia');
  if (!itemsVenta.length) {
    cont.innerHTML = '';
    vacio.style.display = '';
    document.getElementById('venta-total').textContent = '$0.00';
    return;
  }
  vacio.style.display = 'none';
  cont.innerHTML = itemsVenta.map((item, idx) => `
    <div style="display:flex;align-items:center;gap:8px;background:var(--fondo-app);
                padding:8px 12px;border-radius:var(--radio)">
      <span style="flex:1;font-size:var(--texto-sm);font-weight:600">${item.nombre}</span>
      <input type="number" min="1" value="${item.cantidad}"
        style="width:60px;padding:4px 8px;border:1.5px solid var(--borde);border-radius:var(--radio)"
        onchange="cambiarCantidad(${idx}, this.value)" />
      <span style="width:70px;text-align:right">
        $${(item.cantidad * item.precioUnitario).toFixed(2)}</span>
      <button class="btn-peligro btn-sm" onclick="quitarItem(${idx})">✕</button>
    </div>`).join('');
  const total = itemsVenta.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
  document.getElementById('venta-total').textContent = '$' + total.toFixed(2);
}

function cambiarCantidad(idx, val) {
  const n = parseInt(val);
  if (n > 0) itemsVenta[idx].cantidad = n;
  renderItemsVenta();
}
function quitarItem(idx) { itemsVenta.splice(idx, 1); renderItemsVenta(); }

async function confirmarVenta() {
  if (!itemsVenta.length) { mostrarToast('Agregá al menos un producto.', 'error'); return; }

  const datosVenta = {
    canal:    document.getElementById('venta-canal').value,
    cliente_nombre:   document.getElementById('venta-cliente').value.trim(),
    cliente_email:    document.getElementById('venta-email').value.trim(),
    cliente_telefono: document.getElementById('venta-telefono').value.trim(),
    calle:  document.getElementById('venta-calle').value.trim(),
    numero: document.getElementById('venta-numero').value.trim(),
    barrio: document.getElementById('venta-barrio').value.trim(),
    ciudad: document.getElementById('venta-ciudad').value.trim(),
    items: itemsVenta.map(i => ({ variante_id: i.varianteId, cantidad: i.cantidad, precio_unitario: i.precioUnitario })),
  };

  try {
    const r = await api('/api/ventas.php', { method: 'POST', body: JSON.stringify(datosVenta) });

    itemsVenta = [];
    renderItemsVenta();
    ['venta-cliente','venta-email','venta-telefono','venta-calle','venta-numero','venta-barrio','venta-ciudad']
      .forEach(id => document.getElementById(id).value = '');

    if (r.estado === 'pendiente') {
      mostrarToast(`Venta registrada como PENDIENTE (sin stock suficiente). Total: $${Number(r.total).toFixed(2)}`, 'error');
    } else {
      mostrarToast(`Venta confirmada. Total: $${Number(r.total).toFixed(2)}`, 'exito');
    }
    cargarVariantes();  // refresca stock
    renderTablaVentas();
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

async function renderTablaVentas() {
  const tbody = document.getElementById('tbody-ventas');
  try {
    const r = await api('/api/ventas.php');
    if (!r.ventas.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;
        color:var(--texto-secundario);padding:32px">Sin ventas registradas.</td></tr>`;
      return;
    }
    tbody.innerHTML = r.ventas.map(v => `<tr>
      <td>${new Date(v.fecha).toLocaleString('es-UY')}</td>
      <td>Venta #${v.id}</td>
      <td>${v.canal || '—'}</td>
      <td>${v.cliente_nombre || '—'}</td>
      <td>${v.estado === 'pendiente' ? '<span style="color:var(--color-error);font-weight:600">Pendiente</span>' : 'Confirmada'}</td>
      <td><strong>$${Number(v.total).toFixed(2)}</strong></td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--color-error)">${e.message}</td></tr>`;
  }
}

document.getElementById('venta-buscar').addEventListener('input', function () {
  renderResultadosBusqueda(this.value);
});
document.addEventListener('click', function (e) {
  if (!e.target.closest('#venta-buscar') && !e.target.closest('#venta-resultados')) {
    document.getElementById('venta-resultados').style.display = 'none';
  }
});

cargarVariantes();
renderTablaVentas();
