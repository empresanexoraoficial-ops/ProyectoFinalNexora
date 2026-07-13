// ventas.js — StockFlow · Nexora 2026
// Enzo Mera

let ventas     = Store.get('ventas');
let itemsVenta = [];

function actualizarListaProductos() {
  const prods = Store.get('productos');
  document.getElementById('lista-prod-venta').innerHTML =
    prods.map(p => `<option value="${p.nombre}">`).join('');
}

function agregarProductoVenta() {
  const input  = document.getElementById('venta-buscar');
  const nombre = input.value.trim();
  if (!nombre) return;
  const prods = Store.get('productos');
  const prod  = prods.find(p =>
    p.nombre.toLowerCase() === nombre.toLowerCase() || p.codigo === nombre);
  if (!prod) { mostrarToast('Producto no encontrado.', 'error'); return; }
  const existente = itemsVenta.find(i => i.productoId === prod.id);
  if (existente) existente.cantidad++;
  else itemsVenta.push({ productoId: prod.id, nombre: prod.nombre, cantidad: 1, precioUnitario: prod.precioVenta });
  input.value = '';
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

function confirmarVenta() {
  if (!itemsVenta.length) { mostrarToast('Agregá al menos un producto.', 'error'); return; }
  const sesion    = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const canal     = document.getElementById('venta-canal').value;
  const cliente   = document.getElementById('venta-cliente').value.trim();
  const email     = document.getElementById('venta-email').value.trim();
  const telefono  = document.getElementById('venta-telefono').value.trim();
  const calle     = document.getElementById('venta-calle').value.trim();
  const numero    = document.getElementById('venta-numero').value.trim();
  const barrio    = document.getElementById('venta-barrio').value.trim();
  const ciudad    = document.getElementById('venta-ciudad').value.trim();
  const total     = itemsVenta.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
  let prods = Store.get('productos');
  for (const item of itemsVenta) {
    const idx = prods.findIndex(p => p.id === item.productoId);
    if (idx >= 0) {
      if (prods[idx].stock < item.cantidad) {
        mostrarToast(`Stock insuficiente para "${item.nombre}".`, 'error'); return;
      }
      prods[idx].stock -= item.cantidad;
    }
  }
  Store.set('productos', prods);
  ventas.unshift({
    id: 'v_' + Date.now(), fecha: new Date().toISOString(),
    items: [...itemsVenta], canal, cliente, email, telefono,
    direccion: { calle, numero, barrio, ciudad },
    vendedor: sesion.nombre || sesion.email || 'Desconocido', total,
  });
  Store.set('ventas', ventas);
  itemsVenta = [];
  renderItemsVenta();
  ['venta-cliente','venta-email','venta-telefono','venta-calle','venta-numero','venta-barrio','venta-ciudad']
    .forEach(id => document.getElementById(id).value = '');
  renderTablaVentas();
  mostrarToast(`Venta registrada. Total: $${total.toFixed(2)}`, 'exito');
}

function eliminarVenta(id) {
  if (!confirm('¿Eliminar esta venta?')) return;
  ventas = ventas.filter(v => v.id !== id);
  Store.set('ventas', ventas);
  renderTablaVentas();
}

function renderTablaVentas() {
  const tbody = document.getElementById('tbody-ventas');
  if (!ventas.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;
      color:var(--texto-secundario);padding:32px">Sin ventas registradas.</td></tr>`;
    return;
  }
  tbody.innerHTML = ventas.map(v => `<tr>
    <td>${new Date(v.fecha).toLocaleString('es-UY')}</td>
    <td>${v.items.map(i => `${i.nombre} x${i.cantidad}`).join(', ')}</td>
    <td>${v.canal}</td>
    <td>${v.cliente || '—'}</td>
    <td>${v.vendedor}</td>
    <td><strong>$${Number(v.total).toFixed(2)}</strong></td>
    <td><button class="btn-peligro btn-sm"
        onclick="eliminarVenta('${v.id}')">Eliminar</button></td>
    </tr>`).join('');
}

function mostrarToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast visible ' + tipo;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

document.getElementById('venta-buscar').addEventListener('change', agregarProductoVenta);
document.getElementById('venta-buscar').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { e.preventDefault(); agregarProductoVenta(); }
});

actualizarListaProductos();
renderTablaVentas();
